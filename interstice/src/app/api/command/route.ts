import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/command
 * Submit a command to the CEO agent.
 * Body: { "command": "Do a competitive analysis..." }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { command } = body;

  if (!command || typeof command !== "string") {
    return NextResponse.json(
      { error: "Missing 'command' in request body" },
      { status: 400 }
    );
  }

  // Find CEO agent
  const ceo = await client.query(api.agents.getByName, { name: "ceo" });
  if (!ceo) {
    return NextResponse.json(
      { error: "CEO agent not found. Run seed first." },
      { status: 500 }
    );
  }

  // Create a task for the CEO
  const taskId = await client.mutation(api.tasks.create, {
    agentId: ceo._id,
    input: command,
  });

  // Log the command
  await client.mutation(api.activity.log, {
    action: "command_received",
    content: `Command: ${command}`,
    taskId,
  });

  return NextResponse.json({ taskId, status: "pending" });
}
