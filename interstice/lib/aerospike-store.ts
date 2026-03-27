/**
 * Aerospike Store — Fast key-value analytics storage (PRIZE: $650)
 *
 * Provides a fast key-value store for performance metrics and analytics data.
 * The Analytics Agent uses this for high-throughput metric reads/writes.
 *
 * Required env vars in .env.local:
 *   AEROSPIKE_HOST      — Aerospike server host (default: localhost)
 *   AEROSPIKE_PORT      — Aerospike server port (default: 3000)
 *   AEROSPIKE_NAMESPACE — Aerospike namespace (default: interstice)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const AEROSPIKE_HOST = process.env.AEROSPIKE_HOST || "localhost";
const AEROSPIKE_PORT = parseInt(process.env.AEROSPIKE_PORT || "3000", 10);
const AEROSPIKE_NAMESPACE = process.env.AEROSPIKE_NAMESPACE || "interstice";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let aerospikeClient: any = null;

interface StoreResult {
  success: boolean;
  data?: unknown;
  message: string;
}

async function getClient() {
  if (aerospikeClient) return aerospikeClient;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Aerospike: any;
  try {
    const mod = "aerospike";
    Aerospike = await import(/* webpackIgnore: true */ mod);
  } catch {
    throw new Error(
      "aerospike package not installed. Run: npm install aerospike\n" +
      "Note: Aerospike client requires native compilation. See https://docs.aerospike.com/connect/nodejs"
    );
  }

  const clientConfig = {
    hosts: [{ addr: AEROSPIKE_HOST, port: AEROSPIKE_PORT }],
  };

  aerospikeClient = await Aerospike.connect(clientConfig);
  return aerospikeClient;
}

function makeKey(set: string, key: string) {
  return { ns: AEROSPIKE_NAMESPACE, set, key };
}

/**
 * Store a metric value.
 */
export async function putMetric(
  channel: string,
  metricName: string,
  value: number,
  metadata?: Record<string, unknown>
): Promise<StoreResult> {
  try {
    const client = await getClient();
    const key = makeKey("metrics", `${channel}:${metricName}:${Date.now()}`);
    const bins = {
      channel,
      metric: metricName,
      value,
      metadata: metadata ? JSON.stringify(metadata) : "",
      timestamp: Date.now(),
    };

    await client.put(key, bins);

    return {
      success: true,
      message: `Stored metric ${metricName}=${value} for channel ${channel}.`,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Aerospike put failed: ${errMsg}` };
  }
}

/**
 * Get a metric by exact key.
 */
export async function getMetric(set: string, key: string): Promise<StoreResult> {
  try {
    const client = await getClient();
    const record = await client.get(makeKey(set, key));

    return {
      success: true,
      data: record.bins,
      message: `Retrieved record from ${set}/${key}.`,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Aerospike get failed: ${errMsg}` };
  }
}

/**
 * Store arbitrary key-value data.
 */
export async function put(set: string, key: string, bins: Record<string, unknown>): Promise<StoreResult> {
  try {
    const client = await getClient();
    await client.put(makeKey(set, key), bins);
    return { success: true, message: `Stored ${set}/${key}.` };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Aerospike put failed: ${errMsg}` };
  }
}

/**
 * Close the Aerospike connection.
 */
export async function close(): Promise<void> {
  if (aerospikeClient) {
    aerospikeClient.close();
    aerospikeClient = null;
  }
}
