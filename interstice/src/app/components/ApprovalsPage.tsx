"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldCheck, Check, X, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn, timeAgo } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

const roleColors: Record<string, string> = {
  CEO:            "text-amber-700",
  Research:       "text-blue-700",
  Communications: "text-purple-700",
  Developer:      "text-emerald-700",
  Call:           "text-orange-700",
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
          <div key={i} className="h-20 rounded-lg animate-pulse bg-secondary" />
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
        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Approvals</h1>
        {(pending?.length ?? 0) > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {pending!.length} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-2 text-xs font-medium transition-colors relative capitalize",
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />}
          </button>
        ))}
      </div>

      {/* List */}
      {approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-amber-50 border border-amber-200">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {tab === "pending" ? "No pending approvals" : "No approvals yet"}
          </p>
          <p className="text-xs text-muted-foreground">
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
              <Card
                key={approval._id}
                className={cn(
                  "overflow-hidden",
                  isPending && "border-amber-200 bg-amber-50/50"
                )}
              >
                <div className="px-4 py-3 flex items-start gap-4">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      isPending ? "bg-amber-100" : isApproved ? "bg-green-100" : "bg-red-100"
                    )}
                  >
                    {isPending ? <Clock className="w-4 h-4 text-amber-600" />
                    : isApproved ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <XCircle className="w-4 h-4 text-red-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {agent && (
                        <span className={cn("text-xs font-bold", roleColors[agent.role] ?? "text-stone-500")}>
                          {agent.role}
                        </span>
                      )}
                      <span className={cn("text-xs font-semibold",
                        isPending ? "text-amber-700" : isApproved ? "text-green-700" : "text-red-700"
                      )}>
                        {approval.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 ml-auto">
                        {timeAgo(approval._creationTime)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {approval.details}
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => resolve(approval._id, "approve")}
                        disabled={busy}
                        className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                      >
                        <Check className="w-3 h-3" />
                        {busy ? "..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolve(approval._id, "deny")}
                        disabled={busy}
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      >
                        <X className="w-3 h-3" />
                        {busy ? "..." : "Deny"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
