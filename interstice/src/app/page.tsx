"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Activity } from "lucide-react";
import { cn } from "../lib/utils";
import { CommandInput } from "./components/CommandInput";
import { AgentStatusBar } from "./components/AgentStatusBar";
import { ResearchPanel, ContentPanel, OutreachPanel, AnalyticsPanel } from "./components/OutputPanels";
import { ActivitySidebar } from "./components/ActivitySidebar";
import { ApprovalToast } from "./components/ApprovalToast";

export default function Dashboard() {
  const [activityOpen, setActivityOpen] = useState(false);
  const activities = useQuery(api.activity.list, { limit: 5 });
  const hasActivity = (activities?.length ?? 0) > 0;

  return (
    <div className="h-full flex flex-col gap-4 max-w-[1400px] mx-auto">
      {/* 1. Command Input — big, prominent, top of page */}
      <div className="shrink-0">
        <CommandInput />
      </div>

      {/* 2. Agent Status Bar + Activity toggle */}
      <div className="shrink-0 flex items-center gap-3">
        <div className="flex-1">
          <AgentStatusBar />
        </div>
        <button
          onClick={() => setActivityOpen(!activityOpen)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
            activityOpen
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-white border-stone-200 text-stone-500 hover:text-stone-700 hover:border-stone-300"
          )}
        >
          <Activity className="w-3.5 h-3.5" />
          Activity
          {hasActivity && !activityOpen && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
          )}
        </button>
      </div>

      {/* 3. Output Panels — 80% of screen, scrollable */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
          <ResearchPanel />
          <ContentPanel />
          <OutreachPanel />
          <AnalyticsPanel />
        </div>
      </div>

      {/* 4. Activity Feed — collapsible right sidebar */}
      <ActivitySidebar isOpen={activityOpen} onClose={() => setActivityOpen(false)} />

      {/* 5. Approval Queue — toast/modal at bottom-right */}
      <ApprovalToast />
    </div>
  );
}
