"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ShieldCheck, Users, Zap, BarChart3, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { CommandInput } from "./components/CommandInput";
import { GameWorld } from "./components/GameWorld";
import { GameActivityLog } from "./components/GameActivityLog";
import { Card } from "../components/ui/card";
import { cn } from "../lib/utils";
import { useNavigate } from "./components/AppShell";

/* ─── Metric Card ────────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  iconColor,
  pulse,
  onClick,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  iconColor?: string;
  pulse?: boolean;
  onClick?: () => void;
}) {
  const isEmpty = value === 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all",
        "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        isEmpty
          ? "bg-stone-50/60 border-stone-200/40 shadow-none"
          : cn("bg-white shadow-sm btn-retro", accent),
      )}
    >
      <div className="relative">
        <Icon className={cn("w-6 h-6", isEmpty ? "text-stone-300" : (iconColor ?? "text-muted-foreground"))} />
        {pulse && value > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        )}
      </div>
      <div className="min-w-0">
        <p className={cn(
          "text-xl font-bold leading-none tabular-nums",
          isEmpty ? "text-stone-300" : "text-foreground"
        )}>{value}</p>
        <p className={cn(
          "text-[10px] font-medium mt-0.5",
          isEmpty ? "text-stone-400" : "text-muted-foreground"
        )}>{label}</p>
      </div>
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

  const pendingApprovals = approvals?.length ?? 0;
  const activeAgents = agents?.filter(a => a.status === "active").length ?? 0;
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress").length ?? 0;
  const totalFindings = findings?.length ?? 0;

  return (
    <div className="h-full flex flex-col gap-3 max-w-[1800px]">
      {/* Approval Banner */}
      {pendingApprovals > 0 && (
        <button
          onClick={() => navigate("approvals")}
          className="rounded-2xl px-4 py-2.5 flex items-center gap-2.5 bg-amber-50 border border-amber-200/60 shrink-0 w-full text-left hover:bg-amber-100/60 transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800 font-medium">
            {pendingApprovals} action{pendingApprovals > 1 ? "s" : ""} awaiting your approval
          </p>
        </button>
      )}

      {pendingApprovals > 0 && (
        <div className="shrink-0">
          <ApprovalQueue />
        </div>
      )}

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        <MetricCard
          label="Active Agents"
          value={activeAgents}
          icon={Users}
          iconColor="text-green-600"
          accent="border-green-200/60"
          pulse={true}
          onClick={() => navigate("agents")}
        />
        <MetricCard
          label="Tasks Running"
          value={inProgressTasks}
          icon={Zap}
          iconColor="text-blue-600"
          accent="border-blue-200/60"
          onClick={() => navigate("tasks")}
        />
        <MetricCard
          label="Needs Your OK"
          value={pendingApprovals}
          icon={ShieldCheck}
          iconColor="text-amber-600"
          accent={pendingApprovals > 0 ? "border-amber-300 bg-amber-50/50" : "border-amber-200/60"}
          onClick={() => navigate("approvals")}
        />
        <MetricCard
          label="Results"
          value={totalFindings}
          icon={BarChart3}
          iconColor="text-cyan-600"
          accent="border-cyan-200/60"
          onClick={() => navigate("findings")}
        />
      </div>

      {/* Main Layout: Operations View (left) + Chat Log (right) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7 xl:col-span-8 min-h-[400px]">
          <GameWorld />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 min-h-[400px]">
          <GameActivityLog />
        </div>
      </div>

      {/* Command Input */}
      <Card className="p-3 shrink-0 rounded-2xl">
        <CommandInput />
      </Card>
    </div>
  );
}
