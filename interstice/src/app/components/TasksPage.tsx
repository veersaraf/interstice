"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { timeAgo } from "../../lib/utils";
import {
  Search,
  ChevronRight,
  CircleDot,
  SlidersHorizontal,
  X,
  Clock,
  Zap,
  FileText,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "../../components/ui/badge";
import { Id } from "../../../convex/_generated/dataModel";

/* ------------------------------------------------------------------ */
/*  Status & role config                                               */
/* ------------------------------------------------------------------ */

type TaskStatus = "pending" | "in_progress" | "pending_approval" | "done" | "cancelled";

const statusMeta: Record<TaskStatus, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  pending:          { label: "Queued",      dotColor: "border-stone-400",   bgColor: "bg-stone-100",   textColor: "text-stone-600" },
  in_progress:      { label: "Running",     dotColor: "border-blue-500",    bgColor: "bg-blue-50",     textColor: "text-blue-700" },
  pending_approval: { label: "Needs OK",    dotColor: "border-amber-500",   bgColor: "bg-amber-50",    textColor: "text-amber-700" },
  done:             { label: "Done",        dotColor: "border-green-500",   bgColor: "bg-green-50",    textColor: "text-green-700" },
  cancelled:        { label: "Cancelled",   dotColor: "border-stone-400",   bgColor: "bg-stone-100",   textColor: "text-stone-500" },
};

const roleColors: Record<string, { text: string; bg: string }> = {
  CEO:            { text: "text-amber-700",   bg: "bg-amber-50" },
  Research:       { text: "text-blue-700",    bg: "bg-blue-50" },
  Communications: { text: "text-purple-700",  bg: "bg-purple-50" },
  Developer:      { text: "text-emerald-700", bg: "bg-emerald-50" },
  Call:           { text: "text-orange-700",  bg: "bg-orange-50" },
};

const roleAvatar: Record<string, string> = {
  CEO: "/avatars/ceo.png", Research: "/avatars/research.png", Communications: "/avatars/communications.png", Developer: "/avatars/developer.png", Call: "/avatars/call.png",
};

type FilterPreset = "all" | "active" | "done";
type SortField = "created" | "updated" | "status";

/* ------------------------------------------------------------------ */
/*  StatusDot — Paperclip-style circular status indicator              */
/* ------------------------------------------------------------------ */

function StatusDot({ status, size = "md" }: { status: TaskStatus; size?: "sm" | "md" }) {
  const meta = statusMeta[status] ?? statusMeta.pending;
  const dim = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const isDone = status === "done";
  const isCancelled = status === "cancelled";
  const isActive = status === "in_progress";

  return (
    <span
      className={cn(
        "relative shrink-0 rounded-full border-[1.5px] flex items-center justify-center",
        dim,
        meta.dotColor,
        isActive && "shadow-[0_0_6px_rgba(59,130,246,0.35)]"
      )}
      title={meta.label}
    >
      {isDone && (
        <span className={cn("rounded-full bg-green-500", size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      )}
      {isCancelled && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-[60%] h-[1.5px] bg-stone-400 rotate-45 rounded-full" />
        </span>
      )}
      {isActive && (
        <span className="absolute inset-0 rounded-full border border-blue-500 animate-ping opacity-30" />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Action label prettifier                                            */
/* ------------------------------------------------------------------ */

const actionLabels: Record<string, { label: string; color: string }> = {
  command_received: { label: "CMD", color: "bg-primary/10 text-primary" },
  task_started:     { label: "START", color: "bg-blue-50 text-blue-700" },
  agent_output:     { label: "OUTPUT", color: "bg-stone-100 text-stone-600" },
  task_completed:   { label: "DONE", color: "bg-green-50 text-green-700" },
  task_error:       { label: "ERR", color: "bg-red-50 text-red-700" },
  delegated:        { label: "DELEGATE", color: "bg-amber-50 text-amber-700" },
  delegation_complete: { label: "DELEGATED", color: "bg-amber-50 text-amber-700" },
  findings_posted:  { label: "SHARED", color: "bg-purple-50 text-purple-700" },
  synthesis:        { label: "SYNTH", color: "bg-emerald-50 text-emerald-700" },
  synthesis_triggered: { label: "SYNTH", color: "bg-emerald-50 text-emerald-700" },
  approval_requested: { label: "APPROVAL", color: "bg-amber-50 text-amber-700" },
  files_written:    { label: "FILE", color: "bg-emerald-50 text-emerald-700" },
  task_cancelled:   { label: "CANCELLED", color: "bg-stone-100 text-stone-500" },
};

/* ------------------------------------------------------------------ */
/*  TasksPage                                                          */
/* ------------------------------------------------------------------ */

export function TasksPage() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);

  const [filter, setFilter] = useState<FilterPreset>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  /* ---- data transforms ---- */
  const agentMap = useMemo(
    () => new Map((agents ?? []).map((a) => [a._id, a])),
    [agents]
  );

  const { filtered, counts } = useMemo(() => {
    if (!tasks) return { filtered: [], counts: { all: 0, active: 0, done: 0 } };

    const all = tasks;
    const counts = {
      all: all.length,
      active: all.filter((t) => ["pending", "in_progress", "pending_approval"].includes(t.status)).length,
      done: all.filter((t) => ["done", "cancelled"].includes(t.status)).length,
    };

    let result = all;

    // Filter by preset
    if (filter === "active") result = result.filter((t) => ["pending", "in_progress", "pending_approval"].includes(t.status));
    if (filter === "done") result = result.filter((t) => ["done", "cancelled"].includes(t.status));

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const input = cleanInput(t.input).toLowerCase();
        const agent = t.agentId ? agentMap.get(t.agentId) : null;
        const roleName = agent?.role?.toLowerCase() ?? "";
        return input.includes(q) || roleName.includes(q);
      });
    }

    return { filtered: result, counts };
  }, [tasks, filter, search, agentMap]);

  // Separate top-level vs children
  const { topLevel, childMap } = useMemo(() => {
    const childMap = new Map<string, typeof filtered>();
    const topLevel: typeof filtered = [];

    for (const t of filtered) {
      if (t.parentTaskId && !t.input.includes("[SYNTHESIS]")) {
        const arr = childMap.get(t.parentTaskId) ?? [];
        arr.push(t);
        childMap.set(t.parentTaskId, arr);
      } else if (!t.input.includes("[SYNTHESIS]")) {
        topLevel.push(t);
      }
    }

    // Sort top-level
    topLevel.sort((a, b) => {
      if (sortField === "status") {
        const order: Record<string, number> = { in_progress: 0, pending_approval: 1, pending: 2, done: 3, cancelled: 4 };
        const diff = (order[a.status] ?? 5) - (order[b.status] ?? 5);
        if (diff !== 0) return sortAsc ? diff : -diff;
      }
      // Default: by creation time
      const aTime = a._creationTime ?? 0;
      const bTime = b._creationTime ?? 0;
      return sortAsc ? aTime - bTime : bTime - aTime;
    });

    return { topLevel, childMap };
  }, [filtered, sortField, sortAsc]);

  /* ---- helpers ---- */
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  // Find the selected task object
  const selectedTask = selectedTaskId
    ? (tasks ?? []).find((t) => t._id === selectedTaskId) ?? null
    : null;

  /* ---- loading ---- */
  if (!tasks || !agents) {
    return (
      <div className="max-w-[1100px] space-y-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-11 rounded-lg animate-pulse bg-secondary/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-0 h-full max-h-[calc(100vh-7rem)]">
      {/* ---- Left: Task list ---- */}
      <div className={cn(
        "flex flex-col min-w-0 transition-all duration-200",
        selectedTask ? "w-[420px] shrink-0" : "flex-1 max-w-[1100px]"
      )}>
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚡</span>
            <h1 className="text-sm font-semibold text-foreground">Tasks</h1>
            <span className="text-[11px] text-muted-foreground tabular-nums">{counts.all}</span>
          </div>
        </div>

        {/* ---- Toolbar: search + filters ---- */}
        <div className="flex items-center gap-2 mb-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-transparent text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => toggleSort("status")}
            className={cn(
              "h-8 px-2.5 rounded-lg border border-border flex items-center gap-1.5 text-xs transition-colors",
              sortField === "status" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {sortField === "status" ? "By status" : "Newest"}
            </span>
            <span className="text-[10px]">{sortAsc ? "↑" : "↓"}</span>
          </button>
        </div>

        {/* ---- Quick filter tabs ---- */}
        <div className="flex gap-1 mb-3">
          {([
            { id: "all" as FilterPreset, label: "All" },
            { id: "active" as FilterPreset, label: "Active" },
            { id: "done" as FilterPreset, label: "Completed" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className="ml-1.5 text-[10px] tabular-nums opacity-60">{counts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>

        {/* ---- Task list ---- */}
        {topLevel.length === 0 ? (
          <EmptyState hasSearch={search.length > 0} />
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-card overflow-y-auto flex-1">
            {topLevel.map((task, i) => {
              const children = childMap.get(task._id)?.filter((c) => !c.input.includes("[SYNTHESIS]")) ?? [];
              const isSelected = selectedTaskId === task._id;
              const isLast = i === topLevel.length - 1;

              return (
                <div key={task._id}>
                  <TaskRow
                    task={task}
                    agent={task.agentId ? agentMap.get(task.agentId) ?? null : null}
                    childCount={children.length}
                    isSelected={isSelected}
                    onSelect={() => setSelectedTaskId(isSelected ? null : task._id)}
                    isLast={isLast}
                    compact={!!selectedTask}
                  />

                  {/* Always show subtasks inline when task is selected */}
                  {isSelected && children.length > 0 && (
                    <div className="bg-muted/30">
                      {children.map((child, ci) => (
                        <TaskRow
                          key={child._id}
                          task={child}
                          agent={child.agentId ? agentMap.get(child.agentId) ?? null : null}
                          childCount={0}
                          isSelected={selectedTaskId === child._id}
                          onSelect={() => setSelectedTaskId(child._id)}
                          isChild
                          isLast={ci === children.length - 1 && isLast}
                          compact={!!selectedTask}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Right: Task detail panel ---- */}
      {selectedTask && (
        <TaskDetailPanel
          taskId={selectedTask._id as Id<"tasks">}
          task={selectedTask}
          agent={selectedTask.agentId ? agentMap.get(selectedTask.agentId) ?? null : null}
          agentMap={agentMap}
          childTasks={(childMap.get(selectedTask._id) ?? []).filter((c) => !c.input.includes("[SYNTHESIS]"))}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TaskRow — single row in the list                                   */
/* ------------------------------------------------------------------ */

interface TaskRowProps {
  task: {
    _id: string;
    _creationTime: number;
    status: string;
    input: string;
    output?: string;
    agentId?: string;
    startedAt?: number;
    completedAt?: number;
  };
  agent: { _id: string; role: string; name: string } | null;
  childCount: number;
  isSelected: boolean;
  onSelect: () => void;
  isChild?: boolean;
  isLast?: boolean;
  compact?: boolean;
}

function TaskRow({ task, agent, childCount, isSelected, onSelect, isChild, isLast, compact }: TaskRowProps) {
  const status = task.status as TaskStatus;
  const meta = statusMeta[status] ?? statusMeta.pending;
  const role = agent?.role ?? "";
  const rc = roleColors[role];
  const displayText = cleanInput(task.input);

  const timestamp = task.completedAt ?? task.startedAt ?? task._creationTime;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 transition-colors group cursor-pointer",
        isSelected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-accent/40 border-l-2 border-l-transparent",
        !isLast && "border-b border-border/50",
        isChild && "pl-10"
      )}
    >
      {/* Expand chevron */}
      <span className="w-4 shrink-0 flex items-center justify-center">
        {childCount > 0 ? (
          <ChevronRight
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-150",
              isSelected && "rotate-90"
            )}
          />
        ) : isChild ? (
          <span className="text-muted-foreground/30 text-[10px]">└</span>
        ) : null}
      </span>

      {/* Status dot */}
      <StatusDot status={status} size={isChild ? "sm" : "md"} />

      {/* Title */}
      <span className={cn(
        "flex-1 min-w-0 truncate text-foreground",
        isChild ? "text-xs" : "text-[13px] font-medium"
      )}>
        {displayText.length > (compact ? 60 : 120) ? displayText.slice(0, compact ? 60 : 120) + "…" : displayText}
      </span>

      {/* Agent badge */}
      {agent && !compact && (
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
            rc?.bg ?? "bg-stone-50",
            rc?.text ?? "text-stone-600"
          )}
        >
          <img src={roleAvatar[role] ?? ""} alt={role} className="w-4 h-4 rounded-full object-cover" />
          {role}
        </span>
      )}

      {/* Status badge */}
      <Badge
        variant={
          status === "in_progress" ? "info"
            : status === "pending_approval" ? "warning"
              : status === "done" ? "success"
                : status === "cancelled" ? "destructive"
                  : "secondary"
        }
        className="text-[10px] px-2 py-0 h-5 shrink-0"
      >
        {meta.label}
      </Badge>

      {/* Subtask count */}
      {childCount > 0 && !compact && (
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {childCount} sub
        </span>
      )}

      {/* Live indicator */}
      {status === "in_progress" && (
        <span className="shrink-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[9px] font-bold text-blue-600 tracking-wide">LIVE</span>
        </span>
      )}

      {/* Time */}
      {timestamp > 0 && !compact && (
        <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0 w-14 text-right">
          {timeAgo(timestamp)}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TaskDetailPanel — right-side detail view with activity feed        */
/* ------------------------------------------------------------------ */

interface TaskDetailPanelProps {
  taskId: Id<"tasks">;
  task: {
    _id: string;
    _creationTime: number;
    status: string;
    input: string;
    output?: string;
    agentId?: string;
    parentTaskId?: string;
    startedAt?: number;
    completedAt?: number;
  };
  agent: { _id: string; role: string; name: string } | null;
  agentMap: Map<string, { _id: string; role: string; name: string }>;
  childTasks: Array<{
    _id: string;
    _creationTime: number;
    status: string;
    input: string;
    output?: string;
    agentId?: string;
    startedAt?: number;
    completedAt?: number;
  }>;
  onClose: () => void;
}

function TaskDetailPanel({ taskId, task, agent, agentMap, childTasks, onClose }: TaskDetailPanelProps) {
  const activity = useQuery(api.activity.getByTask, { taskId });
  const status = task.status as TaskStatus;
  const meta = statusMeta[status] ?? statusMeta.pending;
  const role = agent?.role ?? "";
  const rc = roleColors[role];

  return (
    <div className="flex-1 min-w-[400px] border-l border-border bg-card flex flex-col overflow-hidden ml-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusDot status={status} />
            <Badge
              variant={
                status === "in_progress" ? "info"
                  : status === "pending_approval" ? "warning"
                    : status === "done" ? "success"
                      : status === "cancelled" ? "destructive"
                        : "secondary"
              }
              className="text-[10px] px-2 py-0 h-5"
            >
              {meta.label}
            </Badge>
            {status === "in_progress" && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[9px] font-bold text-blue-600 tracking-wide">LIVE</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task description */}
        <p className="text-sm font-medium text-foreground leading-relaxed mb-3">
          {cleanInput(task.input)}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          {agent && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                rc?.bg ?? "bg-stone-50",
                rc?.text ?? "text-stone-600"
              )}
            >
              <img src={roleAvatar[role] ?? ""} alt={role} className="w-4 h-4 rounded-full object-cover" />
              {role}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            Created {timeAgo(task._creationTime)}
          </span>
          {task.startedAt && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Zap className="w-3 h-3" />
              Started {timeAgo(task.startedAt)}
            </span>
          )}
          {task.completedAt && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <FileText className="w-3 h-3" />
              Done {timeAgo(task.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Sub-tasks section */}
        {childTasks.length > 0 && (
          <div className="px-5 py-4 border-b border-border/50">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Sub-tasks ({childTasks.length})
            </p>
            <div className="space-y-1.5">
              {childTasks.map((child) => {
                const childStatus = child.status as TaskStatus;
                const childMeta = statusMeta[childStatus] ?? statusMeta.pending;
                const childAgent = child.agentId ? agentMap.get(child.agentId) ?? null : null;
                const childRole = childAgent?.role ?? "";
                const childRc = roleColors[childRole];

                return (
                  <div
                    key={child._id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 border border-border/30"
                  >
                    <StatusDot status={childStatus} size="sm" />
                    <span className="flex-1 min-w-0 truncate text-xs text-foreground">
                      {cleanInput(child.input).slice(0, 80)}
                    </span>
                    {childAgent && (
                      <span className={cn(
                        "shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold",
                        childRc?.bg ?? "bg-stone-50", childRc?.text ?? "text-stone-600"
                      )}>
                        <img src={roleAvatar[childRole] ?? ""} alt={childRole} className="w-3 h-3 rounded-full object-cover" />
                        {childRole}
                      </span>
                    )}
                    <Badge
                      variant={
                        childStatus === "in_progress" ? "info"
                          : childStatus === "done" ? "success"
                            : childStatus === "pending_approval" ? "warning"
                              : "secondary"
                      }
                      className="text-[9px] px-1.5 py-0 h-4 shrink-0"
                    >
                      {childMeta.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Output section */}
        {task.output && (
          <div className="px-5 py-4 border-b border-border/50">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Output
            </p>
            <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-mono bg-muted/20 rounded-lg p-3 border border-border/50">
              {task.output}
            </div>
          </div>
        )}

        {/* Activity / Comments feed */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Activity ({activity?.length ?? 0})
          </p>

          {!activity ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse bg-secondary/40" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic py-4 text-center">
              No activity yet
            </p>
          ) : (
            <div className="space-y-1">
              {activity.map((entry) => {
                const entryAgent = entry.agentId ? agentMap.get(entry.agentId) ?? null : null;
                const entryRole = entryAgent?.role ?? "";
                const entryRc = roleColors[entryRole];
                const al = actionLabels[entry.action] ?? { label: entry.action.toUpperCase(), color: "bg-stone-100 text-stone-600" };
                const isOutput = entry.action === "agent_output";

                return (
                  <div
                    key={entry._id}
                    className={cn(
                      "rounded-lg border border-border/30 px-3 py-2",
                      isOutput ? "bg-muted/10" : "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {entryAgent && (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-semibold",
                          entryRc?.text ?? "text-stone-600"
                        )}>
                          <img src={roleAvatar[entryRole] ?? ""} alt={entryRole} className="w-3.5 h-3.5 rounded-full object-cover" />
                          {entryRole}
                        </span>
                      )}
                      <span className={cn(
                        "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                        al.color
                      )}>
                        {al.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 ml-auto tabular-nums">
                        {timeAgo(entry._creationTime)}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs leading-relaxed",
                      isOutput
                        ? "text-foreground/70 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto"
                        : "text-foreground/80"
                    )}>
                      {entry.content.length > 500
                        ? entry.content.slice(0, 500) + "…"
                        : entry.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EmptyState                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
        <CircleDot className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        {hasSearch ? "No matching tasks" : "No tasks yet"}
      </p>
      <p className="text-xs text-muted-foreground">
        {hasSearch ? "Try a different search term" : "Tell your team what to do to get started"}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function cleanInput(raw: string): string {
  return raw
    .replace(/\[OMI_UID:[^\]]+\]/g, "")
    .replace(/\[SYNTHESIS\]/g, "")
    .replace(/\[VOICE_COMMAND\]/g, "")
    .trim();
}
