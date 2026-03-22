"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldCheck, Check, X } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

const roleColors: Record<string, string> = {
  CEO:            "text-amber-700",
  Research:       "text-blue-700",
  Communications: "text-purple-700",
  Developer:      "text-emerald-700",
  Call:           "text-orange-700",
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
          <Card
            key={approval._id}
            className="p-4 flex items-start gap-4 border-amber-200 bg-amber-50"
          >
            {/* Icon */}
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 border border-amber-200">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {agent && (
                  <span className={cn("text-xs font-bold", roleColors[agent.role] ?? "text-stone-500")}>
                    {agent.role}
                  </span>
                )}
                <span className="text-xs font-semibold text-amber-700">
                  wants to: {approval.action}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {approval.details}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => resolve(approval._id, "approve")}
                disabled={busy}
                className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:text-green-800"
              >
                <Check className="w-3 h-3" />
                {busy ? "..." : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => resolve(approval._id, "deny")}
                disabled={busy}
                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
              >
                <X className="w-3 h-3" />
                {busy ? "..." : "Deny"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
