"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export function ApprovalQueue() {
  const approvals = useQuery(api.approvals.listPending);
  const agents = useQuery(api.agents.list);
  const [resolving, setResolving] = useState<string | null>(null);

  if (!approvals || !agents) return null;
  if (approvals.length === 0) return null;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const resolve = async (approvalId: Id<"approvals">, decision: "approve" | "deny") => {
    setResolving(approvalId);
    try {
      // Use the HTTP route so post-actions fire:
      // activity log, findings, CEO synthesis trigger
      await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, decision }),
      });
    } catch (err) {
      console.error("Approval resolution failed:", err);
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-4">
        Pending Approvals
      </h2>

      <div className="space-y-3">
        {approvals.map((approval) => {
          const agent = agentMap.get(approval.agentId);
          const busy = resolving === approval._id;
          return (
            <div
              key={approval._id}
              className="bg-gray-900/50 border border-yellow-700/30 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-yellow-300">
                    {agent?.role || "Agent"} wants to: {approval.action}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">
                    {approval.details}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => resolve(approval._id, "approve")}
                    disabled={busy}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    {busy ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => resolve(approval._id, "deny")}
                    disabled={busy}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    {busy ? "..." : "Deny"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
