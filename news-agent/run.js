import { run } from "./agent.js";

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
