/**
 * OMI Notification Endpoint
 *
 * POST /api/omi/notify
 * Body: { "uid": "...", "message": "..." }
 *
 * Sends a proactive notification to an OMI user device.
 * Used by the system to send CEO responses, approval updates, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendOmiNotification } from "../../../../../lib/omi";

export async function POST(req: NextRequest) {
  let body: { uid?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { uid, message } = body;
  if (!uid || !message) {
    return NextResponse.json(
      { error: "Missing 'uid' or 'message'" },
      { status: 400 }
    );
  }

  const sent = await sendOmiNotification(uid, message);

  return NextResponse.json({
    status: sent ? "sent" : "skipped",
    uid,
    messageLength: message.length,
  });
}
