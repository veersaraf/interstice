"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Clock,
  Zap,
  CircleDot,
} from "lucide-react";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { GameWorld } from "./components/GameWorld";
import { ApprovalToast } from "./components/ApprovalToast";
import { cn, timeAgo } from "../lib/utils";
import { useNavigate } from "./components/AppShell";
import { useMemo } from "react";

/* ─── Agent config ──────────────────────────────────────────── */
const agentConfig: Record<string, { avatar: string; color: string; bg: string; label: string; border: string }> = {
  CEO:            { avatar: "/avatars/ceo.png",            color: "text-amber-700",   bg: "bg-amber-50",   label: "CEO",      border: "border-amber-200" },
  Research:       { avatar: "/avatars/research.png",       color: "text-blue-700",    bg: "bg-blue-50",    label: "Research",  border: "border-blue-200" },
  Communications: { avatar: "/avatars/communications.png", color: "text-purple-700",  bg: "bg-purple-50",  label: "Comms",    border: "border-purple-200" },
  Developer:      { avatar: "/avatars/developer.png",      color: "text-emerald-700", bg: "bg-emerald-50", label: "Dev",      border: "border-emerald-200" },
  Call:           { avatar: "/avatars/call.png",           color: "text-orange-700",  bg: "bg-orange-50",  label: "Call",     border: "border-orange-200" },
};

/* ─── Status config ─────────────────────────────────────────── */
type TaskStatus = "pending" | "in_progress" | "pending_approval" | "done" | "cancelled";

const statusConfig: Record<TaskStatus, { label: string; dot: string; text: string; bg: string }> = {
  pending:          { label: "Queued",   dot: "bg-stone-300",               text: "text-stone-500", bg: "bg-stone-50" },
  in_progress:      { label: "Running",  dot: "bg-blue-500 animate-pulse",  text: "text-blue-600",  bg: "bg-blue-50" },
  pending_approval: { label: "Needs OK", dot: "bg-amber-500",               text: "text-amber-600", bg: "bg-amber-50" },
  done:             { label: "Done",     dot: "bg-green-500",               text: "text-green-600", bg: "bg-green-50" },
  cancelled:        { label: "Cancelled",dot: "bg-stone-300",               text: "text-stone-400", bg: "bg-stone-50" },
};

/* ─── Task Card — spacious, one per row ─────────────────────── */
function TaskCard({
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
  agent: { role: string; name: string } | null;
}) {
  const status = (task.status ?? "pending") as TaskStatus;
  const sc = statusConfig[status] ?? statusConfig.pending;
  const cfg = agent ? agentConfig[agent.role] : null;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:shadow-sm",
      "bg-white border-stone-200/60",
    )}>
      {/* Status dot */}
      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", sc.dot)} />

      {/* Agent avatar */}
      {cfg?.avatar ? (
        <img src={cfg.avatar} alt={cfg.label} className="w-7 h-7 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-stone-100 shrink-0" />
      )}

      {/* Task info */}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-stone-800 font-medium leading-snug line-clamp-1">{task.input}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {cfg && (
            <span className={cn("text-[10px] font-medium", cfg.color)}>{cfg.label}</span>
          )}
          <span className="text-[9px] text-stone-300">{timeAgo(task._creationTime)}</span>
        </div>
      </div>

      {/* Status badge */}
      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0", sc.bg, sc.text)}>
        {sc.label}
      </span>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const approvals = useQuery(api.approvals.listPending);
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const activityLog = useQuery(api.activity.list, { limit: 20 });

  const pendingApprovals = approvals?.length ?? 0;

  const agentMap = useMemo(
    () => new Map(agents?.map(a => [a._id, a]) ?? []),
    [agents],
  );

  // All tasks sorted: active first, then recent done — max 7
  const displayTasks = useMemo(() => {
    if (!tasks) return [];
    const active = tasks
      .filter(t => t.status !== "done" && t.status !== "cancelled")
      .sort((a, b) => {
        const order: Record<string, number> = { in_progress: 0, pending_approval: 1, pending: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
    const done = tasks
      .filter(t => t.status === "done")
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 3);
    return [...active, ...done].slice(0, 7);
  }, [tasks]);

  // Recent activity for inbox badge
  const recentActivity = useMemo(() => {
    if (!activityLog) return [];
    return [...activityLog]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);
  }, [activityLog]);

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* ─── Bento Grid ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 grid-rows-[1fr_auto] gap-3">

        {/* ─── TOP LEFT: Game View ──────────────────────────── */}
        <div className="lg:col-span-7 xl:col-span-7 lg:row-span-1 min-h-[320px]">
          <GameWorld />
        </div>

        {/* ─── RIGHT: Tasks / Issues (full height) ──────────── */}
        <div className="lg:col-span-5 xl:col-span-5 lg:row-span-2 min-h-0 flex flex-col overflow-hidden bg-white rounded-2xl border border-stone-200/60 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0">
            <div className="flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-stone-400" />
              <span className="text-xs font-semibold text-foreground">Tasks</span>
              {displayTasks.length > 0 && (
                <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full tabular-nums">
                  {displayTasks.length}
                </span>
              )}
            </div>
            <button onClick={() => navigate("tasks")} className="text-[10px] text-primary hover:underline font-medium">
              View all
            </button>
          </div>

          {/* Task list — spacious, max 7 */}
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {displayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Zap className="w-8 h-8 text-stone-200 mb-2" />
                <p className="text-xs text-stone-400 font-medium">No tasks yet</p>
                <p className="text-[10px] text-stone-300 mt-0.5">Give your team a command to get started</p>
              </div>
            ) : (
              displayTasks.map(t => (
                <TaskCard
                  key={t._id}
                  task={t}
                  agent={t.agentId ? agentMap.get(t.agentId) ?? null : null}
                />
              ))
            )}
          </div>

          {/* Recent activity footer — compact inbox peek */}
          {recentActivity.length > 0 && (
            <div className="border-t border-stone-100 px-4 py-2.5 shrink-0">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Recent</p>
              {recentActivity.slice(0, 3).map(a => {
                const agent = a.agentId ? agentMap.get(a.agentId) ?? null : null;
                const cfg = agent ? agentConfig[agent.role] : null;
                return (
                  <div key={a._id} className="flex items-center gap-2 py-1">
                    {cfg?.avatar ? (
                      <img src={cfg.avatar} alt={cfg.label} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-stone-100" />
                    )}
                    <p className="text-[10px] text-stone-500 line-clamp-1 flex-1">{a.content}</p>
                    <span className="text-[9px] text-stone-300 shrink-0">{timeAgo(a._creationTime)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── BOTTOM LEFT: Approvals (empty unless needed) ─── */}
        <div className="lg:col-span-7 xl:col-span-7 lg:row-span-1">
          {pendingApprovals > 0 ? (
            <div className="bg-white rounded-2xl border border-amber-200/60 shadow-sm overflow-hidden h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-100/60 shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-foreground">Needs Your Approval</span>
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full tabular-nums">
                    {pendingApprovals}
                  </span>
                </div>
                <button onClick={() => navigate("approvals")} className="text-[10px] text-primary hover:underline font-medium">
                  View all
                </button>
              </div>
              <div className="p-3">
                <ApprovalQueue />
              </div>
            </div>
          ) : (
            <div className="bg-stone-50/40 rounded-2xl border border-dashed border-stone-200/40 h-full flex items-center justify-center min-h-[80px]">
              <div className="text-center">
                <ShieldCheck className="w-6 h-6 text-stone-200 mx-auto mb-1" />
                <p className="text-[11px] text-stone-300 font-medium">No actions needed</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating approval toasts */}
      <ApprovalToast />
    </div>
  );
}
