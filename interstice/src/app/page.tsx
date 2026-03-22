"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ShieldCheck, Users, ListChecks, FileText, Clock } from "lucide-react";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { CommandInput } from "./components/CommandInput";
import { GameWorld } from "./components/GameWorld";
import { GameActivityLog } from "./components/GameActivityLog";
import { Card } from "../components/ui/card";
import { cn } from "../lib/utils";

/* ─── Metric Card ────────────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-stone-200/80 shadow-sm btn-retro">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", accent)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-foreground leading-none tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard() {
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
        <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2.5 bg-amber-50 border border-amber-200/60 shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {pendingApprovals} action{pendingApprovals > 1 ? "s" : ""} awaiting your approval
          </p>
        </div>
      )}

      {pendingApprovals > 0 && (
        <div className="shrink-0">
          <ApprovalQueue />
        </div>
      )}

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        <MetricCard label="Active Agents" value={activeAgents} icon={Users} accent="bg-green-50 text-green-600" />
        <MetricCard label="Tasks Running" value={inProgressTasks} icon={Clock} accent="bg-blue-50 text-blue-600" />
        <MetricCard label="Pending Approvals" value={pendingApprovals} icon={ShieldCheck} accent="bg-amber-50 text-amber-600" />
        <MetricCard label="Results" value={totalFindings} icon={FileText} accent="bg-cyan-50 text-cyan-600" />
      </div>

      {/* Main Layout: Operations View (left) + Activity Log (right) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7 xl:col-span-8 min-h-[400px]">
          <GameWorld />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 min-h-[400px]">
          <GameActivityLog />
        </div>
      </div>

      {/* Command Input */}
      <Card className="p-3 shrink-0">
        <CommandInput />
      </Card>
    </div>
  );
}
