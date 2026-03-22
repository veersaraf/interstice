import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { runAgent } from "./claude-runner";
import { runAgentUnified, type AdapterType } from "./agent-runner";
import { sendOmiNotification, extractOmiUid } from "./omi";
import { makeCall, parsePhoneNumber } from "../skills/make_call";
import { sendEmail } from "../skills/send_email";
import path from "path";
import fs from "fs";
import { Id } from "../convex/_generated/dataModel";

const HEARTBEAT_INTERVAL_MS = 3000;
const MAX_CONCURRENT_AGENTS = 3; // Allow parallel agent execution on macOS
const PROJECT_ROOT = process.cwd();
const MEMORY_PATH = path.resolve(PROJECT_ROOT, "memory", "company.md");

// Agent lock map — prevent concurrent runs per agent
const agentLocks = new Map<string, boolean>();
let activeProcessCount = 0;

// Agents that produce data others depend on — must finish first
const DATA_PRODUCER_AGENTS = ["research"];
// Agents that consume data from producers — must wait for research before starting
const DATA_CONSUMER_AGENTS = ["comms", "developer"];
// Agents that run LAST — wait for ALL other siblings to complete (calls are confirmatory)
const FINAL_STEP_AGENTS = ["call"];
// NOTE: Approval gates disabled for hackathon demo.
// To re-enable: wrap the action execution block below in an approval flow
// and add back APPROVAL_AGENTS = ["comms", "call"]

interface Agent {
  _id: Id<"agents">;
  name: string;
  role: string;
  status: string;
  adapterType?: "claude" | "codex";
  model?: string;
}

interface Task {
  _id: Id<"tasks">;
  agentId?: Id<"agents">;
  parentTaskId?: Id<"tasks">;
  status: string;
  input: string;
  output?: string;
  createdBy?: Id<"agents">;
}

interface Finding {
  content: string;
  summary?: string;
  agentName?: string;
  agentRole?: string;
}

interface Session {
  claudeSessionId: string;
  cwd: string;
}

/**
 * Start the heartbeat scheduler.
 * Like Paperclip's heartbeat runner — polls for pending work, respects
 * agent locks, handles task dependencies, and manages the full lifecycle.
 */
export function startHeartbeat(convexUrl: string) {
  const client = new ConvexHttpClient(convexUrl);

  console.log("[heartbeat] Starting scheduler...");

  // Run recovery BEFORE starting the tick loop, then start the ticker
  let stopFn: (() => void) | null = null;
  (async () => {
    try {
      // Reset orphaned in_progress tasks from previous crashed runs
      const result = await client.mutation(api.tasks.resetStuck, {});
      if (result.reset > 0) {
        console.log(`[heartbeat] Recovered ${result.reset} orphaned in_progress tasks → pending`);
      }

      // Reset all agents to idle on startup
      const agents = await client.query(api.agents.list, {});
      for (const agent of agents) {
        if (agent.status !== "idle") {
          await client.mutation(api.agents.setStatus, { id: agent._id, status: "idle" });
        }
      }
      console.log("[heartbeat] All agents reset to idle");
    } catch (err) {
      console.error("[heartbeat] Recovery error:", err);
    }

    console.log("[heartbeat] Recovery complete — starting tick loop");

    const interval = setInterval(async () => {
      try {
        await tick(client);
      } catch (err) {
        console.error("[heartbeat] Tick error:", err);
      }
    }, HEARTBEAT_INTERVAL_MS);

    stopFn = () => clearInterval(interval);
  })();

  return () => { if (stopFn) stopFn(); };
}

async function tick(client: ConvexHttpClient) {
  // Recover stale in_progress tasks from crashed runs (older than 2 min)
  await client.mutation(api.tasks.resetStale, { maxAgeMs: 120_000 });

  // Get all pending tasks
  const pendingTasks: Task[] = await client.query(api.tasks.getAllPending, {});
  if (pendingTasks.length > 0) {
    console.log(`[heartbeat] Found ${pendingTasks.length} pending tasks`);
  }
  if (pendingTasks.length === 0) return;

  // Get all agents
  const agents: Agent[] = await client.query(api.agents.list, {});
  const agentMap = new Map(agents.map((a) => [a._id, a]));
  const agentByName = new Map(agents.map((a) => [a.name, a]));

  // Sort tasks: producers first, then consumers, then final-step agents.
  // This ensures research always gets dispatched before comms/dev/call in the same tick.
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const agentA = a.agentId ? agentMap.get(a.agentId) : null;
    const agentB = b.agentId ? agentMap.get(b.agentId) : null;
    const nameA = agentA?.name || "";
    const nameB = agentB?.name || "";
    const priorityOf = (name: string) =>
      DATA_PRODUCER_AGENTS.includes(name) ? 0 :
      DATA_CONSUMER_AGENTS.includes(name) ? 1 :
      FINAL_STEP_AGENTS.includes(name) ? 2 :
      name === "ceo" ? -1 : 1; // CEO tasks first (delegation), then producers
    return priorityOf(nameA) - priorityOf(nameB);
  });

  for (const task of sortedTasks) {
    if (!task.agentId) continue;

    const agent = agentMap.get(task.agentId);
    if (!agent) continue;

    // Global process limit — prevent Windows DLL init failures from too many Claude processes
    if (activeProcessCount >= MAX_CONCURRENT_AGENTS) break;

    // Check lock — skip if agent is already running
    if (agentLocks.get(agent._id)) continue;

    // === DEPENDENCY CHECK ===
    // Three tiers of execution order:
    // 1. DATA_PRODUCER_AGENTS (research) — run immediately, no dependencies
    // 2. DATA_CONSUMER_AGENTS (comms, developer) — wait for research findings
    // 3. FINAL_STEP_AGENTS (call) — wait for ALL other siblings to complete
    if (task.parentTaskId) {
      if (FINAL_STEP_AGENTS.includes(agent.name)) {
        // Call agent waits for ALL other siblings (research + comms + developer) to finish
        const allReady = await checkAllSiblingsComplete(client, task.parentTaskId, task._id);
        if (!allReady) {
          console.log(`[heartbeat] ${agent.name} waiting — not all siblings complete yet`);
          continue;
        }
      } else if (DATA_CONSUMER_AGENTS.includes(agent.name)) {
        // Comms/Developer wait only for research findings
        const hasData = await checkSiblingFindings(client, task.parentTaskId, agentByName);
        if (!hasData) {
          console.log(`[heartbeat] ${agent.name} waiting — research findings not ready yet`);
          continue;
        }
      }
    }

    // Lock and run
    agentLocks.set(agent._id, true);
    activeProcessCount++;
    console.log(`[heartbeat] Dispatching ${agent.name} for task ${task._id}`);
    runAgentTask(client, agent, task, agents)
      .catch((err) => {
        console.error(`[heartbeat] runAgentTask error for ${agent.name}:`, err);
      })
      .finally(() => {
        agentLocks.set(agent._id, false);
        activeProcessCount--;
        console.log(`[heartbeat] ${agent.name} finished, activeProcessCount=${activeProcessCount}`);
      });
  }
}

/**
 * Check if any data-producing sibling (research) has posted findings for this parent task.
 * Returns true if findings ACTUALLY EXIST in the DB, OR if there is no research sibling.
 *
 * Previous bug: we only checked if the research task was "done", but findings
 * hadn't been written yet — so consumer agents (comms, developer) would start
 * before research data was available. Now we check for actual findings records.
 */
async function checkSiblingFindings(
  client: ConvexHttpClient,
  parentTaskId: Id<"tasks">,
  agentByName: Map<string, Agent>
): Promise<boolean> {
  const children: Task[] = await client.query(api.tasks.getChildren, { parentTaskId });

  // Find all data-producer siblings (research agents)
  const producerTasks = children.filter((t) => {
    for (const [name, a] of Array.from(agentByName.entries())) {
      if (a._id === t.agentId && DATA_PRODUCER_AGENTS.includes(name)) return true;
    }
    return false;
  });

  // No research task in this batch — no dependency, proceed
  if (producerTasks.length === 0) return true;

  // Check each producer: it must be done AND have findings posted
  for (const producerTask of producerTasks) {
    // If producer is still pending or in_progress, consumer must wait
    if (producerTask.status !== "done" && producerTask.status !== "cancelled") {
      return false;
    }

    // Producer is done — verify findings actually exist in the DB
    if (producerTask.status === "done") {
      const hasFindings = await client.query(api.findings.existsForTask, {
        taskId: producerTask._id,
      });
      if (!hasFindings) {
        // Task marked done but findings not posted yet — race condition, wait
        return false;
      }
    }
    // If cancelled, skip — don't block consumers on a failed producer
  }

  return true;
}

/**
 * Check if ALL non-final sibling tasks are complete (done or cancelled).
 * Used by FINAL_STEP_AGENTS (call) — they run last, after research AND comms/developer finish.
 * This ensures calls are confirmatory: the call agent has all findings + email drafts available.
 */
async function checkAllSiblingsComplete(
  client: ConvexHttpClient,
  parentTaskId: Id<"tasks">,
  currentTaskId: Id<"tasks">
): Promise<boolean> {
  const children: Task[] = await client.query(api.tasks.getChildren, { parentTaskId });

  // Check every sibling except ourself and other FINAL_STEP tasks
  for (const sibling of children) {
    if (sibling._id === currentTaskId) continue;
    // Skip other final-step siblings (don't deadlock call agents waiting on each other)
    // We can't resolve agent name without the map, so check by looking at the task
    // Instead, just check: is every non-self sibling done/cancelled?
    if (sibling.status !== "done" && sibling.status !== "cancelled") {
      return false;
    }
  }
  return true;
}

async function runAgentTask(
  client: ConvexHttpClient,
  agent: Agent,
  task: Task,
  allAgents: Agent[]
) {
  console.log(`[heartbeat] Running ${agent.name} on task ${task._id}`);

  // Claim the task atomically (Paperclip's atomic checkout pattern)
  const claimed = await client.mutation(api.tasks.claim, {
    taskId: task._id,
    agentId: agent._id,
  });
  if (!claimed) {
    console.log(`[heartbeat] Task ${task._id} already claimed, skipping`);
    return;
  }

  // Set agent active with current task description
  await client.mutation(api.agents.setStatus, {
    id: agent._id,
    status: "active",
    currentTask: task.input.substring(0, 100),
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

    // Build the prompt with full context injection
    const prompt = await buildPrompt(client, agent, task);

    const systemPromptPath = path.resolve(
      PROJECT_ROOT,
      "agents",
      `${agent.name}.md`
    );

    // CEO: 2 turns (JSON delegation). Specialists: 5 turns (may use tools).
    const maxTurns = agent.name === "ceo" ? 2 : 5;

    // Pre-approve tools per agent so they can run non-interactively
    const allowedTools = getAgentTools(agent.name);

    // Select adapter: use agent's configured adapter or default to claude
    const adapterType: AdapterType = agent.adapterType || "claude";

    // Use session for --resume, but skip if empty (cleared after crash)
    const validSessionId =
      session?.cwd === PROJECT_ROOT && session.claudeSessionId
        ? session.claudeSessionId
        : null;

    const result = await runAgentUnified({
      adapter: adapterType,
      prompt,
      systemPromptPath,
      sessionId: validSessionId,
      cwd: PROJECT_ROOT,
      maxTurns,
      allowedTools,
      disableTools: agent.name === "ceo",
      model: agent.model || undefined,
      onOutput: async (text: string) => {
        await client.mutation(api.activity.log, {
          agentId: agent._id,
          action: "agent_output",
          content: text,
          taskId: task._id,
        });
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

    // === CEO HANDLING ===
    if (agent.name === "ceo") {
      // Check for direct response first (CEO responding without delegation)
      const directResponse = extractCeoDirectResponse(result.output);
      if (directResponse) {
        await handleCeoSynthesis(client, agent, task, directResponse);
      } else {
        const wasDelegation = await handleCeoDelegation(
          client,
          agent,
          task,
          result.output,
          allAgents
        );

        if (!wasDelegation && result.output) {
          await handleCeoSynthesis(client, agent, task, result.output);
        }
      }
    }

    // === DEVELOPER: Parse output and write files to disk ===
    // Developer agent uses Write tool to write files directly; this post-processes
    // the output to catch any code blocks with filename hints and report written paths.
    let finalOutput = result.output || "";
    if (agent.name === "developer" && finalOutput) {
      const writtenFiles = handleDeveloperOutput(finalOutput);
      if (writtenFiles.length > 0) {
        const fileList = writtenFiles.join(", ");
        finalOutput += `\n\n**Files written to disk:** ${fileList}`;
        await client.mutation(api.activity.log, {
          agentId: agent._id,
          action: "files_written",
          content: `Developer wrote ${writtenFiles.length} file(s): ${fileList}`,
          taskId: task._id,
        });
      }
    }

    // === NON-CEO: Post findings + update company memory ===
    if (agent.name !== "ceo" && finalOutput) {
      // Post to findings channel (other agents read this)
      await client.mutation(api.findings.post, {
        agentId: agent._id,
        taskId: task._id,
        content: finalOutput,
        summary: finalOutput.substring(0, 200),
      });

      // Log inter-agent data sharing
      await client.mutation(api.activity.log, {
        agentId: agent._id,
        action: "findings_posted",
        content: `${agent.role} posted findings to shared channel`,
        taskId: task._id,
      });

      // Append to company memory
      appendToCompanyMemory(agent, task, finalOutput);
    }

    // === ACTION EXECUTION ===
    // Comms and Call agents produce actionable output (emails, calls).
    // Execute actions directly — no approval gates during hackathon demo.
    if ((agent.name === "comms" || agent.name === "call") && finalOutput) {
      const needsAction = detectApprovalNeeded(agent, task, finalOutput);
      if (needsAction) {
        console.log(`[heartbeat] Auto-executing ${needsAction.action} for ${agent.name}`);

        let actionResult = `Action logged: ${needsAction.action}`;
        try {
          const actionLower = needsAction.action.toLowerCase();

          if (actionLower.includes("call") || actionLower.includes("phone")) {
            const phoneNumber = parsePhoneNumber(needsAction.details);
            if (phoneNumber) {
              const result = await makeCall(phoneNumber, needsAction.details);
              actionResult = result.message;
            } else {
              actionResult = "Could not parse phone number from details.";
            }
          } else if (actionLower.includes("email") || actionLower.includes("send")) {
            const parsed = parseDemoEmailDetails(needsAction.details);
            if (parsed) {
              const result = await sendEmail(parsed.to, parsed.subject, parsed.body);
              actionResult = result.message;
            } else {
              actionResult = "Could not parse email fields from details.";
            }
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          actionResult = `Action failed: ${errMsg}`;
          console.error("[heartbeat] Action execution failed:", err);
        }

        await client.mutation(api.activity.log, {
          agentId: agent._id,
          action: "action_executed",
          content: `🚀 ${needsAction.action} — ${actionResult}`,
          taskId: task._id,
        });

        // Post finding so CEO sees the outcome
        await client.mutation(api.findings.post, {
          agentId: agent._id,
          taskId: task._id,
          content: `[EXECUTED] ${needsAction.action}: ${actionResult}\n\n${needsAction.details.substring(0, 400)}`,
          summary: `Executed: ${needsAction.action}`,
        });
      }
    }

    // Complete the task
    await client.mutation(api.tasks.complete, {
      taskId: task._id,
      output: finalOutput,
    });

    await client.mutation(api.activity.log, {
      agentId: agent._id,
      action: "task_completed",
      content: `${agent.role} agent completed task`,
      taskId: task._id,
    });

    await client.mutation(api.heartbeats.succeed, { id: heartbeatId });

    // After a non-CEO agent completes, check if we should trigger CEO synthesis
    if (agent.name !== "ceo" && task.parentTaskId) {
      await checkAndTriggerSynthesis(client, task.parentTaskId);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[heartbeat] ${agent.name} error:`, errorMsg);

    // If this was a Windows crash, drop the agent's session so next retry starts fresh
    const isWindowsCrash = errorMsg.includes("Windows code") || errorMsg.includes("3221225794");
    if (isWindowsCrash) {
      try {
        const session = await client.query(api.sessions.getForAgent, { agentId: agent._id });
        if (session) {
          await client.mutation(api.sessions.upsert, {
            agentId: agent._id,
            claudeSessionId: "", // Clear session — force fresh start
            cwd: PROJECT_ROOT,
          });
          console.log(`[heartbeat] Dropped session for ${agent.name} after Windows crash`);
        }
      } catch {
        // Session cleanup failed — not critical
      }
    }

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

    // Reset to pending for retry — failTask tracks retryCount and auto-cancels after 2 retries
    const result = await client.mutation(api.tasks.failTask, { taskId: task._id });
    if (result?.cancelled) {
      console.log(`[heartbeat] Task ${task._id} permanently cancelled after ${result.retryCount} retries`);
      await client.mutation(api.activity.log, {
        agentId: agent._id,
        action: "task_cancelled",
        content: `Task cancelled after ${result.retryCount} failed retries: ${errorMsg}`,
        taskId: task._id,
      });
    } else {
      console.log(`[heartbeat] Task ${task._id} reset to pending (retry ${result?.retryCount || 1}/2)`);
    }
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
 * - Company memory (from company.md)
 * - Sibling findings (inter-agent data flow — Research → Comms/Dev)
 * - Recent findings as fallback
 * - Active company goals
 * - Company contacts
 */
async function buildPrompt(
  client: ConvexHttpClient,
  agent: Agent,
  task: Task
): Promise<string> {
  const parts: string[] = [];

  // Task input
  parts.push(`## Your Task\n\n${task.input}`);

  // Company memory — the ever-growing knowledge base
  if (agent.name !== "ceo") {
    try {
      const memory = fs.readFileSync(MEMORY_PATH, "utf-8");
      if (memory.trim()) {
        parts.push(`## Company Memory\n\n${memory}`);
      }
    } catch {
      // Memory file doesn't exist yet — that's fine
    }
  }

  // Sibling findings — targeted inter-agent data flow
  // If this task has a parent (it's a delegated subtask), get findings from sibling tasks
  if (agent.name !== "ceo" && task.parentTaskId) {
    try {
      const siblingFindings: Finding[] = await client.query(
        api.findings.getSiblingFindings,
        { parentTaskId: task.parentTaskId }
      );

      if (siblingFindings.length > 0) {
        parts.push(
          `## Findings from Other Agents (Use This Data)\n\n` +
          `These findings were produced by your colleagues working on related tasks. ` +
          `USE this data — reference specific numbers, quotes, and insights. ` +
          `Do NOT repeat research that's already done.\n\n` +
          siblingFindings
            .map((f) => `### From ${f.agentRole || "Agent"}:\n\n${f.content}`)
            .join("\n\n---\n\n")
        );
      }
    } catch {
      // Sibling findings query failed — fall back to recent
    }
  }

  // Fallback: recent findings if no sibling findings
  if (agent.name !== "ceo" && !task.parentTaskId) {
    const findings: Finding[] = await client.query(api.findings.getRecent, {
      limit: 3,
    });
    if (findings.length > 0) {
      parts.push(
        `## Available Research Findings\n\n` +
        findings.map((f) => f.content).join("\n\n---\n\n")
      );
    }
  }

  // Active company goals
  const goals = await client.query(api.goals.listActive, {});
  if (goals.length > 0) {
    parts.push(
      `## Company Goals\n\n${goals
        .map((g: { title: string; description: string }) => `- **${g.title}**: ${g.description}`)
        .join("\n")}`
    );
  }

  // Company contacts
  const contacts = await client.query(api.contacts.list, {});
  if (contacts.length > 0) {
    parts.push(
      `## Known Contacts\n\n${contacts
        .map(
          (c: { name: string; role?: string; company?: string; email?: string; phone?: string; notes?: string }) =>
            `- **${c.name}**${c.role ? ` (${c.role})` : ""}${c.company ? ` at ${c.company}` : ""}${c.email ? ` — ${c.email}` : ""}${c.phone ? ` — ${c.phone}` : ""}${c.notes ? ` — ${c.notes}` : ""}`
        )
        .join("\n")}`
    );
  }

  return parts.join("\n\n---\n\n");
}

/**
 * Extract a direct response from CEO output.
 * If the CEO outputs {"response":"..."} instead of {"tasks":[...]},
 * it means the input was conversational and doesn't need delegation.
 * Returns the response string, or null if this isn't a direct response.
 */
function extractCeoDirectResponse(output: string): string | null {
  try {
    const jsonMatch = output.match(/\{[\s\S]*"response"[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.response === "string" && parsed.response.trim()) {
      // Make sure it's not also a delegation (has tasks array)
      if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
        return null; // It's a delegation, not a direct response
      }
      return parsed.response;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse CEO output for delegation instructions.
 * CEO outputs JSON with a "tasks" array — we create child tasks in Convex.
 */
async function handleCeoDelegation(
  client: ConvexHttpClient,
  ceoAgent: Agent,
  parentTask: Task,
  output: string,
  allAgents: Agent[]
): Promise<boolean> {
  try {
    const jsonMatch = output.match(/\{[\s\S]*"tasks"[\s\S]*\}/);
    if (!jsonMatch) return false;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.tasks || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0)
      return false;

    const agentByName = new Map(allAgents.map((a) => [a.name, a]));

    // Cancel any stale pending tasks from previous delegations to prevent
    // old orphaned tasks (e.g. a lingering call task) from firing unexpectedly
    for (const subtask of parsed.tasks) {
      const targetAgent = agentByName.get(subtask.agent);
      if (!targetAgent) continue;
      const stalePending: Task[] = await client.query(api.tasks.getPending, {
        agentId: targetAgent._id,
      });
      for (const stale of stalePending) {
        // Only cancel tasks that aren't children of THIS parent (old orphans)
        if (stale.parentTaskId !== parentTask._id) {
          await client.mutation(api.tasks.cancel, { taskId: stale._id });
          console.log(`[heartbeat] Cancelled stale pending task ${stale._id} for ${subtask.agent}`);
        }
      }
    }

    let delegated = 0;
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
        content: `CEO → ${targetAgent.role}: ${subtask.input.substring(0, 100)}`,
        taskId: childTaskId,
      });

      // Send inter-agent delegation message
      await client.mutation(api.messages.send, {
        from: ceoAgent._id,
        to: targetAgent._id,
        channel: "delegation",
        content: subtask.input,
        taskId: childTaskId,
      });

      delegated++;
    }

    if (delegated > 0) {
      await client.mutation(api.activity.log, {
        agentId: ceoAgent._id,
        action: "delegation_complete",
        content: `CEO delegated ${delegated} tasks to team`,
        taskId: parentTask._id,
      });
    }

    return delegated > 0;
  } catch {
    console.log(
      "[heartbeat] CEO output was not delegation JSON — treating as direct response"
    );
    return false;
  }
}

/**
 * Handle CEO synthesis response.
 */
async function handleCeoSynthesis(
  client: ConvexHttpClient,
  ceoAgent: Agent,
  task: Task,
  output: string
) {
  await client.mutation(api.activity.log, {
    agentId: ceoAgent._id,
    action: "synthesis",
    content: `CEO synthesized results`,
    taskId: task._id,
  });

  // Route back to OMI if command originated from OMI
  const omiUid = extractOmiUid(task.input);
  if (omiUid) {
    const cleanMessage = output
      .replace(/\[OMI_UID:[^\]]+\]/g, "")
      .replace(/\[SYNTHESIS\]/g, "")
      .trim();
    await sendOmiNotification(omiUid, cleanMessage);
  }
}

/**
 * Check if all child tasks of a parent are done.
 * If yes, create a CEO synthesis task with all outputs.
 */
async function checkAndTriggerSynthesis(
  client: ConvexHttpClient,
  parentTaskId: Id<"tasks">
) {
  try {
    const parent: Task | null = await client.query(api.tasks.get, {
      id: parentTaskId,
    });
    if (!parent) return;

    const children: Task[] = await client.query(api.tasks.getChildren, {
      parentTaskId,
    });
    if (children.length === 0) return;

    // Check if all are done or cancelled (pending_approval counts as not done)
    const allSettled = children.every(
      (t) => t.status === "done" || t.status === "cancelled"
    );
    if (!allSettled) return;

    // Check if synthesis hasn't already been triggered
    const existingSynthesis = children.find(
      (t) => t.input.includes("[SYNTHESIS]")
    );
    if (existingSynthesis) return;

    console.log(
      `[heartbeat] All children done for parent ${parentTaskId} — triggering CEO synthesis`
    );

    const completedChildren = children.filter(
      (t) => t.status === "done" && t.output
    );

    const resultSections = completedChildren
      .map((t) => `### Task: ${t.input.substring(0, 80)}\n\n${t.output}`)
      .join("\n\n---\n\n");

    const omiUid = extractOmiUid(parent.input);
    const omiTag = omiUid ? `[OMI_UID:${omiUid}]` : "";

    const originalCommand = parent.input
      .replace(/\[OMI_UID:[^\]]+\]/g, "")
      .trim();

    const synthesisPrompt = `[SYNTHESIS]${omiTag}

All delegated tasks are complete. Read the results from your team below and synthesize them into a clear, conversational summary for the user.

**Original command:** ${originalCommand}

**Team results:**

${resultSections}

---

Provide a 3-5 sentence summary covering:
- What was accomplished
- Key findings or outputs
- Where to find any created files
- Any pending approvals the user needs to action

Do NOT output any JSON. Speak directly to the user.`;

    const ceo = await client.query(api.agents.getByName, { name: "ceo" });
    if (!ceo) return;

    const synthTaskId = await client.mutation(api.tasks.create, {
      agentId: ceo._id,
      parentTaskId,
      input: synthesisPrompt,
      createdBy: ceo._id,
    });

    await client.mutation(api.activity.log, {
      agentId: ceo._id,
      action: "synthesis_triggered",
      content: `All ${completedChildren.length} tasks complete — CEO synthesizing results`,
      taskId: synthTaskId,
    });
  } catch (err) {
    console.error("[heartbeat] Synthesis check error:", err);
  }
}

/**
 * Parse developer agent output for code blocks with filename hints.
 * Writes any unwritten files to the output/ directory and returns all
 * output/ paths that exist on disk (written by agent tool or by us).
 */
function handleDeveloperOutput(output: string): string[] {
  const outputDir = path.resolve(PROJECT_ROOT, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const written: string[] = [];

  // Match code blocks that include a filename hint in a comment on the first line.
  // Supported patterns:
  //   ```html\n<!-- filename: output/index.html -->\n<code>\n```
  //   ```ts\n// filename: output/app.ts\n<code>\n```
  const codeBlockRe =
    /```\w*\n(?:(?:\/\/|<!--)\s*filename:\s*(output\/[\w.\-/]+)\s*(?:-->)?\n)([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = codeBlockRe.exec(output)) !== null) {
    const rel = m[1].trim();
    const code = m[2];
    const abs = path.resolve(PROJECT_ROOT, rel);
    try {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, code, "utf-8");
      written.push(rel);
      console.log(`[heartbeat] Developer wrote: ${rel}`);
    } catch (err) {
      console.error(`[heartbeat] Failed to write ${rel}:`, err);
    }
  }

  // Also collect any output/ paths mentioned in the text that already exist on disk
  // (written by the agent's own Write tool).
  const mentioned = [...new Set(output.match(/output\/[\w.\-/]+\.\w+/g) ?? [])];
  for (const rel of mentioned) {
    if (!written.includes(rel) && fs.existsSync(path.resolve(PROJECT_ROOT, rel))) {
      written.push(rel);
    }
  }

  return written;
}

/**
 * Parse a comms agent email draft into structured fields.
 * Matches the output format defined in agents/comms.md.
 */
function parseEmailDraft(
  output: string
): { to: string; subject: string; body: string } | null {
  const toMatch = output.match(/\*\*To:\*\*\s*(.+)/);
  const subjectMatch = output.match(/\*\*Subject:\*\*\s*(.+)/);
  if (!toMatch || !subjectMatch) return null;

  // Body is the text between the Subject line and the --- separator (or end)
  const bodyMatch = output.match(
    /\*\*Subject:\*\*[^\n]*\n\n([\s\S]+?)(?:\n---|\n\*\*Status:)/
  );
  return {
    to: toMatch[1].trim(),
    subject: subjectMatch[1].trim(),
    body: bodyMatch ? bodyMatch[1].trim() : "",
  };
}

/**
 * Detect if an agent's output requires human approval before action.
 * Returns null if no approval needed, otherwise returns action details.
 */
function detectApprovalNeeded(
  agent: Agent,
  task: Task,
  output: string
): { action: string; details: string } | null {
  if (agent.name === "comms") {
    // Trigger approval if the task involves sending OR the output has an email draft
    const isSendTask =
      task.input.toLowerCase().includes("send") ||
      output.toLowerCase().includes("ready to send") ||
      output.toLowerCase().includes("awaiting approval to send");
    const hasEmailDraft = /\*\*To:\*\*/.test(output) && /\*\*Subject:\*\*/.test(output);

    if (isSendTask || hasEmailDraft) {
      const draft = parseEmailDraft(output);
      const details = draft
        ? `To: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}`
        : output.substring(0, 600);
      return { action: "Send Email", details };
    }
  }

  if (agent.name === "call") {
    // All call agent actions require approval
    return {
      action: "Make Phone Call",
      details: output.substring(0, 500),
    };
  }

  return null;
}

/**
 * Parse email fields from approval details (for DEMO_MODE direct execution).
 * Same format as the approve endpoint parser.
 */
function parseDemoEmailDetails(
  details: string
): { to: string; subject: string; body: string } | null {
  const toMatch = details.match(/^To:\s*(.+)/m);
  const subjectMatch = details.match(/^Subject:\s*(.+)/m);
  if (!toMatch || !subjectMatch) return null;

  const subjectIdx = details.indexOf(subjectMatch[0]);
  const afterSubject = details.slice(subjectIdx + subjectMatch[0].length).replace(/^\n\n/, "");

  return {
    to: toMatch[1].trim(),
    subject: subjectMatch[1].trim(),
    body: afterSubject.trim(),
  };
}

/**
 * Append task results to company memory file.
 * This is the ever-growing knowledge base — every completed task
 * adds to the company's institutional memory.
 */
function appendToCompanyMemory(agent: Agent, task: Task, output: string) {
  try {
    const timestamp = new Date().toISOString().split("T")[0];
    const summary = output.substring(0, 300).replace(/\n/g, " ").trim();

    let section: string;
    if (agent.name === "research") {
      section = "Learnings";
    } else if (agent.name === "comms") {
      section = "Communications";
    } else if (agent.name === "developer") {
      section = "Built";
    } else {
      section = "Activity";
    }

    const entry = `\n### [${timestamp}] ${agent.role}: ${task.input.substring(0, 60)}\n${summary}\n`;

    // Read current memory
    let memory = "";
    try {
      memory = fs.readFileSync(MEMORY_PATH, "utf-8");
    } catch {
      // File doesn't exist — create it
      memory = "# Interstice — Company Memory\n\n## Learnings\n\n## Communications\n\n## Built\n\n## Activity\n";
    }

    // Find the right section and append
    const sectionHeader = `## ${section}`;
    const sectionIndex = memory.indexOf(sectionHeader);
    if (sectionIndex !== -1) {
      const insertPoint = sectionIndex + sectionHeader.length;
      memory = memory.slice(0, insertPoint) + "\n" + entry + memory.slice(insertPoint);
    } else {
      // Section doesn't exist — append at end
      memory += `\n${sectionHeader}\n${entry}`;
    }

    fs.writeFileSync(MEMORY_PATH, memory, "utf-8");
    console.log(`[heartbeat] Updated company memory: ${section} += ${agent.role} findings`);
  } catch (err) {
    console.error("[heartbeat] Failed to update company memory:", err);
  }
}

/**
 * Get pre-approved tools for each agent.
 * These are passed to --allowedTools so agents can run non-interactively
 * without hitting permission prompts.
 */
function getAgentTools(agentName: string): string[] {
  switch (agentName) {
    case "ceo":
      // CEO just outputs JSON — no tools needed
      return [];
    case "research":
      // Research needs Bash to run web_search.ts via Perplexity
      return [
        "Bash(npx tsx skills/web_search.ts*)",
        "Read",
        "WebSearch",
        "WebFetch",
      ];
    case "comms":
      // Comms reads files for context
      return ["Read", "Write"];
    case "developer":
      // Developer reads and writes code files
      return [
        "Read",
        "Write",
        "Edit",
        "Bash(mkdir*)",
      ];
    case "call":
      // Call agent can run call scripts
      return [
        "Read",
        "Bash(npx tsx skills/*)",
      ];
    default:
      return ["Read"];
  }
}
