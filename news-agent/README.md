# IT News Agent

A daily IT news digest delivered to your inbox. Fetches top stories from Hacker News and NewsAPI, uses **Google Gemini** (free) to pick and summarize the 10 most important ones, then sends a styled HTML email via **Resend**.

## How it works

```
Hacker News API ─┐
                 ├─► Gemini 2.0 Flash (summarize & categorize) ─► Resend ─► Your inbox
NewsAPI.org ─────┘
```

Runs on a daily cron schedule — no cloud infrastructure needed, just `node scheduler.js`.

## Setup

### 1. Install dependencies

```bash
cd news-agent
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then fill in `.env`:

| Variable | Required | Where to get it |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — free, no credit card |
| `RESEND_API_KEY` | ✅ | [resend.com](https://resend.com) — free tier (3000 emails/month) |
| `RECIPIENT_EMAIL` | ✅ | Your email address |
| `NEWS_API_KEY` | optional | [newsapi.org](https://newsapi.org) — free tier (100 req/day). If omitted, uses Hacker News only |
| `EMAIL_FROM` | optional | Sender address. Defaults to `onboarding@resend.dev` (Resend test address) |
| `SEND_TIME` | optional | Cron schedule. Defaults to `0 8 * * *` (8 AM daily) |

> **Resend note:** The default `onboarding@resend.dev` sender only delivers to the email address registered on your Resend account. To send to any address, add and verify your own domain in Resend.

### 3. Test immediately

```bash
npm run send-now
```

### 4. Start the daily scheduler

```bash
npm start
```

Keep this process running (e.g. in a terminal, via `pm2`, or a systemd service) and it will send the report automatically every day at the configured time.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the scheduler (runs daily at `SEND_TIME`) |
| `npm run send-now` | Send one report immediately (for testing) |

## Email categories

Stories are automatically classified into one of:

`AI/ML` · `Security` · `Cloud` · `Developer Tools` · `Hardware` · `Industry News` · `Open Source` · `Web/Mobile`

## Cost

| Service | Free tier |
|---|---|
| Gemini 2.0 Flash | 1500 requests/day — **more than enough** for 1 req/day |
| Hacker News API | Unlimited, no key needed |
| NewsAPI.org | 100 requests/day |
| Resend | 3000 emails/month |

**Total cost: $0**

## File structure

```
news-agent/
├── agent.js        # Core pipeline: fetch → AI summarize → email
├── scheduler.js    # Daily cron runner
├── run.js          # One-shot trigger for testing
├── .env            # Your secrets (never commit this)
└── .env.example    # Template for required variables
```
