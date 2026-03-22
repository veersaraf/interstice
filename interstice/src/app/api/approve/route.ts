import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";
import { Id } from "../../../../convex/_generated/dataModel";
import { extractOmiUid } from "../../../../lib/omi";

function getClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

/**
 * POST /api/approve
 * Approve or deny a pending approval.
 * Body: { "approvalId": "...", "decision": "approve" | "deny" }
 */
export async function POST(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { approvalId, decision } = body;

  if (!approvalId || !decision) {
    return NextResponse.json(
      { error: "Missing 'approvalId' or 'decision'" },
      { status: 400 }
    );
  }

  if (decision !== "approve" && decision !== "deny") {
    return NextResponse.json(
      { error: "Decision must be 'approve' or 'deny'" },
      { status: 400 }
    );
  }

  const id = approvalId as Id<"approvals">;

  if (decision === "approve") {
    const approval = await client.mutation(api.approvals.approve, { id });
    if (!approval) {
      return NextResponse.json(
        { error: "Approval not found or already resolved" },
        { status: 404 }
      );
    }

    // approvals.approve sets task back to in_progress — override to done,
    // since the approval IS the action (no actual send/call impl yet).
    await client.mutation(api.tasks.complete, {
      taskId: approval.taskId,
      output: `[APPROVED] ${approval.action} approved by user.\n\n${approval.details}`,
    });

    await client.mutation(api.activity.log, {
      agentId: approval.agentId,
      action: "approval_resolved",
      content: `✅ ${approval.action} approved — action executed`,
      taskId: approval.taskId,
    });

    // Post finding so CEO and other agents see the outcome
    await client.mutation(api.findings.post, {
      agentId: approval.agentId,
      taskId: approval.taskId,
      content: `[APPROVED] ${approval.action}: ${approval.details.substring(0, 400)}`,
      summary: `Approved: ${approval.action}`,
    });

    // If all sibling tasks are now settled, create CEO synthesis task
    await maybeTriggerSynthesis(client, approval.taskId);

    return NextResponse.json({ status: "approved", approval });
  } else {
    const approval = await client.mutation(api.approvals.deny, { id });
    if (!approval) {
      return NextResponse.json(
        { error: "Approval not found or already resolved" },
        { status: 404 }
      );
    }

    // approvals.deny already cancels the task — just log and post finding
    await client.mutation(api.activity.log, {
      agentId: approval.agentId,
      action: "approval_resolved",
      content: `❌ ${approval.action} denied by user — task cancelled`,
      taskId: approval.taskId,
    });

    await client.mutation(api.findings.post, {
      agentId: approval.agentId,
      taskId: approval.taskId,
      content: `[DENIED] ${approval.action} was denied. Task cancelled — CEO will adjust the plan.`,
      summary: `Denied: ${approval.action}`,
    });

    // Check synthesis even on deny — other sibling tasks may have completed
    await maybeTriggerSynthesis(client, approval.taskId);

    return NextResponse.json({ status: "denied", approval });
  }
}

/**
 * After an approval resolves, check if all sibling tasks under the parent are
 * settled (done or cancelled). If yes, create a CEO synthesis task so the user
 * gets a final summary response.
 */
async function maybeTriggerSynthesis(
  client: ReturnType<typeof getClient>,
  taskId: Id<"tasks">
) {
  try {
    const task = await client.query(api.tasks.get, { id: taskId });
    if (!task?.parentTaskId) return;

    const children = await client.query(api.tasks.getChildren, {
      parentTaskId: task.parentTaskId,
    });
    if (children.length === 0) return;

    const allSettled = children.every(
      (t) => t.status === "done" || t.status === "cancelled"
    );
    if (!allSettled) return;

    // Don't create a second synthesis task
    if (children.some((t) => t.input.includes("[SYNTHESIS]"))) return;

    const parent = await client.query(api.tasks.get, { id: task.parentTaskId });
    if (!parent) return;

    const ceo = await client.query(api.agents.getByName, { name: "ceo" });
    if (!ceo) return;

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

    await client.mutation(api.tasks.create, {
      agentId: ceo._id,
      parentTaskId: task.parentTaskId,
      input: synthesisPrompt,
      createdBy: ceo._id,
    });

    await client.mutation(api.activity.log, {
      agentId: ceo._id,
      action: "synthesis_triggered",
      content: `All ${completedChildren.length} tasks settled (approval resolved) — CEO synthesizing`,
      taskId: taskId,
    });
  } catch (err) {
    console.error("[approve] Synthesis trigger error:", err);
  }
}
