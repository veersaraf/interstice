"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bot, CircleDot, ShieldCheck, FileText, Network, History, MessageSquare } from "lucide-react";
import { OrgChart } from "./components/OrgChart";
import { TaskBoard } from "./components/TaskBoard";
import { ActivityFeed } from "./components/ActivityFeed";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { CommandInput } from "./components/CommandInput";
import { MessageBus } from "./components/MessageBus";
import { cn } from "../lib/utils";

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
  accent?: "blue" | "green" | "yellow" | "purple";
}) {
  const accentMap = {
    blue:   { bg: "rgba(59,130,246,0.08)",  icon: "text-blue-400",   border: "rgba(59,130,246,0.2)"  },
    green:  { bg: "rgba(34,197,94,0.08)",   icon: "text-green-400",  border: "rgba(34,197,94,0.2)"   },
    yellow: { bg: "rgba(234,179,8,0.08)",   icon: "text-yellow-400", border: "rgba(234,179,8,0.2)"   },
    purple: { bg: "rgba(168,85,247,0.08)",  icon: "text-purple-400", border: "rgba(168,85,247,0.2)"  },
  };
  const colors = accentMap[accent];

  return (
    <div
      className="rounded-lg p-4 sm:p-5"
      style={{ background: "var(--surface-2)", border: `1px solid var(--border)` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-white">
            {value}
          </p>
          <p className="text-xs sm:text-sm font-medium text-gray-400 mt-1">{label}</p>
          {description && (
            <p className="text-xs text-gray-600 mt-1.5 hidden sm:block">{description}</p>
          )}
        </div>
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          <Icon className={cn("w-4 h-4", colors.icon)} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const agents   = useQuery(api.agents.list);
  const tasks    = useQuery(api.tasks.list);
  const approvals = useQuery(api.approvals.listPending);
  const findings = useQuery(api.findings.list);

  const activeAgents   = agents?.filter((a) => a.status === "active").length ?? 0;
  const inProgressTasks = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const pendingApprovals = approvals?.length ?? 0;
  const totalFindings  = findings?.length ?? 0;

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Pending Approvals Banner */}
      {pendingApprovals > 0 && (
        <div
          className="rounded-lg px-4 py-3 flex items-start justify-between gap-4"
          style={{
            background: "rgba(234,179,8,0.08)",
            border: "1px solid rgba(234,179,8,0.25)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-200 font-medium">
              {pendingApprovals} action{pendingApprovals > 1 ? "s" : ""} awaiting your approval
            </p>
          </div>
        </div>
      )}

      {/* Approval Cards */}
      <ApprovalQueue />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          icon={Bot}
          value={activeAgents}
          label="Active Agents"
          description={`${agents?.length ?? 0} total in org`}
          accent="green"
        />
        <MetricCard
          icon={CircleDot}
          value={inProgressTasks}
          label="Tasks Running"
          description={`${tasks?.filter(t => t.status === "pending").length ?? 0} queued`}
          accent="blue"
        />
        <MetricCard
          icon={ShieldCheck}
          value={pendingApprovals}
          label="Pending Approvals"
          description="Awaiting your review"
          accent="yellow"
        />
        <MetricCard
          icon={FileText}
          value={totalFindings}
          label="Findings Shared"
          description="Agent research posted"
          accent="purple"
        />
      </div>

      {/* Command Input */}
      <div
        className="rounded-lg p-4"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Send Command
        </p>
        <CommandInput />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Org Chart */}
        <div className="lg:col-span-3">
          <SectionCard title="Organization" icon={Network}>
            <OrgChart />
          </SectionCard>
        </div>

        {/* Center: Task Board */}
        <div className="lg:col-span-5">
          <SectionCard title="Task Board" icon={CircleDot}>
            <TaskBoard />
          </SectionCard>
        </div>

        {/* Right: Activity + Messages */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <SectionCard title="Live Activity" icon={History} className="flex-1">
            <ActivityFeed />
          </SectionCard>
          <SectionCard title="Agent Communications" icon={MessageSquare}>
            <MessageBus />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

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
        className="px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
