"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Clock, Zap, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const statusConfig = {
  pending:          { label: "Queued",       icon: Clock,          color: "text-gray-400",   bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.2)" },
  in_progress:      { label: "Running",      icon: Zap,            color: "text-blue-400",   bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.2)"  },
  pending_approval: { label: "Needs OK",     icon: AlertTriangle,  color: "text-yellow-400", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.2)"   },
  done:             { label: "Done",         icon: CheckCircle2,   color: "text-green-400",  bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)"   },
  cancelled:        { label: "Cancelled",    icon: XCircle,        color: "text-red-400",    bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
} as const;

const roleColors: Record<string, string> = {
  CEO:            "text-yellow-400",
  Research:       "text-blue-400",
  Communications: "text-purple-400",
  Developer:      "text-green-400",
  Call:           "text-orange-400",
};

export function TaskBoard() {
  const tasks  = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);

  if (!tasks || !agents) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "var(--surface-3)" }} />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  // Build parent/child map
  const topLevel = tasks.filter((t) => !t.parentTaskId && !t.input.includes("[SYNTHESIS]")).slice(0, 5);
  const childMap = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (t.parentTaskId) {
      const arr = childMap.get(t.parentTaskId) ?? [];
      arr.push(t);
      childMap.set(t.parentTaskId, arr);
    }
  }

  if (topLevel.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-600">No tasks yet</p>
        <p className="text-xs text-gray-700 mt-1">Send a command to get started</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 overflow-y-auto max-h-[480px]">
      {topLevel.map((task) => {
        const agent    = task.agentId ? agentMap.get(task.agentId) : null;
        const cfg      = statusConfig[task.status as keyof typeof statusConfig] ?? statusConfig.pending;
        const children = childMap.get(task._id)?.filter((c) => !c.input.includes("[SYNTHESIS]")) ?? [];
        const StatusIcon = cfg.icon;

        const displayInput = task.input
          .replace(/\[OMI_UID:[^\]]+\]/g, "")
          .replace(/\[SYNTHESIS\]/g, "")
          .trim();

        return (
          <div
            key={task._id}
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
          >
            {/* Header */}
            <div className="px-3 py-2.5">
              <div className="flex items-start gap-2">
                <StatusIcon className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", cfg.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 line-clamp-2">{displayInput}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {agent && (
                      <span className={cn("text-[10px] font-semibold", roleColors[agent.role] ?? "text-gray-400")}>
                        {agent.role}
                      </span>
                    )}
                    <span className={cn("text-[10px]", cfg.color)}>{cfg.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtasks */}
            {children.length > 0 && (
              <div style={{ borderTop: `1px solid ${cfg.border}` }}>
                {children.map((child) => {
                  const childAgent = child.agentId ? agentMap.get(child.agentId) : null;
                  const childCfg   = statusConfig[child.status as keyof typeof statusConfig] ?? statusConfig.pending;
                  const ChildIcon  = childCfg.icon;

                  return (
                    <div
                      key={child._id}
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ borderTop: `1px solid rgba(255,255,255,0.04)` }}
                    >
                      <span className="text-gray-700 text-[10px] shrink-0">└</span>
                      <ChildIcon className={cn("w-3 h-3 shrink-0", childCfg.color)} />
                      {childAgent && (
                        <span className={cn("text-[10px] font-semibold shrink-0", roleColors[childAgent.role] ?? "text-gray-400")}>
                          {childAgent.role}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 truncate flex-1">
                        {child.input.substring(0, 60)}{child.input.length > 60 ? "…" : ""}
                      </span>
                      <span className={cn("text-[10px] shrink-0", childCfg.color)}>{childCfg.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
