import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchHackerNews() {
  try {
    const ids = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
      .then((r) => r.json());

    const top25 = ids.slice(0, 25);
    const stories = await Promise.all(
      top25.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())
      )
    );

    return stories
      .filter((s) => s && s.type === "story" && s.url && s.title)
      .map((s) => ({
        title: s.title,
        url: s.url,
        source: "Hacker News",
        points: s.score,
        comments: s.descendants || 0,
      }));
  } catch (err) {
    console.error("HackerNews fetch failed:", err.message);
    return [];
  }
}

async function fetchNewsAPI() {
  if (!process.env.NEWS_API_KEY) return [];

  try {
    const url = `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;
    const data = await fetch(url).then((r) => r.json());

    if (data.status !== "ok") {
      console.error("NewsAPI error:", data.message);
      return [];
    }

    return data.articles
      .filter((a) => a.title && a.url && !a.title.includes("[Removed]"))
      .map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source?.name || "NewsAPI",
        description: a.description,
      }));
  } catch (err) {
    console.error("NewsAPI fetch failed:", err.message);
    return [];
  }
}

// ── Gemini summarization ──────────────────────────────────────────────────────

async function summarizeWithGemini(hnStories, newsApiStories) {
  const hnList = hnStories
    .map((s) => `• [HN] ${s.title} (${s.points} pts) — ${s.url}`)
    .join("\n");

  const newsList = newsApiStories
    .map((s) => `• [${s.source}] ${s.title}${s.description ? ` — ${s.description}` : ""} — ${s.url}`)
    .join("\n");

  const prompt = `You are an expert IT news curator writing for technology professionals.

Here are today's top stories from Hacker News and NewsAPI:

HACKER NEWS:
${hnList || "(no stories fetched)"}

NEWS API:
${newsList || "(no stories fetched — key may not be configured)"}

Your task:
1. Select the 10 most important and interesting IT/technology stories from the combined list above.
2. Prioritize: AI/ML advances, security vulnerabilities, major product launches, developer tools, cloud infrastructure changes, and significant industry moves.
3. Avoid: duplicates, marketing fluff, opinion pieces with no news value.

For each story, return:
- title: original headline (keep it verbatim)
- category: exactly one of — AI/ML, Security, Cloud, Developer Tools, Hardware, Industry News, Open Source, Web/Mobile
- summary: 2-3 sentences explaining what happened and why it matters to IT professionals
- url: the original URL
- source: the source name

Respond with ONLY a valid JSON array — no explanation, no markdown fences, just raw JSON:
[
  {
    "title": "...",
    "category": "...",
    "summary": "...",
    "url": "...",
    "source": "..."
  }
]`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const text = response.text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gemini did not return a JSON array");

  return JSON.parse(jsonMatch[0]);
}

// ── Email builder ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  "AI/ML":           "#6366f1",
  "Security":        "#ef4444",
  "Cloud":           "#3b82f6",
  "Developer Tools": "#10b981",
  "Hardware":        "#f59e0b",
  "Industry News":   "#8b5cf6",
  "Open Source":     "#06b6d4",
  "Web/Mobile":      "#ec4899",
};

function buildEmailHTML(stories, dateStr) {
  const cards = stories
    .map((s) => {
      const color = CATEGORY_COLORS[s.category] ?? "#6b7280";
      return `
      <div style="background:#ffffff;border-radius:10px;padding:20px 24px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-left:4px solid ${color};">
        <div style="margin-bottom:10px;">
          <span style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:700;letter-spacing:.5px;padding:3px 10px;border-radius:20px;text-transform:uppercase;">${s.category}</span>
          <span style="color:#9ca3af;font-size:12px;margin-left:10px;">${s.source}</span>
        </div>
        <h3 style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111827;line-height:1.4;">
          <a href="${s.url}" style="color:#111827;text-decoration:none;">${s.title}</a>
        </h3>
        <p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.65;">${s.summary}</p>
        <a href="${s.url}" style="color:#2563eb;font-size:13px;font-weight:600;text-decoration:none;">Read full story &rarr;</a>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Daily IT News &mdash; ${dateStr}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:28px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a8a 0%,#5b21b6 100%);border-radius:14px;padding:36px 32px;margin-bottom:24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:10px;">&#128225;</div>
      <h1 style="margin:0 0 6px;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-.3px;">Daily IT News</h1>
      <p style="margin:0;color:#bfdbfe;font-size:14px;">${dateStr} &bull; Top ${stories.length} stories curated by AI</p>
    </div>

    <!-- Story cards -->
    ${cards}

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0 8px;color:#9ca3af;font-size:12px;line-height:1.8;">
      <p style="margin:0;">Powered by <strong>Gemini 2.0 Flash</strong> &bull; Sources: Hacker News &amp; NewsAPI</p>
      <p style="margin:0;">You receive this because you configured the IT News Agent.</p>
    </div>

  </div>
</body>
</html>`;
}

// ── Main runner ───────────────────────────────────────────────────────────────

export async function run() {
  const required = ["GEMINI_API_KEY", "RESEND_API_KEY", "RECIPIENT_EMAIL"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  console.log(`[${new Date().toISOString()}] Starting IT News Agent — ${dateStr}`);

  const [hnStories, newsApiStories] = await Promise.all([
    fetchHackerNews(),
    fetchNewsAPI(),
  ]);

  console.log(`Fetched ${hnStories.length} HN stories, ${newsApiStories.length} NewsAPI stories`);

  if (hnStories.length + newsApiStories.length === 0) {
    throw new Error("No stories fetched from any source — check network/API keys");
  }

  const topStories = await summarizeWithGemini(hnStories, newsApiStories);
  console.log(`Gemini selected ${topStories.length} top stories`);

  const html = buildEmailHTML(topStories, dateStr);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "IT News Agent <onboarding@resend.dev>",
    to: [process.env.RECIPIENT_EMAIL],
    subject: `Daily IT News — ${dateStr}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);

  console.log(`Email sent successfully! ID: ${data?.id}`);
  return data;
}
