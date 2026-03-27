/**
 * Bland Call Skill — Bland AI outbound calls (PRIZE: $1,500)
 *
 * Usage from CLI: npx tsx skills/bland_call.ts "+1234567890" "Your call script here"
 *
 * The Outreach Agent invokes this after approval to place a real outbound phone call
 * via Bland AI's conversational API.
 *
 * Required env vars in .env.local:
 *   BLAND_API_KEY — Bland AI API key
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const BLAND_API_KEY = process.env.BLAND_API_KEY;

interface BlandCallResult {
  success: boolean;
  callId?: string;
  status?: string;
  transcript?: string;
  message: string;
}

export async function blandCall(
  phoneNumber: string,
  script: string
): Promise<BlandCallResult> {
  if (!BLAND_API_KEY) {
    return {
      success: false,
      message: "ERROR: BLAND_API_KEY not set in .env.local. Get one at https://app.bland.ai",
    };
  }

  const normalized = phoneNumber.trim().replace(/\s+/g, "");
  if (!normalized.startsWith("+")) {
    return {
      success: false,
      message: `ERROR: Phone number must be E.164 format (e.g., +14155551234). Got: ${phoneNumber}`,
    };
  }

  console.log(`[bland_call] Initiating Bland AI call to ${normalized}...`);

  const response = await fetch("https://api.bland.ai/v1/calls", {
    method: "POST",
    headers: {
      Authorization: BLAND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: normalized,
      task: script,
      voice: "maya",
      wait_for_greeting: true,
      record: true,
      max_duration: 300,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Bland AI API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    callId: data.call_id,
    status: data.status || "queued",
    message: `Call initiated to ${normalized}. Call ID: ${data.call_id || "pending"}. Status: ${data.status || "queued"}.`,
  };
}

export async function getCallTranscript(callId: string): Promise<BlandCallResult> {
  if (!BLAND_API_KEY) {
    return { success: false, message: "ERROR: BLAND_API_KEY not set in .env.local" };
  }

  const response = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
    headers: { Authorization: BLAND_API_KEY },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Bland AI API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    callId,
    status: data.status,
    transcript: data.transcripts
      ? data.transcripts.map((t: { text: string; user: string }) => `${t.user}: ${t.text}`).join("\n")
      : data.concatenated_transcript || "No transcript available yet.",
    message: `Call ${callId} — Status: ${data.status}. Duration: ${data.call_length || "N/A"}s.`,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes("bland_call")) {
  const phoneNumber = process.argv[2];
  const script = process.argv.slice(3).join(" ");

  if (!phoneNumber || !script) {
    console.error("Usage: npx tsx skills/bland_call.ts <+phone_number> <call script>");
    process.exit(1);
  }

  blandCall(phoneNumber, script)
    .then((result) => {
      console.log(result.message);
      if (!result.success) process.exit(1);
    })
    .catch((err) => {
      console.error("Bland call error:", err);
      process.exit(1);
    });
}
