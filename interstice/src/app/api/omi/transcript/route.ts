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
 * Webhook URL to register in OMI developer console:
 *   https://[ngrok-url]/api/omi/transcript
 *
 * Capabilities needed: external_integration, proactive_notification
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

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

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

async function fireCommand(uid: string, command: string) {
  if (command.length < MIN_COMMAND_LENGTH) return;

  console.log(`[OMI] 🎤 Command from uid=${uid}: "${command}"`);

  const convex = getConvex();

  try {
    const ceo = await convex.query(api.agents.getByName, { name: "ceo" });
    if (!ceo) {
      console.error("[OMI] CEO agent not found — run seed first");
      return;
    }

    // Tag the task with the OMI uid so we can route the response back
    const taggedInput = `[OMI_UID:${uid}]\n\n${command}`;

    const taskId = await convex.mutation(api.tasks.create, {
      agentId: ceo._id,
      input: taggedInput,
    });

    await convex.mutation(api.activity.log, {
      action: "omi_command",
      content: `🎤 Voice command: "${command}"`,
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
    segments = await req.json();
    if (!Array.isArray(segments)) {
      return NextResponse.json({ error: "Expected array of segments" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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

  const capturedBuffer = buffer;
  capturedBuffer.timer = setTimeout(async () => {
    const command = capturedBuffer.text.trim();
    capturedBuffer.text = "";
    capturedBuffer.timer = null;

    if (command) {
      await fireCommand(capturedBuffer.uid, command);
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
