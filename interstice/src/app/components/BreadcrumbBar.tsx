"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const sectionLabels: Record<string, string> = {
  dashboard:  "Dashboard",
  tasks:      "Tasks",
  agents:     "Agents",
  activity:   "Activity",
  approvals:  "Approvals",
  messages:   "Messages",
  findings:   "Output & Findings",
  goals:      "Goals",
  contacts:   "Contacts",
};

interface BreadcrumbBarProps {
  section: string;
}

export function BreadcrumbBar({ section }: BreadcrumbBarProps) {
  const agents = useQuery(api.agents.list);
  const activeAgents = agents?.filter((a) => a.status === "active") ?? [];
  const runningTask = agents?.find((a) => a.status === "active")?.currentTask;

  return (
    <div className="h-12 px-6 flex items-center justify-between shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground text-xs font-medium">Interstice</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
        <span className="text-foreground font-semibold text-xs tracking-wide uppercase">
          {sectionLabels[section] ?? section}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        {activeAgents.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-green-600 font-semibold tabular-nums">
                {activeAgents.length} agent{activeAgents.length > 1 ? "s" : ""} running
              </span>
            </div>
            {runningTask && (
              <span className="text-[11px] text-muted-foreground max-w-xs truncate hidden lg:block">
                {runningTask}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-stone-300" />
            <span className="text-xs text-muted-foreground font-medium">Idle</span>
          </div>
        )}
      </div>
    </div>
  );
}
