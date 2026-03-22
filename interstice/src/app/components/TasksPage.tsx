"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Clock, Zap, AlertTriangle, CheckCircle2, XCircle, CircleDot, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

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
  Communications: "text-purple-700",
  Developer:      "text-emerald-700",
  Call:           "text-orange-700",
};

type FilterStatus = "all" | "active" | "done";

export function TasksPage() {
  const tasks  = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  if (!tasks || !agents) {
    return (
      <div className="max-w-[1100px] space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const filtered = tasks.filter((t) => {
    if (filter === "active") return ["pending", "in_progress", "pending_approval"].includes(t.status);
    if (filter === "done") return ["done", "cancelled"].includes(t.status);
    return true;
  });

  const topLevel = filtered.filter((t) => !t.parentTaskId && !t.input.includes("[SYNTHESIS]"));
  const childMap = new Map<string, typeof tasks>();
  for (const t of filtered) {
    if (t.parentTaskId) {
      const arr = childMap.get(t.parentTaskId) ?? [];
      arr.push(t);
      childMap.set(t.parentTaskId, arr);
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const counts = {
    all: tasks.length,
    active: tasks.filter((t) => ["pending", "in_progress", "pending_approval"].includes(t.status)).length,
    done: tasks.filter((t) => ["done", "cancelled"].includes(t.status)).length,
  };

  return (
    <div className="max-w-[1100px] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <CircleDot className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Tasks</h1>
        <span className="text-[11px] text-muted-foreground font-medium">{counts.all} total</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "all" as FilterStatus, label: "All" },
          { id: "active" as FilterStatus, label: "Active" },
          { id: "done" as FilterStatus, label: "Completed" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-3 py-2 text-xs font-medium transition-colors relative",
              filter === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className="ml-1.5 text-[10px] text-muted-foreground/60">{counts[tab.id]}</span>
            )}
            {filter === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {topLevel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
            <CircleDot className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No tasks yet</p>
          <p className="text-xs text-muted-foreground">Send a command to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topLevel.map((task) => {
            const agent = task.agentId ? agentMap.get(task.agentId) : null;
            const cfg = statusConfig[task.status as keyof typeof statusConfig] ?? statusConfig.pending;
            const children = childMap.get(task._id)?.filter((c) => !c.input.includes("[SYNTHESIS]")) ?? [];
            const StatusIcon = cfg.icon;
            const isExpanded = expandedTasks.has(task._id);

            const displayInput = task.input
              .replace(/\[OMI_UID:[^\]]+\]/g, "")
              .replace(/\[SYNTHESIS\]/g, "")
              .trim();

            return (
              <Card key={task._id} className="overflow-hidden">
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => toggleExpand(task._id)}
                >
                  <StatusIcon className={cn("w-4 h-4 shrink-0 mt-0.5", {
                    "text-zinc-400": task.status === "pending",
                    "text-blue-400": task.status === "in_progress",
                    "text-yellow-400": task.status === "pending_approval",
                    "text-emerald-400": task.status === "done",
                    "text-red-400": task.status === "cancelled",
                  })} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{displayInput}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {agent && (
                        <span className={cn("text-[11px] font-bold", roleColors[agent.role] ?? "text-zinc-400")}>
                          {agent.role}
                        </span>
                      )}
                      <Badge variant={cfg.variant} className="text-[10px]">
                        {cfg.label}
                      </Badge>
                      {children.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {children.length} subtask{children.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  {(children.length > 0 || task.output) && (
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", isExpanded && "rotate-180")} />
                  )}
                </div>

                {/* Expanded: Output */}
                {isExpanded && task.output && (
                  <div className="px-4 py-3 border-t border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Output</p>
                    <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-mono bg-muted/50 rounded-md p-3 border border-border/50">
                      {task.output}
                    </div>
                  </div>
                )}

                {/* Subtasks */}
                {isExpanded && children.length > 0 && (
                  <div className="border-t border-border">
                    {children.map((child) => {
                      const childAgent = child.agentId ? agentMap.get(child.agentId) : null;
                      const childCfg = statusConfig[child.status as keyof typeof statusConfig] ?? statusConfig.pending;
                      const ChildIcon = childCfg.icon;

                      return (
                        <div key={child._id}>
                          <div
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors cursor-pointer border-t border-border/50"
                            onClick={() => toggleExpand(child._id)}
                          >
                            <span className="text-muted-foreground/30 text-[10px] shrink-0 pl-2">└</span>
                            <ChildIcon className={cn("w-3.5 h-3.5 shrink-0", {
                              "text-zinc-400": child.status === "pending",
                              "text-blue-400": child.status === "in_progress",
                              "text-yellow-400": child.status === "pending_approval",
                              "text-emerald-400": child.status === "done",
                              "text-red-400": child.status === "cancelled",
                            })} />
                            {childAgent && (
                              <span className={cn("text-[11px] font-bold shrink-0", roleColors[childAgent.role] ?? "text-zinc-400")}>
                                {childAgent.role}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground truncate flex-1">
                              {child.input.replace(/\[OMI_UID:[^\]]+\]/g, "").replace(/\[SYNTHESIS\]/g, "").trim().substring(0, 100)}
                            </span>
                            <Badge variant={childCfg.variant} className="text-[9px] px-1.5 py-0 h-4">
                              {childCfg.label}
                            </Badge>
                          </div>
                          {expandedTasks.has(child._id) && child.output && (
                            <div className="px-4 py-3 pl-12 border-t border-border/50">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Output</p>
                              <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-mono bg-muted/50 rounded-md p-3 border border-border/50">
                                {child.output}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
