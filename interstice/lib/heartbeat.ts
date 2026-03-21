import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { runAgent } from "./claude-runner";
import path from "path";
import { Id } from "../convex/_generated/dataModel";

const HEARTBEAT_INTERVAL_MS = 3000; // Check every 3 seconds
const PROJECT_ROOT = process.cwd();

// Agent lock map — prevent concurrent runs per agent
const agentLocks = new Map<string, boolean>();

interface Agent {
  _id: Id<"agents">;
  name: string;
  role: string;
  status: string;
}

interface Task {
  _id: Id<"tasks">;
  agentId?: Id<"agents">;
  parentTaskId?: Id<"tasks">;
  status: string;
  input: string;
  output?: string;
}

interface Finding {
  content: string;
  summary?: string;
}

interface Session {
  claudeSessionId: string;
  cwd: string;
}

/**
 * Start the heartbeat scheduler.
 * Polls Convex for agents with pending tasks and runs them.
 */
export function startHeartbeat(convexUrl: string) {
  const client = new ConvexHttpClient(convexUrl);

  console.log("[heartbeat] Starting scheduler...");

  const interval = setInterval(async () => {
    try {
      await tick(client);
    } catch (err) {
      console.error("[heartbeat] Tick error:", err);
    }
  }, HEARTBEAT_INTERVAL_MS);

  return () => clearInterval(interval);
}

async function tick(client: ConvexHttpClient) {
  // Get all pending tasks
  const pendingTasks: Task[] = await client.query(api.tasks.getAllPending, {});
  if (pendingTasks.length === 0) return;

  // Get all agents
  const agents: Agent[] = await client.query(api.agents.list, {});
  const agentMap = new Map(agents.map((a) => [a._id, a]));

  for (const task of pendingTasks) {
    if (!task.agentId) continue;

    const agent = agentMap.get(task.agentId);
    if (!agent) continue;

    // Check lock — skip if agent is already running
    if (agentLocks.get(agent._id)) continue;

    // Lock and run
    agentLocks.set(agent._id, true);
    runAgentTask(client, agent, task).finally(() => {
      agentLocks.set(agent._id, false);
    });
  }
}

async function runAgentTask(
  client: ConvexHttpClient,
  agent: Agent,
  task: Task
) {
  console.log(
    `[heartbeat] Running ${agent.name} on task ${task._id}`
  );

  // Claim the task atomically
  const claimed = await client.mutation(api.tasks.claim, {
    taskId: task._id,
    agentId: agent._id,
  });
  if (!claimed) {
    console.log(`[heartbeat] Task ${task._id} already claimed, skipping`);
    return;
  }

  // Set agent active
  await client.mutation(api.agents.setStatus, {
    id: agent._id,
    status: "active",
  });

  // Log heartbeat start
  const heartbeatId = await client.mutation(api.heartbeats.start, {
    agentId: agent._id,
  });

  // Log activity
  await client.mutation(api.activity.log, {
    agentId: agent._id,
    action: "task_started",
    content: `${agent.role} agent starting: ${task.input.substring(0, 100)}...`,
    taskId: task._id,
  });

  try {
    // Get session for this agent (for --resume)
    const session: Session | null = await client.query(
      api.sessions.getForAgent,
      { agentId: agent._id }
    );

    // Build the prompt with context
    const prompt = await buildPrompt(client, agent, task);

    const systemPromptPath = path.resolve(
      PROJECT_ROOT,
      "agents",
      `${agent.name}.md`
    );

    // Run Claude CLI
    const result = await runAgent({
      prompt,
      systemPromptPath,
      sessionId:
        session?.cwd === PROJECT_ROOT ? session.claudeSessionId : null,
      cwd: PROJECT_ROOT,
      onEvent: async (event) => {
        // Stream assistant output to activity log
        if (event.type === "assistant" && event.message?.content) {
          for (const block of event.message.content) {
            if (block.type === "text" && block.text) {
              await client.mutation(api.activity.log, {
                agentId: agent._id,
                action: "agent_output",
                content: block.text,
                taskId: task._id,
              });
            }
          }
        }
      },
    });

    // Save session for next --resume
    if (result.sessionId) {
      await client.mutation(api.sessions.upsert, {
        agentId: agent._id,
        claudeSessionId: result.sessionId,
        cwd: PROJECT_ROOT,
      });
    }

    // Handle CEO delegation — parse subtask JSON from output
    if (agent.name === "ceo") {
      await handleCeoDelegation(client, agent, task, result.output);
    }

    // Post findings for non-CEO agents
    if (agent.name !== "ceo" && result.output) {
      await client.mutation(api.findings.post, {
        agentId: agent._id,
        taskId: task._id,
        content: result.output,
        summary: result.output.substring(0, 200),
      });
    }

    // Complete the task
    await client.mutation(api.tasks.complete, {
      taskId: task._id,
      output: result.output,
    });

    // Log success
    await client.mutation(api.activity.log, {
      agentId: agent._id,
      action: "task_completed",
      content: `${agent.role} agent completed task`,
      taskId: task._id,
    });

    await client.mutation(api.heartbeats.succeed, { id: heartbeatId });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[heartbeat] ${agent.name} error:`, errorMsg);

    await client.mutation(api.activity.log, {
      agentId: agent._id,
      action: "task_error",
      content: `Error: ${errorMsg}`,
      taskId: task._id,
    });

    await client.mutation(api.heartbeats.fail, {
      id: heartbeatId,
      error: errorMsg,
    });
  } finally {
    // Set agent idle
    await client.mutation(api.agents.setStatus, {
      id: agent._id,
      status: "idle",
    });
  }
}

/**
 * Build the full prompt for an agent, including:
 * - The task input
 * - Recent findings from other agents
 * - Company memory
 * - Active goals
 */
async function buildPrompt(
  client: ConvexHttpClient,
  agent: Agent,
  task: Task
): Promise<string> {
  const parts: string[] = [];

  // Task input
  parts.push(`## Your Task\n\n${task.input}`);

  // Include findings from other agents (inter-agent comms)
  if (agent.name !== "ceo") {
    const findings: Finding[] = await client.query(api.findings.getRecent, {
      limit: 5,
    });
    if (findings.length > 0) {
      parts.push(
        `\n## Available Findings from Other Agents\n\n${findings
          .map((f) => f.content)
          .join("\n\n---\n\n")}`
      );
    }
  }

  // For CEO checking on child tasks
  if (agent.name === "ceo" && task.parentTaskId === undefined) {
    // Check if this is a synthesis task (all children done)
    // This will be handled in the CEO delegation logic
  }

  // Active goals
  const goals = await client.query(api.goals.listActive, {});
  if (goals.length > 0) {
    parts.push(
      `\n## Company Goals\n\n${goals
        .map((g: { title: string; description: string }) => `- **${g.title}**: ${g.description}`)
        .join("\n")}`
    );
  }

  return parts.join("\n\n");
}

/**
 * Parse CEO output for delegation instructions.
 * CEO outputs JSON with a "tasks" array — we create child tasks in Convex.
 */
async function handleCeoDelegation(
  client: ConvexHttpClient,
  ceoAgent: Agent,
  parentTask: Task,
  output: string
) {
  try {
    // Try to extract JSON from the output
    const jsonMatch = output.match(/\{[\s\S]*"tasks"[\s\S]*\}/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) return;

    // Get agent registry
    const agents: Agent[] = await client.query(api.agents.list, {});
    const agentByName = new Map(agents.map((a) => [a.name, a]));

    for (const subtask of parsed.tasks) {
      const targetAgent = agentByName.get(subtask.agent);
      if (!targetAgent) {
        console.warn(
          `[heartbeat] CEO delegated to unknown agent: ${subtask.agent}`
        );
        continue;
      }

      const childTaskId = await client.mutation(api.tasks.create, {
        agentId: targetAgent._id,
        parentTaskId: parentTask._id,
        input: subtask.input,
        createdBy: ceoAgent._id,
      });

      await client.mutation(api.activity.log, {
        agentId: ceoAgent._id,
        action: "delegated",
        content: `CEO delegated to ${targetAgent.role}: ${subtask.input.substring(0, 100)}`,
        taskId: childTaskId,
      });

      // Send inter-agent message
      await client.mutation(api.messages.send, {
        from: ceoAgent._id,
        to: targetAgent._id,
        channel: "delegation",
        content: subtask.input,
        taskId: childTaskId,
      });
    }
  } catch (err) {
    console.log(
      "[heartbeat] CEO output was not delegation JSON, treating as direct response"
    );
  }
}
