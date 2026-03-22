"use client";

import { useQuery, useMutation } from "convex/react";
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
  Download,
  Eye,
  ExternalLink,
  MessageSquare,
  ListTodo,
  Send,
  User,
  Play,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";
import { Badge } from "../../components/ui/badge";
import { Id } from "../../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";

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
  user_comment:     { label: "YOU", color: "bg-primary/10 text-primary" },
};

/* ------------------------------------------------------------------ */
/*  Output format detection (heuristic until INT-33 adds outputFormat) */
/* ------------------------------------------------------------------ */

function detectOutputFormat(output: string, explicitFormat?: string): "markdown" | "html" | "text" {
  if (explicitFormat === "html" || explicitFormat === "markdown" || explicitFormat === "text") {
    return explicitFormat;
  }
  const trimmed = output.trim();

  // HTML: starts with doctype/html tag, or has substantial HTML structure
  if (
    /^<!doctype\s+html/i.test(trimmed) ||
    /^<html[\s>]/i.test(trimmed) ||
    (/<\/(div|section|article|main|body|head)>/i.test(trimmed) && trimmed.length > 200)
  ) {
    return "html";
  }

  // Markdown: headers, lists, code blocks, bold, links, tables
  const mdSignals = [
    /^#{1,6}\s/m, /^\s*[-*]\s/m, /^\s*\d+\.\s/m, /```/,
    /\*\*[^*]+\*\*/, /\[.+?\]\(.+?\)/, /^\s*>\s/m, /\|.+\|.+\|/,
  ];
  if (mdSignals.filter((re) => re.test(trimmed)).length >= 2) return "markdown";

  return "text";
}

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
            <Zap className="w-5 h-5 text-blue-600" />
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

type DetailTab = "overview" | "output" | "activity" | "subtasks";

function TaskDetailPanel({ taskId, task, agent, agentMap, childTasks, onClose }: TaskDetailPanelProps) {
  const activity = useQuery(api.activity.getByTask, { taskId });
  const addComment = useMutation(api.activity.addUserComment);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const status = task.status as TaskStatus;
  const meta = statusMeta[status] ?? statusMeta.pending;
  const role = agent?.role ?? "";
  const rc = roleColors[role];

  // Default to output tab for completed tasks, overview otherwise
  const defaultTab: DetailTab = (status === "done" && task.output) ? "output" : "overview";
  const [activeTab, setActiveTab] = useState<DetailTab>(defaultTab);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const handleStatusChange = async (newStatus: "pending" | "in_progress" | "done") => {
    setStatusMenuOpen(false);
    if (newStatus === status) return;
    await updateStatus({ taskId, status: newStatus });
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    await addComment({ taskId, content: text });
  };

  // Compute timeline events from activity
  const timelineEvents = useMemo(() => {
    const events: Array<{ time: number; icon: string; label: string; detail?: string }> = [];
    events.push({ time: task._creationTime, icon: "create", label: "Task created" });
    if (task.startedAt) events.push({ time: task.startedAt, icon: "start", label: "Execution started", detail: agent ? `Assigned to ${role}` : undefined });
    // Extract delegation events from activity
    if (activity) {
      for (const entry of activity) {
        if (entry.action === "delegated" || entry.action === "delegation_complete") {
          events.push({ time: entry._creationTime, icon: "delegate", label: "Delegated", detail: entry.content.slice(0, 80) });
        }
        if (entry.action === "findings_posted") {
          events.push({ time: entry._creationTime, icon: "findings", label: "Findings shared", detail: entry.content.slice(0, 80) });
        }
        if (entry.action === "approval_requested") {
          events.push({ time: entry._creationTime, icon: "approval", label: "Approval requested" });
        }
      }
    }
    if (task.completedAt) events.push({ time: task.completedAt, icon: "done", label: status === "cancelled" ? "Cancelled" : "Completed" });
    events.sort((a, b) => a.time - b.time);
    return events;
  }, [task, activity, agent, role, status]);

  const doneCount = childTasks.filter((c) => c.status === "done").length;
  const activityCount = activity?.length ?? 0;

  const tabs: Array<{ id: DetailTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "overview", label: "Overview", icon: <Eye className="w-3.5 h-3.5" /> },
    ...(task.output ? [{ id: "output" as DetailTab, label: "Output", icon: <FileText className="w-3.5 h-3.5" /> }] : []),
    { id: "activity", label: "Activity", icon: <MessageSquare className="w-3.5 h-3.5" />, count: activityCount },
    ...(childTasks.length > 0 ? [{ id: "subtasks" as DetailTab, label: "Sub-tasks", icon: <ListTodo className="w-3.5 h-3.5" />, count: childTasks.length }] : []),
  ];

  return (
    <div className="flex-1 min-w-[400px] border-l border-border bg-card flex flex-col overflow-hidden ml-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusDot status={status} />
            {/* Clickable status selector */}
            <div className="relative">
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer",
                  status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" :
                  status === "done" ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" :
                  status === "cancelled" ? "bg-stone-100 text-stone-500 border-stone-200" :
                  status === "pending_approval" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                )}
              >
                {meta.label}
                <ChevronRight className={cn("w-3 h-3 transition-transform", statusMenuOpen && "rotate-90")} />
              </button>
              {statusMenuOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                  {([
                    { value: "pending" as const, label: "To Do", dot: "bg-stone-400" },
                    { value: "in_progress" as const, label: "In Progress", dot: "bg-blue-500" },
                    { value: "done" as const, label: "Done", dot: "bg-green-500" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-secondary",
                        status === opt.value && "bg-primary/5 font-semibold"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", opt.dot)} />
                      {opt.label}
                      {status === opt.value && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
          {childTasks.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <ListTodo className="w-3 h-3" />
              {doneCount}/{childTasks.length} sub-tasks done
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0 px-5 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-[9px] tabular-nums opacity-60 ml-0.5">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {/* Overview tab — timeline + summary */}
        {activeTab === "overview" && (
          <div className="px-5 py-4 space-y-5">
            {/* Work history timeline */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Timeline
              </p>
              <div className="relative pl-5">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
                <div className="space-y-3">
                  {timelineEvents.map((evt, i) => (
                    <div key={i} className="relative flex items-start gap-3">
                      {/* Dot */}
                      <span className={cn(
                        "absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-card flex items-center justify-center",
                        evt.icon === "done" ? "border-green-500" :
                        evt.icon === "start" ? "border-blue-500" :
                        evt.icon === "delegate" ? "border-amber-500" :
                        evt.icon === "findings" ? "border-purple-500" :
                        evt.icon === "approval" ? "border-amber-500" :
                        "border-stone-400"
                      )}>
                        {evt.icon === "done" && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        {evt.icon === "start" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">{evt.label}</p>
                        {evt.detail && <p className="text-[10px] text-muted-foreground truncate">{evt.detail}</p>}
                        <p className="text-[9px] text-muted-foreground/50 tabular-nums">{timeAgo(evt.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration */}
            {task.startedAt && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/30">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Duration: {task.completedAt
                    ? formatDuration(task.completedAt - task.startedAt)
                    : `Running for ${formatDuration(Date.now() - task.startedAt)}`
                  }
                </span>
              </div>
            )}

            {/* Quick output preview if available */}
            {task.output && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Output preview
                  </p>
                  <button
                    onClick={() => setActiveTab("output")}
                    className="text-[10px] text-primary hover:text-primary/80 font-medium"
                  >
                    View full output
                  </button>
                </div>
                <div className="text-xs text-foreground/70 leading-relaxed bg-muted/20 rounded-xl p-3 border border-border/30 max-h-32 overflow-hidden relative">
                  {task.output.slice(0, 300)}
                  {task.output.length > 300 && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Output tab — rich rendering */}
        {activeTab === "output" && task.output && (
          <TaskOutputSection
            output={task.output}
            taskTitle={task.input}
            agentName={agent?.name}
            completedAt={task.completedAt}
          />
        )}

        {/* Activity tab — comments + activity feed */}
        {activeTab === "activity" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 px-5 py-4 overflow-y-auto">
              {!activity ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 rounded-lg animate-pulse bg-secondary/40" />
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic py-8 text-center">
                  No activity yet
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activity.map((entry) => {
                    const entryAgent = entry.agentId ? agentMap.get(entry.agentId) ?? null : null;
                    const entryRole = entryAgent?.role ?? "";
                    const entryRc = roleColors[entryRole];
                    const isUserComment = entry.action === "user_comment";
                    const al = isUserComment
                      ? { label: "YOU", color: "bg-primary/10 text-primary" }
                      : (actionLabels[entry.action] ?? { label: entry.action.toUpperCase(), color: "bg-stone-100 text-stone-600" });
                    const isOutput = entry.action === "agent_output";

                    return (
                      <div
                        key={entry._id}
                        className={cn(
                          "rounded-lg border px-3 py-2",
                          isUserComment
                            ? "bg-primary/5 border-primary/20"
                            : isOutput ? "bg-muted/10 border-border/30" : "bg-muted/30 border-border/30"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isUserComment ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-primary">
                              <User className="w-3 h-3" />
                              You
                            </span>
                          ) : entryAgent ? (
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[9px] font-semibold",
                              entryRc?.text ?? "text-stone-600"
                            )}>
                              <img src={roleAvatar[entryRole] ?? ""} alt={entryRole} className="w-3.5 h-3.5 rounded-full object-cover" />
                              {entryRole}
                            </span>
                          ) : null}
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

            {/* Comment input */}
            <div className="px-5 py-3 border-t border-border shrink-0 bg-card">
              <div className="flex items-center gap-2">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendComment(); }}
                  className="flex-1 h-8 px-3 rounded-lg border border-border bg-transparent text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim()}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    commentText.trim()
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tasks tab */}
        {activeTab === "subtasks" && childTasks.length > 0 && (
          <SubtasksSection childTasks={childTasks} agentMap={agentMap} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TaskOutputSection — rich rendered output with format detection      */
/* ------------------------------------------------------------------ */

function TaskOutputSection({ output, taskTitle, agentName, completedAt }: {
  output: string;
  taskTitle?: string;
  agentName?: string;
  completedAt?: number;
}) {
  const [showSource, setShowSource] = useState(false);
  const format = useMemo(() => detectOutputFormat(output), [output]);

  const handleOpenNewTab = () => {
    const blob = new Blob([output], { type: format === "html" ? "text/html" : "text/plain" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Output
          </p>
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider",
            format === "html" ? "bg-blue-50 text-blue-600" :
            format === "markdown" ? "bg-purple-50 text-purple-600" :
            "bg-stone-100 text-stone-500"
          )}>
            {format}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {format === "html" && (
            <>
              <button
                onClick={() => setShowSource(!showSource)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-1 rounded-lg hover:bg-secondary"
              >
                {showSource ? "Preview" : "Source"}
              </button>
              <button
                onClick={handleOpenNewTab}
                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-primary/5"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </button>
            </>
          )}
          <DownloadTextButton
            content={output}
            filename={format === "html" ? "output.html" : format === "markdown" ? "output.md" : "output.txt"}
            mimeType={format === "html" ? "text/html" : "text/plain"}
          />
          <DownloadPDFButton
            content={output}
            format={format}
            taskTitle={taskTitle}
            agentName={agentName}
            completedAt={completedAt}
          />
        </div>
      </div>

      {format === "html" ? (
        showSource ? (
          <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed overflow-y-auto font-mono bg-muted/20 rounded-xl p-4 border border-border/50 max-h-[60vh]">
            {output}
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-white">
            <iframe
              srcDoc={output}
              className="w-full border-0"
              style={{ minHeight: "400px", height: "60vh" }}
              sandbox="allow-scripts"
              title="HTML output preview"
            />
          </div>
        )
      ) : format === "markdown" ? (
        <div className="prose-interstice bg-muted/20 rounded-xl p-5 border border-border/50 overflow-y-auto max-h-[60vh]">
          <MarkdownRenderer content={output} />
        </div>
      ) : (
        <div className="text-[13px] text-foreground/85 whitespace-pre-wrap leading-relaxed overflow-y-auto bg-muted/20 rounded-xl p-5 border border-border/50 max-h-[60vh]">
          {output}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MarkdownRenderer — styled react-markdown for warm retro theme      */
/* ------------------------------------------------------------------ */

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-sm font-bold text-foreground mb-2 mt-3 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[13px] font-semibold text-foreground mb-1.5 mt-2.5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-semibold text-foreground mb-1 mt-2">{children}</h3>,
        p: ({ children }) => <p className="text-xs text-foreground/85 leading-relaxed mb-2">{children}</p>,
        ul: ({ children }) => <ul className="text-xs text-foreground/85 list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="text-xs text-foreground/85 list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <pre className="bg-card rounded-lg p-3 border border-border/50 overflow-x-auto mb-2">
              <code className="text-[11px] font-mono text-foreground/90">{children}</code>
            </pre>
          ) : (
            <code className="text-[11px] font-mono bg-primary/10 text-primary px-1 py-0.5 rounded" {...props}>{children}</code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-xs text-muted-foreground italic">{children}</blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
            {children}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="w-full text-[11px] border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="text-left font-semibold px-2 py-1 border-b border-border bg-muted/40">{children}</th>,
        td: ({ children }) => <td className="px-2 py-1 border-b border-border/40">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ------------------------------------------------------------------ */
/*  SubtasksSection — expandable subtask list with inline outputs      */
/* ------------------------------------------------------------------ */

function SubtasksSection({
  childTasks,
  agentMap,
}: {
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
  agentMap: Map<string, { _id: string; role: string; name: string }>;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
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
          const isExpanded = expandedIds.has(child._id);
          const hasOutput = !!child.output;

          return (
            <div key={child._id} className="rounded-lg border border-border/30 overflow-hidden">
              <div
                onClick={hasOutput ? () => toggle(child._id) : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 bg-muted/30",
                  hasOutput && "cursor-pointer hover:bg-muted/50 transition-colors"
                )}
              >
                {/* Expand chevron */}
                {hasOutput ? (
                  <ChevronRight className={cn(
                    "w-3 h-3 text-muted-foreground transition-transform duration-150 shrink-0",
                    isExpanded && "rotate-90"
                  )} />
                ) : (
                  <span className="w-3 shrink-0" />
                )}

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

              {/* Expanded subtask output */}
              {isExpanded && child.output && (
                <div className="px-3 pb-3 border-t border-border/20">
                  <SubtaskOutputRenderer output={child.output} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SubtaskOutputRenderer — compact rich output for subtask expansion   */
/* ------------------------------------------------------------------ */

function SubtaskOutputRenderer({ output }: { output: string }) {
  const format = useMemo(() => detectOutputFormat(output), [output]);

  if (format === "markdown") {
    return (
      <div className="pt-2 text-xs text-foreground/80 leading-relaxed max-h-48 overflow-y-auto">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-xs font-bold mb-1 mt-2 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xs font-semibold mb-1 mt-1.5">{children}</h2>,
            p: ({ children }) => <p className="text-xs leading-relaxed mb-1.5">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-3 mb-1.5 space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-3 mb-1.5 space-y-0.5">{children}</ol>,
            code: ({ children }) => <code className="text-[10px] font-mono bg-primary/10 text-primary px-0.5 rounded">{children}</code>,
          }}
        >
          {output}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="pt-2 text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-mono">
      {output}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DownloadTextButton — download output as a file                     */
/* ------------------------------------------------------------------ */

function DownloadTextButton({ content, filename, mimeType }: { content: string; filename: string; mimeType: string }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors font-medium"
    >
      <Download className="w-3 h-3" />
      Download
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  DownloadPDFButton — generate and download PDF from output          */
/* ------------------------------------------------------------------ */

function DownloadPDFButton({
  content,
  format,
  taskTitle,
  agentName,
  completedAt,
}: {
  content: string;
  format: "markdown" | "html" | "text";
  taskTitle?: string;
  agentName?: string;
  completedAt?: number;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const timestamp = completedAt
        ? new Date(completedAt).toLocaleString()
        : new Date().toLocaleString();

      let bodyHtml: string;
      if (format === "html") {
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        bodyHtml = bodyMatch ? bodyMatch[1] : content;
      } else if (format === "markdown") {
        bodyHtml = simpleMarkdownToHtml(content);
      } else {
        bodyHtml = `<pre style="white-space:pre-wrap;font-family:monospace;font-size:12px;line-height:1.6">${escapeHtml(content)}</pre>`;
      }

      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 0;">
          <div style="border-bottom: 2px solid #e8734a; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #1a1a1a;">
              ${escapeHtml(taskTitle || "Task Output")}
            </h1>
            <div style="font-size: 11px; color: #78716c;">
              ${agentName ? `<span>Agent: <strong>${escapeHtml(agentName)}</strong></span> &middot; ` : ""}
              <span>Completed: ${escapeHtml(timestamp)}</span>
              <span style="float: right; color: #e8734a; font-weight: 600;">Interstice</span>
            </div>
          </div>
          <div style="font-size: 13px; line-height: 1.7;">
            ${bodyHtml}
          </div>
        </div>
      `;

      await html2pdf()
        .set({
          margin: [16, 16, 16, 16],
          filename: `${(taskTitle || "output").slice(0, 40).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(wrapper)
        .save();
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors font-medium disabled:opacity-50"
    >
      <FileText className="w-3 h-3" />
      {loading ? "Generating..." : "PDF"}
    </button>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:#f5f2ed;padding:12px;border-radius:8px;font-size:11px;overflow-x:auto;border:1px solid #e7e2db"><code>$1</code></pre>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:600;margin:16px 0 8px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:600;margin:20px 0 8px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:700;margin:24px 0 8px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:#f5f2ed;padding:1px 4px;border-radius:3px;font-size:11px">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#e8734a">$1</a>')
    .replace(/^\s*[-*]\s+(.+)$/gm, '<li style="margin-left:20px;list-style:disc">$1</li>')
    .replace(/^\s*\d+\.\s+(.+)$/gm, '<li style="margin-left:20px;list-style:decimal">$1</li>')
    .replace(/^>\s+(.+)$/gm, '<blockquote style="border-left:3px solid #e8734a;padding-left:12px;color:#78716c;font-style:italic">$1</blockquote>')
    .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #e7e2db;margin:16px 0">')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.+)/, "<p>$1</p>");
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

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins < 60) return `${mins}m ${remSecs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function cleanInput(raw: string): string {
  return raw
    .replace(/\[OMI_UID:[^\]]+\]/g, "")
    .replace(/\[SYNTHESIS\]/g, "")
    .replace(/\[VOICE_COMMAND\]/g, "")
    .trim();
}
