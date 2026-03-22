/**
 * OMI Outbound Notification Helper
 *
 * Sends a proactive notification back to the OMI device.
 * The user's CEO response speaks back through their wrist.
 *
 * Requires in .env.local:
 *   OMI_APP_ID=<your app id from omi developer console>
 *   OMI_APP_SECRET=<your app secret> (optional — falls back to OMI_APP_ID)
 *
 * OMI Notification API:
 *   POST https://api.omi.me/v2/integrations/{app_id}/notification?uid={uid}&message={message}
 *   Authorization: Bearer <APP_SECRET or APP_ID>
 */

export async function sendOmiNotification(uid: string, message: string): Promise<boolean> {
  const appId = process.env.OMI_APP_ID;
  // OMI app secret — falls back to app ID (many OMI integrations use the ID as the auth token)
  const appSecret = process.env.OMI_APP_SECRET || appId;

  if (!appId) {
    console.warn("[OMI] OMI_APP_ID not set — skipping notification");
    console.log(`[OMI] Would have sent to uid=${uid}: "${message.substring(0, 100)}..."`);
    return false;
  }

  // OMI limits messages to ~500 chars — truncate gracefully
  const truncated = message.length > 480
    ? message.substring(0, 477) + "..."
    : message;

  const url = `https://api.omi.me/v2/integrations/${appId}/notification?uid=${encodeURIComponent(uid)}&message=${encodeURIComponent(truncated)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appSecret}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[OMI] Notification failed: ${res.status} — ${text}`);
      return false;
    }

    console.log(`[OMI] ✅ Notification sent to uid=${uid}: "${truncated.substring(0, 60)}..."`);
    return true;
  } catch (err) {
    console.error("[OMI] Notification request failed:", err);
    return false;
  }
}

/**
 * Extract OMI uid from a tagged task input string.
 * Tasks from OMI are prefixed with [OMI_UID:xxx]
 */
export function extractOmiUid(taskInput: string): string | null {
  const match = taskInput.match(/\[OMI_UID:(.+?)\]/);
  return match ? match[1] : null;
}
