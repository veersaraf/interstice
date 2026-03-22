import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { runAgent } from "./claude-runner";
import { sendOmiNotification, extractOmiUid } from "./omi";
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
// Agents that consume data from producers — must wait
const DATA_CONSUMER_AGENTS = ["comms", "developer"];
// Agents whose output requires human approval before action
const APPROVAL_AGENTS = ["comms", "call"];

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

  let stopFn: (() => void) | null = null;
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

  for (const task of pendingTasks) {
    if (!task.agentId) continue;

    const agent = agentMap.get(task.agentId);
    if (!agent) continue;

    // Global process limit — prevent Windows DLL init failures from too many Claude processes
    if (activeProcessCount >= MAX_CONCURRENT_AGENTS) break;

    // Check lock — skip if agent is already running
    if (agentLocks.get(agent._id)) continue;

    // === DEPENDENCY CHECK ===
    // If this agent is a data consumer (comms, developer) and has a parent task,
    // check if the research sibling has posted findings yet.
    // This ensures Comms waits for Research before drafting.
    if (DATA_CONSUMER_AGENTS.includes(agent.name) && task.parentTaskId) {
      const hasData = await checkSiblingFindings(client, task.parentTaskId, agentByName);
      if (!hasData) {
        // Research hasn't posted findings yet — skip this tick, try again next heartbeat
        continue;
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
 * Returns true if findings exist OR if there is no research sibling.
 */
async function checkSiblingFindings(
  client: ConvexHttpClient,
  parentTaskId: Id<"tasks">,
  agentByName: Map<string, Agent>
): Promise<boolean> {
  const children: Task[] = await client.query(api.tasks.getChildren, { parentTaskId });

  // Check if there's a research sibling
  const researchAgent = agentByName.get("research");
  if (!researchAgent) return true; // No research agent exists

  const researchSibling = children.find(
    (t) => t.agentId === researchAgent._id
  );

  if (!researchSibling) return true; // No research task in this batch — no dependency

  // If research sibling is done, check for findings
  if (researchSibling.status === "done") {
    return true; // Research is done — findings should be posted
  }

  // Research is still running — consumer must wait
  return false;
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

    const result = await runAgent({
      prompt,
      systemPromptPath,
      sessionId:
        session?.cwd === PROJECT_ROOT ? session.claudeSessionId : null,
      cwd: PROJECT_ROOT,
      maxTurns,
      allowedTools,
      disableTools: agent.name === "ceo",
      onEvent: async (event) => {
        // Stream assistant output to activity log in real-time
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

    // === CEO HANDLING ===
    if (agent.name === "ceo") {
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

    // === APPROVAL GATE ===
    // Comms and Call agents' outputs go through approval before "sending"
    if (APPROVAL_AGENTS.includes(agent.name) && finalOutput) {
      const needsApproval = detectApprovalNeeded(agent, task, finalOutput);

      if (needsApproval) {
        // Create approval record
        await client.mutation(api.approvals.create, {
          taskId: task._id,
          agentId: agent._id,
          action: needsApproval.action,
          details: needsApproval.details,
        });

        // Set task to pending_approval
        await client.mutation(api.tasks.requestApproval, {
          taskId: task._id,
        });

        await client.mutation(api.activity.log, {
          agentId: agent._id,
          action: "approval_requested",
          content: `⚠️ ${agent.role} needs approval: ${needsApproval.action}`,
          taskId: task._id,
        });

        // Don't mark as done — wait for approval
        await client.mutation(api.heartbeats.succeed, { id: heartbeatId });
        return; // Exit without completing — approval flow handles the rest
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

    // Cancel the task so it doesn't block the queue
    await client.mutation(api.tasks.cancel, { taskId: task._id });

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

    // Reset the task to pending so it can be retried on the next heartbeat
    await client.mutation(api.tasks.failTask, { taskId: task._id });
    console.log(`[heartbeat] Task ${task._id} reset to pending for retry`);
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
