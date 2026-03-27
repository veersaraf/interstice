"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, timeAgo } from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import { useMemo, useRef, useEffect } from "react";
import {
  Activity,
  Bot,
  ChevronRight,
  Mic,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
} from "lucide-react";

const agentConfig: Record<string, { color: string; avatar: string; label: string }> = {
  CEO:            { color: "text-amber-700",  avatar: "/avatars/ceo.png",            label: "CEO" },
  Research:       { color: "text-blue-700",   avatar: "/avatars/research.png",       label: "Research" },
  Content:        { color: "text-purple-700", avatar: "/avatars/content.png",        label: "Content" },
  Outreach:       { color: "text-orange-700", avatar: "/avatars/outreach.png",       label: "Outreach" },
  Analytics:      { color: "text-cyan-700",   avatar: "/avatars/analytics.png",      label: "Analytics" },
};

const NOISY_ACTIONS = new Set(["delegation_complete", "task_started", "synthesis_triggered"]);

function friendlyAction(action: string, agentRole?: string): string {
  const name = agentRole ?? "Agent";
  switch (action) {
    case "command_received": return "You";
    case "agent_output": return name;
    case "task_completed": return `${name} done`;
    case "task_error": return `${name} error`;
    case "delegated": return "CEO delegated";
    case "findings_posted": return `${name} posted`;
    case "synthesis": return "CEO summary";
    case "approval_requested": return `${name} needs OK`;
    default: return name;
  }
}

interface ActivitySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivitySidebar({ isOpen, onClose }: ActivitySidebarProps) {
  const activities = useQuery(api.activity.list, { limit: 40 });
  const agents = useQuery(api.agents.list);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current && isOpen) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activities?.length, isOpen]);

  const agentMap = useMemo(
    () => new Map((agents ?? []).map((a) => [a._id, a])),
    [agents]
  );

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    return [...activities]
      .filter((a) => !NOISY_ACTIONS.has(a.action) && a.content.length >= 10)
      .reverse();
  }, [activities]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full bg-card border-l border-stone-200/80 z-50 flex flex-col transition-transform duration-200 ease-out",
          "w-80 lg:w-96",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-stone-200/60 flex items-center gap-2 shrink-0">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Activity</span>
          {filteredActivities.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-stone-100 px-1.5 py-0.5 rounded-full tabular-nums ml-auto mr-2">
              {filteredActivities.length}
            </span>
          )}
          <button onClick={onClose} className="p-1 rounded-md hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Stream */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <Activity className="w-8 h-8 text-stone-200 mb-3" />
                <p className="text-xs text-stone-400">No activity yet</p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const agent = activity.agentId ? agentMap.get(activity.agentId) : null;
                const cfg = agent ? agentConfig[agent.role] : null;
                const isCommand = activity.action === "command_received";
                const isDone = activity.action === "task_completed";
                const isApproval = activity.action === "approval_requested";
                const isFinding = activity.action === "findings_posted";
                const isSynthesis = activity.action === "synthesis";

                // Status pill events
                if (isDone) {
                  return (
                    <div key={activity._id} className="flex items-center gap-1.5 px-4 py-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-700">{agent?.role ?? "Agent"} completed</span>
                      <span className="text-[9px] text-stone-300 ml-auto tabular-nums">{timeAgo(activity._creationTime)}</span>
                    </div>
                  );
                }

                if (isFinding) {
                  return (
                    <div key={activity._id} className="flex items-center gap-1.5 px-4 py-1">
                      <FileText className="w-3 h-3 text-cyan-500" />
                      <span className="text-[10px] text-cyan-700">{agent?.role ?? "Agent"} posted findings</span>
                      <span className="text-[9px] text-stone-300 ml-auto tabular-nums">{timeAgo(activity._creationTime)}</span>
                    </div>
                  );
                }

                // Regular activity row
                return (
                  <div
                    key={activity._id}
                    className={cn(
                      "flex gap-2.5 px-4 py-2 hover:bg-stone-50/50 transition-colors",
                      isCommand && "bg-primary/[0.03]"
                    )}
                  >
                    {/* Avatar */}
                    {isCommand ? (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Mic className="w-3 h-3 text-primary" />
                      </div>
                    ) : cfg?.avatar ? (
                      <img src={cfg.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-stone-400" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-[10px] font-semibold", isCommand ? "text-primary" : cfg?.color ?? "text-stone-600")}>
                          {friendlyAction(activity.action, agent?.role)}
                        </span>
                        <span className="text-[9px] text-stone-300 tabular-nums">{timeAgo(activity._creationTime)}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2 mt-0.5">
                        {activity.content.substring(0, 200)}
                      </p>
                    </div>

                    {/* Markers */}
                    {isApproval && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-1" />}
                    {isSynthesis && <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-1" />}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
