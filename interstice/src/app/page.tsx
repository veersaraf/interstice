"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ShieldCheck } from "lucide-react";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { CommandInput } from "./components/CommandInput";
import { GameWorld } from "./components/GameWorld";
import { GameActivityLog } from "./components/GameActivityLog";
import { Card } from "../components/ui/card";
import { cn } from "../lib/utils";
import { useNavigate } from "./components/AppShell";

/* ─── Metric Card (retro style with emoji) ───────────────────── */
function MetricCard({
  label,
  value,
  emoji,
  accent,
  pulse,
  onClick,
}: {
  label: string;
  value: number;
  emoji: string;
  accent: string;
  pulse?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border shadow-sm btn-retro text-left transition-all",
        "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        accent,
      )}
    >
      <div className="relative">
        <span className="text-2xl">{emoji}</span>
        {pulse && value > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground leading-none tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
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
          <span className="text-lg">⚠️</span>
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
          emoji="🧑‍💼"
          accent="border-green-200/60"
          pulse={true}
          onClick={() => navigate("agents")}
        />
        <MetricCard
          label="Tasks Running"
          value={inProgressTasks}
          emoji="⚡"
          accent="border-blue-200/60"
          onClick={() => navigate("tasks")}
        />
        <MetricCard
          label="Needs Your OK"
          value={pendingApprovals}
          emoji="🛡️"
          accent={pendingApprovals > 0 ? "border-amber-300 bg-amber-50/50" : "border-amber-200/60"}
          onClick={() => navigate("approvals")}
        />
        <MetricCard
          label="Results"
          value={totalFindings}
          emoji="📊"
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
