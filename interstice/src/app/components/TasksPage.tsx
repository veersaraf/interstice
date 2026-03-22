"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Clock, Zap, AlertTriangle, CheckCircle2, XCircle, CircleDot, ChevronDown } from "lucide-react";
import { useState } from "react";

const statusConfig = {
  pending:          { label: "Queued",       icon: Clock,          color: "text-gray-400",   bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.15)" },
  in_progress:      { label: "Running",      icon: Zap,            color: "text-blue-400",   bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.15)"  },
  pending_approval: { label: "Needs OK",     icon: AlertTriangle,  color: "text-yellow-400", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.15)"   },
  done:             { label: "Done",         icon: CheckCircle2,   color: "text-green-400",  bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.15)"   },
  cancelled:        { label: "Cancelled",    icon: XCircle,        color: "text-red-400",    bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.15)"   },
} as const;

const roleColors: Record<string, string> = {
  CEO:            "text-yellow-400",
  Research:       "text-blue-400",
  Communications: "text-purple-400",
  Developer:      "text-green-400",
  Call:           "text-orange-400",
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
          <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CircleDot className="w-4 h-4 text-gray-500" />
          <h1 className="text-sm font-semibold text-white">Tasks</h1>
          <span className="text-[11px] text-gray-500 font-medium">{counts.all} total</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
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
              filter === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className="ml-1.5 text-[10px] text-gray-600">{counts[tab.id]}</span>
            )}
            {filter === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {topLevel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
          >
            <CircleDot className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-gray-300 mb-1">No tasks yet</p>
          <p className="text-xs text-gray-500">Send a command to get started</p>
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
              <div
                key={task._id}
                className="rounded-lg overflow-hidden"
                style={{ background: "var(--surface-2)", border: `1px solid var(--border)` }}
              >
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleExpand(task._id)}
                >
                  <StatusIcon className={cn("w-4 h-4 shrink-0 mt-0.5", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 line-clamp-2">{displayInput}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {agent && (
                        <span className={cn("text-[11px] font-semibold", roleColors[agent.role] ?? "text-gray-400")}>
                          {agent.role}
                        </span>
                      )}
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        <span className={cfg.color}>{cfg.label}</span>
                      </span>
                      {children.length > 0 && (
                        <span className="text-[10px] text-gray-600">
                          {children.length} subtask{children.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  {(children.length > 0 || task.output) && (
                    <ChevronDown className={cn("w-4 h-4 text-gray-600 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                  )}
                </div>

                {/* Expanded: Output */}
                {isExpanded && task.output && (
                  <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Output</p>
                    <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-mono bg-black/20 rounded-md p-3">
                      {task.output}
                    </div>
                  </div>
                )}

                {/* Subtasks */}
                {isExpanded && children.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {children.map((child) => {
                      const childAgent = child.agentId ? agentMap.get(child.agentId) : null;
                      const childCfg = statusConfig[child.status as keyof typeof statusConfig] ?? statusConfig.pending;
                      const ChildIcon = childCfg.icon;

                      return (
                        <div key={child._id}>
                          <div
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                            onClick={() => toggleExpand(child._id)}
                          >
                            <span className="text-gray-700 text-[10px] shrink-0 pl-2">└</span>
                            <ChildIcon className={cn("w-3.5 h-3.5 shrink-0", childCfg.color)} />
                            {childAgent && (
                              <span className={cn("text-[11px] font-semibold shrink-0", roleColors[childAgent.role] ?? "text-gray-400")}>
                                {childAgent.role}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 truncate flex-1">
                              {child.input.replace(/\[OMI_UID:[^\]]+\]/g, "").replace(/\[SYNTHESIS\]/g, "").trim().substring(0, 100)}
                            </span>
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: childCfg.bg, border: `1px solid ${childCfg.border}` }}
                            >
                              <span className={childCfg.color}>{childCfg.label}</span>
                            </span>
                          </div>
                          {/* Child output */}
                          {expandedTasks.has(child._id) && child.output && (
                            <div className="px-4 py-3 pl-12" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Output</p>
                              <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-mono bg-black/20 rounded-md p-3">
                                {child.output}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
