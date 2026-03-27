/**
 * Airbyte Fetch Skill — Pull data from external business sources (PRIZE: $1,750)
 *
 * Usage from CLI: npx tsx skills/airbyte_fetch.ts "connection-id" "stream-name"
 *
 * Pulls data from external business sources via Airbyte's API.
 * The Research Agent uses this to gather structured business data.
 *
 * Required env vars in .env.local:
 *   AIRBYTE_API_KEY   — Airbyte API key
 *   AIRBYTE_API_URL   — Airbyte API base URL (default: https://api.airbyte.com)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY;
const AIRBYTE_API_URL = process.env.AIRBYTE_API_URL || "https://api.airbyte.com";

interface AirbyteResult {
  success: boolean;
  data?: unknown;
  jobId?: string;
  message: string;
}

/**
 * Trigger a sync job for a given connection.
 */
export async function triggerSync(connectionId: string): Promise<AirbyteResult> {
  if (!AIRBYTE_API_KEY) {
    return {
      success: false,
      message: "ERROR: AIRBYTE_API_KEY not set in .env.local. Get one at https://portal.airbyte.com",
    };
  }

  const response = await fetch(`${AIRBYTE_API_URL}/v1/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRBYTE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      connectionId,
      jobType: "sync",
    }),
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
  if (!AIRBYTE_API_KEY) {
    return { success: false, message: "ERROR: AIRBYTE_API_KEY not set in .env.local" };
  }

  const response = await fetch(`${AIRBYTE_API_URL}/v1/jobs/${jobId}`, {
    headers: {
      Authorization: `Bearer ${AIRBYTE_API_KEY}`,
    },
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
    data,
    jobId,
    message: `Job ${jobId}: ${data.status}. Bytes synced: ${data.bytesSynced || 0}. Records: ${data.rowsSynced || 0}.`,
  };
}

/**
 * List available connections.
 */
export async function listConnections(): Promise<AirbyteResult> {
  if (!AIRBYTE_API_KEY) {
    return { success: false, message: "ERROR: AIRBYTE_API_KEY not set in .env.local" };
  }

  const response = await fetch(`${AIRBYTE_API_URL}/v1/connections`, {
    headers: {
      Authorization: `Bearer ${AIRBYTE_API_KEY}`,
    },
  });

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

// CLI entry point
if (process.argv[1] && process.argv[1].includes("airbyte_fetch")) {
  const action = process.argv[2] || "list";

  const run = async () => {
    if (action === "list") {
      const result = await listConnections();
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
      console.error("Usage: npx tsx skills/airbyte_fetch.ts [list|sync|status] [args]");
      process.exit(1);
    }
  };

  run().catch((err) => {
    console.error("Airbyte error:", err);
    process.exit(1);
  });
}
