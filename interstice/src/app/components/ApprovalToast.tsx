"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldCheck, Check, X } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";

const roleColors: Record<string, string> = {
  CEO:            "text-amber-700",
  Research:       "text-blue-700",
  Content:        "text-purple-700",
  Outreach:       "text-orange-700",
  Analytics:      "text-cyan-700",
};

export function ApprovalToast() {
  const approvals = useQuery(api.approvals.listPending);
  const agents = useQuery(api.agents.list);
  const [resolving, setResolving] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!approvals || !agents) return null;

  const agentMap = new Map(agents.map((a) => [a._id, a]));
  const visible = approvals.filter((a) => !dismissed.has(a._id));
  if (visible.length === 0) return null;

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
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {visible.map((approval) => {
        const agent = agentMap.get(approval.agentId);
        const busy = resolving === approval._id;

        return (
          <div
            key={approval._id}
            className="bg-white rounded-2xl border border-amber-200 shadow-lg p-4 animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-800">Needs your approval</p>
                {agent && (
                  <p className={cn("text-[10px] font-medium", roleColors[agent.role] ?? "text-stone-500")}>
                    {agent.role} wants to: {approval.action}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDismissed((s) => new Set([...s, approval._id]))}
                className="p-1 rounded-md hover:bg-stone-100 text-stone-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Details */}
            <p className="text-[11px] text-stone-600 leading-relaxed mb-3 line-clamp-3">
              {approval.details}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => resolve(approval._id, "approve")}
                disabled={busy}
                className={cn(
                  "flex-1 h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all",
                  "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                )}
              >
                <Check className="w-3 h-3" />
                {busy ? "..." : "Approve"}
              </button>
              <button
                onClick={() => resolve(approval._id, "deny")}
                disabled={busy}
                className={cn(
                  "flex-1 h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all",
                  "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                )}
              >
                <X className="w-3 h-3" />
                {busy ? "..." : "Deny"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
