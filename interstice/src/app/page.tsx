"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bot, CircleDot, ShieldCheck, FileText, Network, History, MessageSquare, Zap, ChevronDown, Copy, Check } from "lucide-react";
import { OrgChart } from "./components/OrgChart";
import { TaskBoard } from "./components/TaskBoard";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { CommandInput } from "./components/CommandInput";
import { cn } from "../lib/utils";
import { timeAgo } from "../lib/utils";
import { useState, useRef, useEffect } from "react";

/* ─── Metric Card ────────────────────────────────────────────────── */
function MetricCard({
  icon: Icon,
  value,
  label,
  description,
  accent = "blue",
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  description?: string;
  accent?: "blue" | "green" | "yellow" | "purple" | "cyan";
}) {
  const accentMap = {
    blue:   { bg: "rgba(59,130,246,0.06)",  icon: "text-blue-400",   border: "rgba(59,130,246,0.15)"  },
    green:  { bg: "rgba(34,197,94,0.06)",   icon: "text-green-400",  border: "rgba(34,197,94,0.15)"   },
    yellow: { bg: "rgba(234,179,8,0.06)",   icon: "text-yellow-400", border: "rgba(234,179,8,0.15)"   },
    purple: { bg: "rgba(168,85,247,0.06)",  icon: "text-purple-400", border: "rgba(168,85,247,0.15)"  },
    cyan:   { bg: "rgba(6,182,212,0.06)",   icon: "text-cyan-400",   border: "rgba(6,182,212,0.15)"   },
  };
  const colors = accentMap[accent];

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-white">
            {value}
          </p>
          <p className="text-xs font-medium text-gray-400 mt-1">{label}</p>
          {description && (
            <p className="text-[10px] text-gray-600 mt-1 hidden sm:block">{description}</p>
          )}
        </div>
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          <Icon className={cn("w-4 h-4", colors.icon)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Live Activity Stream (compact, for dashboard) ──────────────── */
const actionStyles: Record<string, { color: string; dot: string; label?: string }> = {
  command_received:    { color: "text-white",      dot: "bg-white",      label: "CMD"      },
  task_started:        { color: "text-blue-400",   dot: "bg-blue-400",   label: "START"    },
  agent_output:        { color: "text-gray-500",   dot: "bg-gray-600"                      },
  task_completed:      { color: "text-green-400",  dot: "bg-green-400",  label: "DONE"     },
  task_error:          { color: "text-red-400",    dot: "bg-red-400",    label: "ERR"      },
  delegated:           { color: "text-yellow-400", dot: "bg-yellow-400", label: "DELEGATE" },
  delegation_complete: { color: "text-yellow-300", dot: "bg-yellow-300", label: "SENT"     },
  findings_posted:     { color: "text-cyan-400",   dot: "bg-cyan-400",   label: "SHARED"   },
  synthesis_triggered: { color: "text-purple-400", dot: "bg-purple-400", label: "SYNTH"    },
  synthesis:           { color: "text-purple-300", dot: "bg-purple-300", label: "RESULT"   },
  approval_requested:  { color: "text-yellow-300", dot: "bg-yellow-300", label: "APPROVAL" },
};

function LiveActivityStream() {
  const activities = useQuery(api.activity.list, { limit: 80 });
  const agents = useQuery(api.agents.list);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Auto-scroll to top when new activities arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities?.length]);

  if (!activities || !agents) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-5 rounded animate-pulse" style={{ background: "var(--surface-3)" }} />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div ref={scrollRef} className="overflow-y-auto max-h-[400px]">
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center px-4">
          <Zap className="w-6 h-6 text-gray-700 mb-2" />
          <p className="text-sm text-gray-600">Waiting for commands…</p>
          <p className="text-xs text-gray-700 mt-1">Agent activity streams here in real-time</p>
        </div>
      ) : (
        <div className="font-mono text-[11px]">
          {activities.map((activity) => {
            const agent = activity.agentId ? agentMap.get(activity.agentId) : null;
            const styles = actionStyles[activity.action] ?? { color: "text-gray-600", dot: "bg-gray-700" };
            const isOutput = activity.action === "agent_output";
            const isExpanded = expandedItems.has(activity._id);
            const isLong = activity.content.length > 200;

            return (
              <div
                key={activity._id}
                className={cn(
                  "px-3 py-1 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03]",
                  isOutput && isLong && "cursor-pointer"
                )}
                onClick={() => isOutput && isLong && toggleExpand(activity._id)}
              >
                <div className={cn("flex items-start gap-2 leading-relaxed", styles.color)}>
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", styles.dot)} />

                  {styles.label && (
                    <span className="text-[9px] font-bold opacity-50 shrink-0 w-14 text-right tabular-nums">
                      {styles.label}
                    </span>
                  )}

                  {agent && (
                    <span className="font-bold shrink-0 text-[10px] opacity-60 w-16 truncate">
                      [{agent.role}]
                    </span>
                  )}

                  <span className={cn("break-words min-w-0 flex-1", isOutput && "opacity-60")}>
                    {isExpanded ? activity.content : (
                      isLong ? activity.content.substring(0, 200) + "…" : activity.content
                    )}
                  </span>

                  <span className="text-[9px] text-gray-700 shrink-0 tabular-nums opacity-60">
                    {timeAgo(activity._creationTime)}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-1 ml-5 p-2 rounded bg-black/20 text-[11px] text-gray-400 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {activity.content}
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

/* ─── Recent Findings (output panel for dashboard) ───────────────── */
const roleColors: Record<string, string> = {
  CEO:            "text-yellow-400",
  Research:       "text-blue-400",
  Communications: "text-purple-400",
  Developer:      "text-green-400",
  Call:           "text-orange-400",
};

function RecentFindings() {
  const findings = useQuery(api.findings.getRecent, { limit: 5 });
  const agents = useQuery(api.agents.list);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!findings || !agents) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: "var(--surface-3)" }} />
        ))}
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <FileText className="w-6 h-6 text-gray-700 mb-2" />
        <p className="text-sm text-gray-600">No output yet</p>
        <p className="text-xs text-gray-700 mt-1">Agent research, reports, and generated content will appear here</p>
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const toggleExpand = (id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyContent = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* no-op */ }
  };

  return (
    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      {findings.map((finding) => {
        const agent = agentMap.get(finding.agentId);
        const isExpanded = expandedFindings.has(finding._id);
        const isLong = finding.content.length > 300;
        const isCopied = copiedId === finding._id;

        return (
          <div key={finding._id} className="px-4 py-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-bold", roleColors[agent?.role ?? ""] ?? "text-gray-400")}>
                  {agent?.role ?? "Agent"}
                </span>
                {finding.summary && (
                  <span className="text-[10px] text-gray-500">— {finding.summary}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-700 tabular-nums">{timeAgo(finding._creationTime)}</span>
                <button
                  onClick={() => copyContent(finding.content, finding._id)}
                  className="p-1 rounded text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
                  title="Copy"
                >
                  {isCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className={cn(
                "text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono",
                !isExpanded && isLong && "max-h-24 overflow-hidden relative cursor-pointer"
              )}
              onClick={() => isLong && !isExpanded && toggleExpand(finding._id)}
            >
              {isExpanded ? finding.content : (isLong ? finding.content.substring(0, 300) : finding.content)}
              {!isExpanded && isLong && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--surface-2)] to-transparent" />
              )}
            </div>

            {isExpanded && (
              <button
                onClick={() => toggleExpand(finding._id)}
                className="text-[10px] text-blue-400 hover:text-blue-300 mt-1.5 font-medium"
              >
                Collapse ↑
              </button>
            )}
            {!isExpanded && isLong && (
              <button
                onClick={() => toggleExpand(finding._id)}
                className="text-[10px] text-blue-400 hover:text-blue-300 mt-1.5 font-medium"
              >
                Show full output →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Message Bus (compact) ──────────────────────────────────────── */
function CompactMessageBus() {
  const messages = useQuery(api.messages.list);
  const agents = useQuery(api.agents.list);

  if (!messages || !agents || messages.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-700">No inter-agent messages yet</p>
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));
  const recent = messages.slice(0, 6);

  return (
    <div className="p-3 space-y-1">
      {recent.map((msg) => {
        const from = agentMap.get(msg.from);
        const to = agentMap.get(msg.to);
        return (
          <div key={msg._id} className="flex items-start gap-2 text-[11px] py-0.5">
            <span className={cn("font-semibold shrink-0", roleColors[from?.role ?? ""] ?? "text-gray-400")}>
              {from?.role ?? "?"}
            </span>
            <span className="text-gray-700 shrink-0">→</span>
            <span className={cn("font-semibold shrink-0", roleColors[to?.role ?? ""] ?? "text-gray-400")}>
              {to?.role ?? "?"}
            </span>
            <span className="text-gray-600 truncate flex-1">
              {msg.content.substring(0, 60)}{msg.content.length > 60 ? "…" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const agents   = useQuery(api.agents.list);
  const tasks    = useQuery(api.tasks.list);
  const approvals = useQuery(api.approvals.listPending);
  const findings = useQuery(api.findings.list);

  const activeAgents    = agents?.filter((a) => a.status === "active").length ?? 0;
  const inProgressTasks = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const pendingApprovals = approvals?.length ?? 0;
  const totalFindings   = findings?.length ?? 0;

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Approval Banner + Cards */}
      {pendingApprovals > 0 && (
        <div
          className="rounded-lg px-4 py-3 flex items-center gap-2.5"
          style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)" }}
        >
          <ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-200 font-medium">
            {pendingApprovals} action{pendingApprovals > 1 ? "s" : ""} awaiting your approval
          </p>
        </div>
      )}
      <ApprovalQueue />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-2">
        <MetricCard icon={Bot} value={activeAgents} label="Active Agents" description={`${agents?.length ?? 0} total`} accent="green" />
        <MetricCard icon={CircleDot} value={inProgressTasks} label="Tasks Running" description={`${tasks?.filter(t => t.status === "pending").length ?? 0} queued`} accent="blue" />
        <MetricCard icon={ShieldCheck} value={pendingApprovals} label="Pending Approvals" accent="yellow" />
        <MetricCard icon={FileText} value={totalFindings} label="Findings" description="Agent output" accent="cyan" />
        <MetricCard icon={MessageSquare} value={0} label="Messages" description="Inter-agent" accent="purple" />
      </div>

      {/* Command Input */}
      <div
        className="rounded-lg p-4"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Send Command
        </p>
        <CommandInput />
      </div>

      {/* Main Content: 2-column layout — Activity + Output side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Live Activity Stream */}
        <SectionCard title="Live Activity" icon={History} className="min-h-[300px]">
          <LiveActivityStream />
        </SectionCard>

        {/* Right: Agent Output / Findings */}
        <SectionCard title="Agent Output" icon={FileText} className="min-h-[300px]">
          <RecentFindings />
        </SectionCard>
      </div>

      {/* Lower grid: Org Chart + Task Board + Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Org Chart */}
        <div className="lg:col-span-3">
          <SectionCard title="Organization" icon={Network}>
            <OrgChart />
          </SectionCard>
        </div>

        {/* Task Board */}
        <div className="lg:col-span-5">
          <SectionCard title="Task Board" icon={CircleDot}>
            <TaskBoard />
          </SectionCard>
        </div>

        {/* Messages */}
        <div className="lg:col-span-4">
          <SectionCard title="Agent Communications" icon={MessageSquare}>
            <CompactMessageBus />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ─── Section Card ───────────────────────────────────────────────── */
function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-lg overflow-hidden flex flex-col", className)}
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
