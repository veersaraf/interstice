/**
 * Make Call Skill — ElevenLabs Conversational AI + Twilio outbound call
 *
 * Usage from CLI: npx tsx skills/make_call.ts "+1234567890" "Your call script here"
 *
 * The Call Agent invokes this after approval to place a real outbound phone call.
 * ElevenLabs handles the voice conversation using the provided script as context.
 *
 * Required env vars in .env.local:
 *   ELEVENLABS_API_KEY          — ElevenLabs API key
 *   ELEVENLABS_AGENT_ID         — Conversational AI agent ID (from ElevenLabs dashboard)
 *   ELEVENLABS_PHONE_NUMBER_ID  — Phone number ID registered in ElevenLabs (linked to Twilio)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const ELEVENLABS_PHONE_NUMBER_ID = process.env.ELEVENLABS_PHONE_NUMBER_ID;

interface CallResult {
  success: boolean;
  callSid?: string;
  conversationId?: string;
  message: string;
}

export async function makeCall(
  toNumber: string,
  callScript: string
): Promise<CallResult> {
  if (!ELEVENLABS_API_KEY) {
    return { success: false, message: "ERROR: ELEVENLABS_API_KEY not set in .env.local" };
  }
  if (!ELEVENLABS_AGENT_ID) {
    return { success: false, message: "ERROR: ELEVENLABS_AGENT_ID not set in .env.local" };
  }
  if (!ELEVENLABS_PHONE_NUMBER_ID) {
    return { success: false, message: "ERROR: ELEVENLABS_PHONE_NUMBER_ID not set in .env.local" };
  }

  // Normalize phone number — must be E.164 format
  const normalized = toNumber.trim().replace(/\s+/g, "");
  if (!normalized.startsWith("+")) {
    return { success: false, message: `ERROR: Phone number must be in E.164 format (e.g., +14155551234). Got: ${toNumber}` };
  }

  console.log(`[make_call] Initiating outbound call to ${normalized}...`);

  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/twilio/outbound_call",
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: ELEVENLABS_AGENT_ID,
        agent_phone_number_id: ELEVENLABS_PHONE_NUMBER_ID,
        to_number: normalized,
        conversation_initiation_client_data: {
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: callScript,
              },
              first_message: extractOpeningLine(callScript),
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: ElevenLabs API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    callSid: data.call_sid,
    conversationId: data.conversation_id,
    message: `Call initiated to ${normalized}. Call SID: ${data.call_sid || "pending"}. Conversation ID: ${data.conversation_id || "pending"}.`,
  };
}

/**
 * Extract the opening line from a call script for ElevenLabs first_message.
 * Looks for text under "### Opening" or falls back to a generic greeting.
 */
function extractOpeningLine(script: string): string {
  const openingMatch = script.match(/###\s*Opening\s*\n([^\n]+)/);
  if (openingMatch) return openingMatch[1].trim();

  // Generic opener
  return "Hello, this is an AI assistant calling on behalf of Interstice.";
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
