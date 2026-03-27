"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ShieldCheck,
  Users,
  Zap,
  BarChart3,
  Inbox,
  ListTodo,
  FileText,
  Check,
  X,
  ChevronRight,
  Clock,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { GameWorld } from "./components/GameWorld";
import { GameActivityLog } from "./components/GameActivityLog";
import { ApprovalToast } from "./components/ApprovalToast";
import { cn, timeAgo } from "../lib/utils";
import { useNavigate } from "./components/AppShell";
import { useState, useMemo } from "react";
import { Id } from "../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";

/* ─── Agent config ──────────────────────────────────────────── */
const agentConfig: Record<string, { avatar: string; color: string; bg: string; label: string }> = {
  CEO:            { avatar: "/avatars/ceo.png",            color: "text-amber-700",   bg: "bg-amber-50",   label: "CEO" },
  Research:       { avatar: "/avatars/research.png",       color: "text-blue-700",    bg: "bg-blue-50",    label: "Research" },
  Communications: { avatar: "/avatars/communications.png", color: "text-purple-700",  bg: "bg-purple-50",  label: "Comms" },
  Developer:      { avatar: "/avatars/developer.png",      color: "text-emerald-700", bg: "bg-emerald-50", label: "Dev" },
  Call:           { avatar: "/avatars/call.png",           color: "text-orange-700",  bg: "bg-orange-50",  label: "Call" },
};

/* ─── Section Card wrapper ──────────────────────────────────── */
function SectionCard({
  title,
  icon: Icon,
  count,
  children,
  className,
  onClick,
}: {
  title: string;
  icon: React.ElementType;
  count?: number;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div className={cn("bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-stone-400" />
          <span className="text-xs font-semibold text-foreground">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full tabular-nums">
              {count}
            </span>
          )}
        </div>
        {onClick && (
          <button onClick={onClick} className="text-[10px] text-primary hover:underline font-medium">
            View all
          </button>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* ─── Compact activity row ──────────────────────────────────── */
function ActivityRow({
  activity,
  agent,
}: {
  activity: { _id: string; action: string; content: string; _creationTime: number };
  agent: { role: string } | null;
}) {
  const cfg = agent ? agentConfig[agent.role] : null;
  const isCommand = activity.action === "command_received";
  const isError = activity.action === "task_error";
  const isFinding = activity.action === "findings_posted";
  const isDone = activity.action === "task_completed";
  const isApproval = activity.action === "approval_requested";

  const label = (() => {
    switch (activity.action) {
      case "command_received": return "You said";
      case "task_started": return `${cfg?.label ?? "Agent"} started`;
      case "agent_output": return cfg?.label ?? "Agent";
      case "task_completed": return `${cfg?.label ?? "Agent"} finished`;
      case "task_error": return `${cfg?.label ?? "Agent"} error`;
      case "delegated": return "CEO assigned work";
      case "findings_posted": return `${cfg?.label ?? "Agent"} shared results`;
      case "approval_requested": return `${cfg?.label ?? "Agent"} needs your OK`;
      case "synthesis": return "CEO summarized";
      default: return cfg?.label ?? "Agent";
    }
  })();

  return (
    <div className="flex items-start gap-2.5 py-2 group">
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isCommand ? (
          <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center">
            <span className="text-[10px]">🎙️</span>
          </div>
        ) : cfg?.avatar ? (
          <img src={cfg.avatar} alt={cfg.label} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-stone-100" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[11px] font-semibold",
            isError ? "text-red-600" : isApproval ? "text-amber-700" : isFinding ? "text-green-700" : isDone ? "text-green-600" : cfg?.color ?? "text-stone-600"
          )}>
            {label}
          </span>
          <span className="text-[9px] text-stone-300">{timeAgo(activity._creationTime)}</span>
        </div>
        <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5 line-clamp-2">
          {activity.content}
        </p>
      </div>

      {/* Status indicator */}
      {isDone && <Check className="w-3 h-3 text-green-500 mt-1.5 shrink-0" />}
      {isError && <X className="w-3 h-3 text-red-400 mt-1.5 shrink-0" />}
      {isApproval && <AlertTriangle className="w-3 h-3 text-amber-500 mt-1.5 shrink-0" />}
    </div>
  );
}

/* ─── Task row for To-Do section ────────────────────────────── */
type TaskStatus = "pending" | "in_progress" | "pending_approval" | "done" | "cancelled";

const statusDot: Record<TaskStatus, string> = {
  pending: "bg-stone-300",
  in_progress: "bg-blue-500 animate-pulse",
  pending_approval: "bg-amber-500",
  done: "bg-green-500",
  cancelled: "bg-stone-300",
};

const statusLabel: Record<TaskStatus, string> = {
  pending: "Queued",
  in_progress: "Running",
  pending_approval: "Needs OK",
  done: "Done",
  cancelled: "Cancelled",
};

function TaskRow({
  task,
  agent,
}: {
  task: {
    _id: string;
    input: string;
    status: string;
    agent?: string;
    priority?: string;
    _creationTime: number;
  };
  agent: { role: string } | null;
}) {
  const status = (task.status ?? "pending") as TaskStatus;
  const cfg = agent ? agentConfig[agent.role] : null;

  return (
    <div className="flex items-center gap-2.5 py-2 group">
      <span className={cn("w-2 h-2 rounded-full shrink-0", statusDot[status] ?? "bg-stone-300")} />
      {cfg?.avatar && (
        <img src={cfg.avatar} alt={cfg.label} className="w-5 h-5 rounded-full object-cover shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-stone-700 leading-tight line-clamp-1">{task.input}</p>
      </div>
      <span className="text-[9px] text-stone-400 shrink-0">{statusLabel[status]}</span>
    </div>
  );
}

/* ─── Issue card (for right-side Issues section) ────────────── */
function IssueCard({
  finding,
  agent,
}: {
  finding: {
    _id: string;
    content: string;
    agentId: string;
    _creationTime: number;
  };
  agent: { role: string } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = agent ? agentConfig[agent.role] : null;
  const preview = finding.content.length > 150 ? finding.content.slice(0, 150) + "…" : finding.content;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left bg-white rounded-xl border border-stone-200/60 p-3 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-2 mb-1.5">
        {cfg?.avatar && (
          <img src={cfg.avatar} alt={cfg.label} className="w-5 h-5 rounded-full object-cover" />
        )}
        <span className={cn("text-[10px] font-semibold", cfg?.color ?? "text-stone-600")}>
          {cfg?.label ?? "Agent"}
        </span>
        <span className="text-[9px] text-stone-300 ml-auto">{timeAgo(finding._creationTime)}</span>
      </div>
      {expanded ? (
        <div className="text-[11px] text-stone-600 leading-relaxed prose-sm">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-3 mb-1.5 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-3 mb-1.5 space-y-0.5">{children}</ol>,
              strong: ({ children }) => <strong className="font-semibold text-stone-800">{children}</strong>,
              h1: ({ children }) => <p className="font-bold text-xs mt-2 mb-1 text-foreground">{children}</p>,
              h2: ({ children }) => <p className="font-semibold text-[11px] mt-1.5 mb-0.5 text-foreground">{children}</p>,
              h3: ({ children }) => <p className="font-semibold text-[11px] mt-1 mb-0.5 text-foreground">{children}</p>,
              code: ({ children }) => <code className="text-[10px] bg-stone-50 rounded px-1 py-0.5 font-mono">{children}</code>,
            }}
          >{finding.content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-3">{preview}</p>
      )}
    </button>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const approvals = useQuery(api.approvals.listPending);
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const findings = useQuery(api.findings.getRecent, { limit: 10 });
  const activityLog = useQuery(api.activity.list, { limit: 20 });

  const pendingApprovals = approvals?.length ?? 0;
  const activeAgents = agents?.filter(a => a.status === "active").length ?? 0;
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress").length ?? 0;
  const totalFindings = findings?.length ?? 0;

  const agentMap = useMemo(
    () => new Map(agents?.map(a => [a._id, a]) ?? []),
    [agents],
  );

  // Recent inbox activity (last 15)
  const recentActivity = useMemo(() => {
    if (!activityLog) return [];
    return [...activityLog]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 15);
  }, [activityLog]);

  // Active + pending tasks
  const activeTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter(t => t.status !== "done" && t.status !== "cancelled")
      .sort((a, b) => {
        const order: Record<string, number> = { in_progress: 0, pending_approval: 1, pending: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      })
      .slice(0, 8);
  }, [tasks]);

  // Recent changes (completed tasks)
  const recentDone = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter(t => t.status === "done")
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* ─── Metrics strip ────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <button
          onClick={() => navigate("agents")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all hover:shadow-sm hover:-translate-y-0.5",
            activeAgents > 0 ? "bg-white border-green-200/60 shadow-sm" : "bg-stone-50/60 border-stone-200/40",
          )}
        >
          <Users className={cn("w-4 h-4", activeAgents > 0 ? "text-green-600" : "text-stone-300")} />
          <div>
            <p className={cn("text-lg font-bold leading-none tabular-nums", activeAgents > 0 ? "text-foreground" : "text-stone-300")}>{activeAgents}</p>
            <p className="text-[9px] text-muted-foreground">Active</p>
          </div>
          {activeAgents > 0 && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-auto" />}
        </button>

        <button
          onClick={() => navigate("tasks")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all hover:shadow-sm hover:-translate-y-0.5",
            inProgressTasks > 0 ? "bg-white border-blue-200/60 shadow-sm" : "bg-stone-50/60 border-stone-200/40",
          )}
        >
          <Zap className={cn("w-4 h-4", inProgressTasks > 0 ? "text-blue-600" : "text-stone-300")} />
          <div>
            <p className={cn("text-lg font-bold leading-none tabular-nums", inProgressTasks > 0 ? "text-foreground" : "text-stone-300")}>{inProgressTasks}</p>
            <p className="text-[9px] text-muted-foreground">Running</p>
          </div>
        </button>

        <button
          onClick={() => navigate("approvals")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all hover:shadow-sm hover:-translate-y-0.5",
            pendingApprovals > 0 ? "bg-amber-50/50 border-amber-300 shadow-sm" : "bg-stone-50/60 border-stone-200/40",
          )}
        >
          <ShieldCheck className={cn("w-4 h-4", pendingApprovals > 0 ? "text-amber-600" : "text-stone-300")} />
          <div>
            <p className={cn("text-lg font-bold leading-none tabular-nums", pendingApprovals > 0 ? "text-foreground" : "text-stone-300")}>{pendingApprovals}</p>
            <p className="text-[9px] text-muted-foreground">Approvals</p>
          </div>
        </button>

        <button
          onClick={() => navigate("findings")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all hover:shadow-sm hover:-translate-y-0.5",
            totalFindings > 0 ? "bg-white border-cyan-200/60 shadow-sm" : "bg-stone-50/60 border-stone-200/40",
          )}
        >
          <BarChart3 className={cn("w-4 h-4", totalFindings > 0 ? "text-cyan-600" : "text-stone-300")} />
          <div>
            <p className={cn("text-lg font-bold leading-none tabular-nums", totalFindings > 0 ? "text-foreground" : "text-stone-300")}>{totalFindings}</p>
            <p className="text-[9px] text-muted-foreground">Results</p>
          </div>
        </button>
      </div>

      {/* ─── Main two-column layout ───────────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* ─── LEFT COLUMN: Inbox, Changes, To Do, Approvals ── */}
        <div className="lg:col-span-7 xl:col-span-8 min-h-0 overflow-auto space-y-3 pb-3">
          {/* Approvals (only if pending) */}
          {pendingApprovals > 0 && (
            <SectionCard title="Approvals" icon={ShieldCheck} count={pendingApprovals} onClick={() => navigate("approvals")}>
              <ApprovalQueue />
            </SectionCard>
          )}

          {/* Inbox — recent activity */}
          <SectionCard title="Inbox" icon={Inbox} count={recentActivity.length}>
            {recentActivity.length === 0 ? (
              <p className="text-[11px] text-stone-400 py-4 text-center">No activity yet. Give your team a command to get started.</p>
            ) : (
              <div className="divide-y divide-stone-50">
                {recentActivity.map(a => (
                  <ActivityRow
                    key={a._id}
                    activity={a}
                    agent={a.agentId ? agentMap.get(a.agentId) ?? null : null}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Changes — recently completed work */}
          {recentDone.length > 0 && (
            <SectionCard title="Changes" icon={FileText} count={recentDone.length} onClick={() => navigate("tasks")}>
              <div className="divide-y divide-stone-50">
                {recentDone.map(t => (
                  <TaskRow
                    key={t._id}
                    task={t}
                    agent={t.agentId ? agentMap.get(t.agentId) ?? null : null}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {/* To Do — active tasks */}
          <SectionCard title="To Do" icon={ListTodo} count={activeTasks.length} onClick={() => navigate("tasks")}>
            {activeTasks.length === 0 ? (
              <p className="text-[11px] text-stone-400 py-4 text-center">No open tasks right now.</p>
            ) : (
              <div className="divide-y divide-stone-50">
                {activeTasks.map(t => (
                  <TaskRow
                    key={t._id}
                    task={t}
                    agent={t.agentId ? agentMap.get(t.agentId) ?? null : null}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ─── RIGHT COLUMN: Game View + Issues ───────────────── */}
        <div className="lg:col-span-5 xl:col-span-4 min-h-0 flex flex-col gap-3 overflow-hidden">
          {/* Game View — agent world */}
          <div className="shrink-0 h-[45%] min-h-[280px]">
            <GameWorld />
          </div>

          {/* Issues — findings / outputs */}
          <div className="flex-1 min-h-0 bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-stone-400" />
                <span className="text-xs font-semibold text-foreground">Issues</span>
                {totalFindings > 0 && (
                  <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full tabular-nums">
                    {totalFindings}
                  </span>
                )}
              </div>
              <button onClick={() => navigate("findings")} className="text-[10px] text-primary hover:underline font-medium">
                View all
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {(!findings || findings.length === 0) ? (
                <p className="text-[11px] text-stone-400 py-6 text-center">No results yet. Agents will post findings here.</p>
              ) : (
                findings.map(f => (
                  <IssueCard
                    key={f._id}
                    finding={f}
                    agent={f.agentId ? agentMap.get(f.agentId) ?? null : null}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating approval toasts */}
      <ApprovalToast />
    </div>
  );
}
