"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldCheck, Check, X } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

const roleColors: Record<string, string> = {
  CEO:            "text-yellow-400",
  Research:       "text-blue-400",
  Communications: "text-purple-400",
  Developer:      "text-green-400",
  Call:           "text-orange-400",
};

export function ApprovalQueue() {
  const approvals = useQuery(api.approvals.listPending);
  const agents    = useQuery(api.agents.list);
  const [resolving, setResolving] = useState<string | null>(null);

  if (!approvals || !agents || approvals.length === 0) return null;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const resolve = async (approvalId: Id<"approvals">, decision: "approve" | "deny") => {
    setResolving(approvalId);
    try {
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
    <div className="space-y-2">
      {approvals.map((approval) => {
        const agent = agentMap.get(approval.agentId);
        const busy  = resolving === approval._id;

        return (
          <div
            key={approval._id}
            className="rounded-lg p-4 flex items-start gap-4"
            style={{
              background: "rgba(234,179,8,0.06)",
              border: "1px solid rgba(234,179,8,0.25)",
            }}
          >
            {/* Icon */}
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "rgba(234,179,8,0.15)" }}
            >
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {agent && (
                  <span className={`text-xs font-bold ${roleColors[agent.role] ?? "text-gray-400"}`}>
                    {agent.role}
                  </span>
                )}
                <span className="text-xs font-semibold text-yellow-300">
                  wants to: {approval.action}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                {approval.details}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => resolve(approval._id, "approve")}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-green-300 disabled:opacity-50 transition-opacity"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)" }}
              >
                <Check className="w-3 h-3" />
                {busy ? "…" : "Approve"}
              </button>
              <button
                onClick={() => resolve(approval._id, "deny")}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-300 disabled:opacity-50 transition-opacity"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <X className="w-3 h-3" />
                {busy ? "…" : "Deny"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
