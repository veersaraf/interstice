/**
 * OMI Transcript Webhook
 *
 * OMI fires POST requests here as the user speaks.
 * Each request contains an array of transcript segments.
 *
 * We buffer segments per session and after 2.5s of silence,
 * treat the buffered text as a complete voice command
 * and create a CEO task in Convex.
 *
 * Voice approval: If the command matches "approve" or "deny",
 * route it to the approval system instead of creating a new task.
 *
 * Webhook URL to register in OMI developer console:
 *   https://[ngrok-url]/api/omi/transcript
 *
 * Capabilities needed: external_integration, proactive_notification
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { sendOmiNotification } from "../../../../../lib/omi";

interface TranscriptSegment {
  text?: string;
  speaker?: string;
  is_user?: boolean;
  start?: number;
  end?: number;
}

interface SessionBuffer {
  text: string;
  uid: string;
  timer: ReturnType<typeof setTimeout> | null;
}

// In-memory buffer per OMI session (works fine in single Node.js process)
const sessionBuffers = new Map<string, SessionBuffer>();

const SILENCE_TIMEOUT_MS = 2500; // fire command after 2.5s of no new segments
const MIN_COMMAND_LENGTH = 5;    // ignore very short fragments

// Wake word — command must start with one of these to be processed
// This prevents random ambient speech from triggering the CEO
const WAKE_WORDS = /^\s*(hey\s+interstice|interstice|hey\s+ceo)\s*[,:]?\s*/i;

// Voice approval patterns (these bypass the wake word requirement)
const APPROVE_PATTERNS = /^\s*(approve|yes|confirm|go ahead|send it|do it)\s*$/i;
const DENY_PATTERNS = /^\s*(deny|no|cancel|stop|don't|reject)\s*$/i;

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

/**
 * Check if the command is an approval/denial voice command.
 * If there's a pending approval, resolve it and return true.
 */
async function tryHandleApprovalVoice(uid: string, command: string): Promise<boolean> {
  const isApprove = APPROVE_PATTERNS.test(command);
  const isDeny = DENY_PATTERNS.test(command);

  if (!isApprove && !isDeny) return false;

  const convex = getConvex();

  try {
    const pendingApprovals = await convex.query(api.approvals.listPending);
    if (pendingApprovals.length === 0) return false;

    // Resolve the most recent pending approval
    const latest = pendingApprovals[pendingApprovals.length - 1];
    const decision = isApprove ? "approve" : "deny";

    console.log(`[OMI] Voice ${decision} for approval ${latest._id}: "${command}"`);

    // Call the approve API endpoint to handle post-action execution
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approvalId: latest._id,
        decision,
      }),
    });

    if (!res.ok) {
      console.error(`[OMI] Approval API returned ${res.status}`);
      await sendOmiNotification(uid, `Failed to ${decision} — please use the dashboard.`);
      return true;
    }

    const actionLabel = latest.action || "action";
    const msg = isApprove
      ? `Approved: ${actionLabel}. Executing now.`
      : `Denied: ${actionLabel}. Task cancelled.`;

    await sendOmiNotification(uid, msg);

    await convex.mutation(api.activity.log, {
      action: `omi_voice_${decision}`,
      content: `🎤 Voice ${decision}: ${actionLabel}`,
      taskId: latest.taskId,
    });

    return true;
  } catch (err) {
    console.error("[OMI] Voice approval handling failed:", err);
    return false;
  }
}

async function fireCommand(uid: string, command: string, sessionId: string) {
  if (command.length < MIN_COMMAND_LENGTH) return;

  console.log(`[OMI] 🎤 Received from uid=${uid}: "${command}"`);

  // Check if this is a voice approval/denial (bypass wake word)
  const handled = await tryHandleApprovalVoice(uid, command);
  if (handled) return;

  // Check for wake word — ignore ambient speech without it
  const wakeMatch = command.match(WAKE_WORDS);
  if (!wakeMatch) {
    console.log(`[OMI] Ignoring (no wake word): "${command.substring(0, 80)}"`);
    return;
  }

  // Strip the wake word from the command
  const actualCommand = command.replace(WAKE_WORDS, "").trim();
  if (actualCommand.length < MIN_COMMAND_LENGTH) {
    console.log(`[OMI] Ignoring (command too short after wake word): "${actualCommand}"`);
    return;
  }

  console.log(`[OMI] 🎤 Command from uid=${uid}: "${actualCommand}"`);

  const convex = getConvex();

  // Track OMI session
  try {
    await convex.mutation(api.omi_sessions.upsert, {
      uid,
      sessionId,
      lastTranscript: actualCommand,
    });
  } catch (err) {
    console.error("[OMI] Failed to track session:", err);
  }

  // Create a new CEO task
  try {
    const ceo = await convex.query(api.agents.getByName, { name: "ceo" });
    if (!ceo) {
      console.error("[OMI] CEO agent not found — run seed first");
      return;
    }

    // Tag the task with the OMI uid so we can route the response back
    const taggedInput = `[OMI_UID:${uid}]\n\n${actualCommand}`;

    const taskId = await convex.mutation(api.tasks.create, {
      agentId: ceo._id,
      input: taggedInput,
    });

    await convex.mutation(api.activity.log, {
      action: "omi_command",
      content: `🎤 Voice command: "${actualCommand}"`,
      taskId,
    });

    console.log(`[OMI] Created CEO task ${taskId}`);
  } catch (err) {
    console.error("[OMI] Failed to create CEO task:", err);
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id") || "default";
  const uid = searchParams.get("uid") || "default";

  let segments: TranscriptSegment[];
  try {
    const body = await req.json();

    // OMI sends different payload formats depending on the event type:
    // - Realtime transcript: array of segments directly
    // - Memory/processed: { "segments": [...] } or { "transcript_segments": [...] }
    // - Memory created: { "text": "...", "structured": {...} }
    if (Array.isArray(body)) {
      segments = body;
    } else if (body && typeof body === "object") {
      if (Array.isArray(body.segments)) {
        segments = body.segments;
      } else if (Array.isArray(body.transcript_segments)) {
        segments = body.transcript_segments;
      } else if (typeof body.text === "string" && body.text.trim()) {
        // Memory/processed event — treat the text as a single segment
        segments = [{ text: body.text, is_user: true }];
      } else {
        // Unknown object format — log it for debugging and accept gracefully
        console.log(`[OMI] Unknown payload format:`, JSON.stringify(body).substring(0, 500));
        return NextResponse.json({ status: "unknown_format", received: Object.keys(body) });
      }
    } else {
      return NextResponse.json({ status: "empty_payload" });
    }
  } catch {
    // Body might be empty or not JSON — OMI sometimes sends empty pings
    return NextResponse.json({ status: "no_body" });
  }

  // Extract user speech from segments
  const userText = segments
    .filter((s) => s.is_user !== false && s.text)
    .map((s) => s.text!.trim())
    .filter(Boolean)
    .join(" ");

  if (!userText) {
    return NextResponse.json({ status: "no_user_speech" });
  }

  // Get or create buffer for this session
  let buffer = sessionBuffers.get(sessionId);
  if (!buffer) {
    buffer = { text: "", uid, timer: null };
    sessionBuffers.set(sessionId, buffer);
  }

  // Append and update uid
  buffer.text = (buffer.text + " " + userText).trim();
  buffer.uid = uid;

  // Reset silence timer
  if (buffer.timer) clearTimeout(buffer.timer);

  const capturedSessionId = sessionId;
  const capturedBuffer = buffer;
  capturedBuffer.timer = setTimeout(async () => {
    const command = capturedBuffer.text.trim();
    capturedBuffer.text = "";
    capturedBuffer.timer = null;

    if (command) {
      await fireCommand(capturedBuffer.uid, command, capturedSessionId);
    }
  }, SILENCE_TIMEOUT_MS);

  return NextResponse.json({
    status: "buffered",
    sessionId,
    uid,
    bufferedLength: buffer.text.length,
  });
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "OMI transcript webhook is live",
    activeBuffers: sessionBuffers.size,
  });
}
