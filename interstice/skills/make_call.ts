/**
 * Make Call Skill — Vapi outbound call
 *
 * Usage from CLI: npx tsx skills/make_call.ts "+1234567890" "Your call script here"
 *
 * The Call Agent invokes this after approval to place a real outbound phone call.
 * Vapi handles the voice conversation using the provided script as context.
 *
 * Required env vars in .env.local:
 *   VAPI_API_KEY           — Vapi API key
 *   VAPI_PHONE_NUMBER_ID   — Phone number ID from Vapi dashboard
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;

interface CallResult {
  success: boolean;
  callId?: string;
  message: string;
}

export async function makeCall(
  toNumber: string,
  callScript: string
): Promise<CallResult> {
  if (!VAPI_API_KEY) {
    return { success: false, message: "ERROR: VAPI_API_KEY not set in .env.local" };
  }
  if (!VAPI_PHONE_NUMBER_ID) {
    return { success: false, message: "ERROR: VAPI_PHONE_NUMBER_ID not set in .env.local" };
  }

  // Normalize phone number — must be E.164 format
  const normalized = toNumber.trim().replace(/\s+/g, "");
  if (!normalized.startsWith("+")) {
    return { success: false, message: `ERROR: Phone number must be in E.164 format (e.g., +14155551234). Got: ${toNumber}` };
  }

  console.log(`[make_call] Initiating Vapi outbound call to ${normalized}...`);

  const response = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: {
        number: normalized,
      },
      assistant: {
        firstMessage: extractOpeningLine(callScript),
        model: {
          provider: "anthropic",
          model: "claude-sonnet-4-20250514",
          messages: [
            {
              role: "system",
              content: `You are a natural, confident human caller representing Interstice. Speak conversationally — use contractions, brief pauses, and vary your tone like a real person. Never sound like you're reading a script. Be warm and personable.\n\n${callScript}`,
            },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily — natural, warm, conversational female voice
          stability: 0.4,          // Lower = more expressive variation
          similarityBoost: 0.75,   // Keep voice identity but allow natural variation
          style: 0.3,              // Subtle stylistic expression
          useSpeakerBoost: true,   // Clearer, more present voice
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Vapi API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    callId: data.id,
    message: `Call initiated to ${normalized}. Call ID: ${data.id || "pending"}. Status: ${data.status || "queued"}.`,
  };
}

/**
 * Extract the opening line from a call script for the first_message.
 * Looks for text under "### Opening" or falls back to a generic greeting.
 */
function extractOpeningLine(script: string): string {
  const openingMatch = script.match(/###\s*Opening\s*\n([^\n]+)/);
  if (openingMatch) return openingMatch[1].trim();

  // Generic opener — conversational, not robotic
  return "Hey there! I'm calling from Interstice — got a moment?";
}

/**
 * Parse a phone number from the call script details.
 * Matches patterns like:
 *   **Calling:** John at +14155551234
 *   **Calling:** +14155551234
 *   Calling +14155551234
 */
export function parsePhoneNumber(details: string): string | null {
  // Match E.164 number
  const e164 = details.match(/\+1?\d{10,14}/);
  if (e164) return e164[0];

  // Match 10-digit US number without +1
  const us10 = details.match(/\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/);
  if (us10) return `+1${us10[1].replace(/[-.\s]/g, "")}`;

  return null;
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes("make_call")) {
  const toNumber = process.argv[2];
  const callScript = process.argv.slice(3).join(" ");

  if (!toNumber || !callScript) {
    console.error("Usage: npx tsx skills/make_call.ts <+phone_number> <call script>");
    process.exit(1);
  }

  makeCall(toNumber, callScript)
    .then((result) => {
      console.log(result.message);
      if (!result.success) process.exit(1);
    })
    .catch((err) => {
      console.error("Call error:", err);
      process.exit(1);
    });
}
