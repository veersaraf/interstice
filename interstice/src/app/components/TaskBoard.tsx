"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Clock, Zap, AlertTriangle, CheckCircle2, XCircle, CircleDot } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";

const statusConfig = {
  pending:          { label: "Queued",    icon: Clock,         variant: "secondary" as const },
  in_progress:      { label: "Running",   icon: Zap,           variant: "info" as const      },
  pending_approval: { label: "Needs OK",  icon: AlertTriangle, variant: "warning" as const   },
  done:             { label: "Done",      icon: CheckCircle2,  variant: "success" as const   },
  cancelled:        { label: "Cancelled", icon: XCircle,       variant: "destructive" as const },
} as const;

const roleColors: Record<string, string> = {
  CEO:            "text-amber-700",
  Research:       "text-blue-700",
  Content:        "text-purple-700",
  Outreach:       "text-orange-700",
  Analytics:      "text-cyan-700",
};

export function TaskBoard() {
  const tasks  = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);

  if (!tasks || !agents) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));
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
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <CircleDot className="w-6 h-6 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Send a command to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[480px]">
      <div className="p-3 space-y-2">
        {topLevel.map((task) => {
          const agent    = task.agentId ? agentMap.get(task.agentId) : null;
          const children = childMap.get(task._id)?.filter((c) => !c.input.includes("[SYNTHESIS]")) ?? [];
          // Effective status: parent shows in_progress while any child is still running
          const effectiveStatus = children.length > 0 && task.status === "done"
            && children.some((c) => c.status !== "done" && c.status !== "cancelled")
            ? "in_progress" : task.status;
          const cfg      = statusConfig[effectiveStatus as keyof typeof statusConfig] ?? statusConfig.pending;
          const StatusIcon = cfg.icon;

          const displayInput = task.title || task.input
            .replace(/\[OMI_UID:[^\]]+\]/g, "")
            .replace(/\[SYNTHESIS\]/g, "")
            .trim();

          return (
            <div key={task._id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Task header */}
              <div className="px-3 py-2.5">
                <div className="flex items-start gap-2.5">
                  <StatusIcon className={cn("w-4 h-4 shrink-0 mt-0.5", {
                    "text-stone-400": effectiveStatus === "pending",
                    "text-blue-600": effectiveStatus === "in_progress",
                    "text-amber-600": effectiveStatus === "pending_approval",
                    "text-green-600": effectiveStatus === "done",
                    "text-red-600": effectiveStatus === "cancelled",
                  })} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">{displayInput}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {agent && (
                        <span className={cn("text-[10px] font-bold", roleColors[agent.role] ?? "text-stone-500")}>
                          {agent.role}
                        </span>
                      )}
                      <Badge variant={cfg.variant} className="text-[9px] px-1.5 py-0 h-4">
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              {children.length > 0 && (
                <div className="border-t border-border">
                  {children.map((child) => {
                    const childAgent = child.agentId ? agentMap.get(child.agentId) : null;
                    const childCfg = statusConfig[child.status as keyof typeof statusConfig] ?? statusConfig.pending;
                    const ChildIcon = childCfg.icon;

                    return (
                      <div
                        key={child._id}
                        className="flex items-center gap-2 px-3 py-1.5 border-t border-border/50 bg-muted/30"
                      >
                        <span className="text-muted-foreground/40 text-[10px] shrink-0 w-3">└</span>
                        <ChildIcon className={cn("w-3 h-3 shrink-0", {
                          "text-stone-400": child.status === "pending",
                          "text-blue-600": child.status === "in_progress",
                          "text-amber-600": child.status === "pending_approval",
                          "text-green-600": child.status === "done",
                          "text-red-600": child.status === "cancelled",
                        })} />
                        {childAgent && (
                          <span className={cn("text-[10px] font-bold shrink-0", roleColors[childAgent.role] ?? "text-stone-500")}>
                            {childAgent.role}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground truncate flex-1">
                          {child.input.substring(0, 60)}{child.input.length > 60 ? "..." : ""}
                        </span>
                        <Badge variant={childCfg.variant} className="text-[8px] px-1 py-0 h-3.5">
                          {childCfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
