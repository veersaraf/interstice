/**
 * Heartbeat Server — Entry point for the agent orchestration engine.
 *
 * Run alongside Next.js:
 *   npx tsx lib/server.ts
 *
 * This process:
 * 1. Connects to Convex
 * 2. Polls for pending tasks every 3 seconds
 * 3. Spawns Claude CLI subprocesses for agents with work
 * 4. Streams output to Convex activity log
 * 5. Handles CEO delegation (parsing subtask JSON)
 * 6. Posts findings for inter-agent communication
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { startHeartbeat } from "./heartbeat";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  process.exit(1);
}

console.log("=================================");
console.log("  Interstice Heartbeat Server");
console.log("=================================");
console.log(`Convex URL: ${CONVEX_URL}`);
console.log("Starting heartbeat scheduler...\n");

const stop = startHeartbeat(CONVEX_URL);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down heartbeat...");
  stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down heartbeat...");
  stop();
  process.exit(0);
});
