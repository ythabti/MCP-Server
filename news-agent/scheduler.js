import cron from "node-cron";
import dotenv from "dotenv";
import { run } from "./agent.js";

dotenv.config();

const SCHEDULE = process.env.SEND_TIME || "0 8 * * *";

if (!cron.validate(SCHEDULE)) {
  console.error(`Invalid cron expression in SEND_TIME: "${SCHEDULE}"`);
  process.exit(1);
}

console.log(`IT News Agent scheduler started.`);
console.log(`Schedule: "${SCHEDULE}" (cron format)`);
console.log(`Next run: use 'npm run send-now' to trigger immediately for testing.`);
console.log(`Waiting for next scheduled time...`);

cron.schedule(SCHEDULE, () => {
  console.log(`\nCron fired — running daily IT news report...`);
  run().catch((err) => {
    console.error("Agent run failed:", err.message);
  });
});
