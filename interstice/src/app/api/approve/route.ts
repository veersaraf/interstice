import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";
import { Id } from "../../../../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/approve
 * Approve or deny a pending approval.
 * Body: { "approvalId": "...", "decision": "approve" | "deny" }
 */
export async function POST(req: NextRequest) {
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
    const result = await client.mutation(api.approvals.approve, { id });
    if (!result) {
      return NextResponse.json(
        { error: "Approval not found or already resolved" },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: "approved", approval: result });
  } else {
    const result = await client.mutation(api.approvals.deny, { id });
    if (!result) {
      return NextResponse.json(
        { error: "Approval not found or already resolved" },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: "denied", approval: result });
  }
}
