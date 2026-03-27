/**
 * Airbyte Fetch Skill — Pull data from external business sources (PRIZE: $1,750)
 *
 * Usage from CLI: npx tsx skills/airbyte_fetch.ts "connection-id" "stream-name"
 *
 * Pulls data from external business sources via Airbyte's API.
 * The Research Agent uses this to gather structured business data.
 *
 * Authentication: Uses OAuth2 client credentials to auto-refresh tokens.
 * No more manually pasting short-lived JWTs.
 *
 * Required env vars in .env.local:
 *   AIRBYTE_CLIENT_ID     — Airbyte application client ID
 *   AIRBYTE_CLIENT_SECRET — Airbyte application client secret
 *   AIRBYTE_API_URL       — Airbyte API base URL (default: https://api.airbyte.com)
 *
 * Legacy fallback: If AIRBYTE_API_KEY is set (raw JWT), it will be used directly
 * but will expire. Prefer client credentials for long-term use.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const AIRBYTE_CLIENT_ID = process.env.AIRBYTE_CLIENT_ID;
const AIRBYTE_CLIENT_SECRET = process.env.AIRBYTE_CLIENT_SECRET;
const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY; // legacy fallback
const AIRBYTE_API_URL = process.env.AIRBYTE_API_URL || "https://api.airbyte.com";
const AIRBYTE_TOKEN_URL =
  "https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token";

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Get a valid access token, refreshing via client credentials if needed.
 */
async function getAccessToken(): Promise<string> {
  // If we have a cached token that's still valid (with 60s buffer), use it
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  // If we have client credentials, use OAuth2 client_credentials flow
  if (AIRBYTE_CLIENT_ID && AIRBYTE_CLIENT_SECRET) {
    console.log("[airbyte] Refreshing access token via client credentials...");

    const response = await fetch(AIRBYTE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AIRBYTE_CLIENT_ID,
        client_secret: AIRBYTE_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // expires_in is in seconds, convert to ms and add to current time
    tokenExpiresAt = Date.now() + (data.expires_in || 900) * 1000;

    console.log(`[airbyte] Token refreshed, expires in ${data.expires_in}s`);
    return cachedToken!;
  }

  // Legacy fallback: use raw JWT from AIRBYTE_API_KEY
  if (AIRBYTE_API_KEY) {
    return AIRBYTE_API_KEY;
  }

  throw new Error(
    "No Airbyte credentials configured. Set AIRBYTE_CLIENT_ID + AIRBYTE_CLIENT_SECRET in .env.local (preferred), or AIRBYTE_API_KEY as legacy fallback."
  );
}

interface AirbyteResult {
  success: boolean;
  data?: unknown;
  jobId?: string;
  message: string;
}

/**
 * Make an authenticated Airbyte API request.
 */
async function airbyteRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${AIRBYTE_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

/**
 * Trigger a sync job for a given connection.
 */
export async function triggerSync(connectionId: string): Promise<AirbyteResult> {
  const response = await airbyteRequest("/v1/jobs", {
    method: "POST",
    body: JSON.stringify({ connectionId, jobType: "sync" }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Airbyte API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    jobId: data.jobId,
    message: `Sync triggered for connection ${connectionId}. Job ID: ${data.jobId}. Status: ${data.status}.`,
  };
}

/**
 * Get the status of a sync job.
 */
export async function getJobStatus(jobId: string): Promise<AirbyteResult> {
  const response = await airbyteRequest(`/v1/jobs/${jobId}`);

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Airbyte API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    data,
    jobId,
    message: `Job ${jobId}: ${data.status}. Bytes synced: ${data.bytesSynced || 0}. Records: ${data.rowsSynced || 0}.`,
  };
}

/**
 * List available connections.
 */
export async function listConnections(): Promise<AirbyteResult> {
  const response = await airbyteRequest("/v1/connections");

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Airbyte API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();
  const connections = data.data || [];

  return {
    success: true,
    data: connections,
    message: `Found ${connections.length} connections: ${connections.map((c: { name: string }) => c.name).join(", ") || "none"}`,
  };
}

/**
 * List available workspaces.
 */
export async function listWorkspaces(): Promise<AirbyteResult> {
  const response = await airbyteRequest("/v1/workspaces");

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Airbyte API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();
  const workspaces = data.data || [];

  return {
    success: true,
    data: workspaces,
    message: `Found ${workspaces.length} workspaces: ${workspaces.map((w: { name: string; workspaceId: string }) => `${w.name} (${w.workspaceId})`).join(", ") || "none"}`,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes("airbyte_fetch")) {
  const action = process.argv[2] || "list";

  const run = async () => {
    if (action === "list") {
      const result = await listConnections();
      console.log(result.message);
      if (result.data) console.log(JSON.stringify(result.data, null, 2));
    } else if (action === "workspaces") {
      const result = await listWorkspaces();
      console.log(result.message);
      if (result.data) console.log(JSON.stringify(result.data, null, 2));
    } else if (action === "sync") {
      const connectionId = process.argv[3];
      if (!connectionId) {
        console.error("Usage: npx tsx skills/airbyte_fetch.ts sync <connection-id>");
        process.exit(1);
      }
      const result = await triggerSync(connectionId);
      console.log(result.message);
    } else if (action === "status") {
      const jobId = process.argv[3];
      if (!jobId) {
        console.error("Usage: npx tsx skills/airbyte_fetch.ts status <job-id>");
        process.exit(1);
      }
      const result = await getJobStatus(jobId);
      console.log(result.message);
    } else {
      console.error("Usage: npx tsx skills/airbyte_fetch.ts [list|workspaces|sync|status] [args]");
      process.exit(1);
    }
  };

  run().catch((err) => {
    console.error("Airbyte error:", err);
    process.exit(1);
  });
}
