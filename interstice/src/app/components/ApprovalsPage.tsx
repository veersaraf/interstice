"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldCheck, Check, X, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";
import { timeAgo } from "../../lib/utils";

const roleColors: Record<string, string> = {
  CEO:            "text-yellow-400",
  Research:       "text-blue-400",
  Communications: "text-purple-400",
  Developer:      "text-green-400",
  Call:           "text-orange-400",
};

export function ApprovalsPage() {
  const pending = useQuery(api.approvals.listPending);
  const all = useQuery(api.approvals.list);
  const agents = useQuery(api.agents.list);
  const [resolving, setResolving] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  if (!agents) {
    return (
      <div className="max-w-[1000px] space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));
  const approvals = tab === "pending" ? (pending ?? []) : (all ?? []);

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
    <div className="max-w-[1000px] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-gray-500" />
        <h1 className="text-sm font-semibold text-white">Approvals</h1>
        {(pending?.length ?? 0) > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
            {pending!.length} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-2 text-xs font-medium transition-colors relative capitalize",
              tab === t ? "text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {t}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-t" />}
          </button>
        ))}
      </div>

      {/* List */}
      {approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}
          >
            <ShieldCheck className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-sm font-medium text-gray-300 mb-1">
            {tab === "pending" ? "No pending approvals" : "No approvals yet"}
          </p>
          <p className="text-xs text-gray-500">
            Actions requiring approval will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {approvals.map((approval) => {
            const agent = agentMap.get(approval.agentId);
            const busy = resolving === approval._id;
            const isPending = approval.status === "pending";
            const isApproved = approval.status === "approved";

            return (
              <div
                key={approval._id}
                className="rounded-lg overflow-hidden"
                style={{
                  background: isPending ? "rgba(234,179,8,0.04)" : "var(--surface-2)",
                  border: `1px solid ${isPending ? "rgba(234,179,8,0.2)" : "var(--border)"}`,
                }}
              >
                <div className="px-4 py-3 flex items-start gap-4">
                  {/* Status icon */}
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: isPending ? "rgba(234,179,8,0.15)" : isApproved ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    }}
                  >
                    {isPending ? <Clock className="w-4 h-4 text-yellow-400" />
                    : isApproved ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {agent && (
                        <span className={cn("text-xs font-bold", roleColors[agent.role] ?? "text-gray-400")}>
                          {agent.role}
                        </span>
                      )}
                      <span className={cn("text-xs font-semibold", isPending ? "text-yellow-300" : isApproved ? "text-green-300" : "text-red-300")}>
                        {approval.action}
                      </span>
                      <span className="text-[10px] text-gray-600 ml-auto">
                        {timeAgo(approval._creationTime)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {approval.details}
                    </p>
                  </div>

                  {/* Action buttons */}
                  {isPending && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => resolve(approval._id, "approve")}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-green-300 disabled:opacity-50 transition-all hover:brightness-110"
                        style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
                      >
                        <Check className="w-3 h-3" />
                        {busy ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => resolve(approval._id, "deny")}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-300 disabled:opacity-50 transition-all hover:brightness-110"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
                      >
                        <X className="w-3 h-3" />
                        {busy ? "…" : "Deny"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
