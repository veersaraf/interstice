"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, timeAgo } from "../../lib/utils";
import { History, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card } from "../../components/ui/card";

const actionStyles: Record<string, { color: string; dot: string; label?: string }> = {
  command_received:    { color: "text-foreground",       dot: "bg-foreground",      label: "CMD"      },
  task_started:        { color: "text-blue-700",         dot: "bg-blue-600",        label: "START"    },
  agent_output:        { color: "text-muted-foreground", dot: "bg-muted-foreground"                   },
  task_completed:      { color: "text-emerald-700",      dot: "bg-emerald-600",     label: "DONE"     },
  task_error:          { color: "text-red-600",          dot: "bg-red-600",         label: "ERR"      },
  delegated:           { color: "text-amber-700",        dot: "bg-amber-600",       label: "DELEGATE" },
  delegation_complete: { color: "text-amber-700",        dot: "bg-amber-600",       label: "SENT"     },
  findings_posted:     { color: "text-cyan-600",         dot: "bg-cyan-600",        label: "SHARED"   },
  synthesis_triggered: { color: "text-purple-700",       dot: "bg-purple-600",      label: "SYNTH"    },
  synthesis:           { color: "text-purple-700",       dot: "bg-purple-600",      label: "RESULT"   },
  approval_requested:  { color: "text-yellow-600",       dot: "bg-yellow-600",      label: "APPROVAL" },
};

export function ActivityPage() {
  const activities = useQuery(api.activity.list, { limit: 200 });
  const agents = useQuery(api.agents.list);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterAgent, setFilterAgent] = useState<string>("all");

  if (!activities || !agents) {
    return (
      <div className="max-w-[1100px] space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-6 rounded animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));
  const filtered = filterAgent === "all"
    ? activities
    : activities.filter((a) => a.agentId === filterAgent);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-[1100px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Activity</h1>
          <span className="text-[11px] text-muted-foreground font-medium">{filtered.length} events</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Filter:</span>
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="text-xs px-2 py-1 rounded-md text-foreground bg-card border border-border outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All agents</option>
            {agents.map((a) => (
              <option key={a._id} value={a._id}>{a.role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity stream */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Agent actions will stream here in real-time</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((activity) => {
              const agent = activity.agentId ? agentMap.get(activity.agentId) : null;
              const styles = actionStyles[activity.action] ?? { color: "text-muted-foreground/50", dot: "bg-muted-foreground/30" };
              const isOutput = activity.action === "agent_output";
              const isExpanded = expandedItems.has(activity._id);
              const isLong = activity.content.length > 200;

              return (
                <div
                  key={activity._id}
                  className={cn(
                    "px-4 py-2.5 hover:bg-accent/20 transition-colors",
                    isOutput && "cursor-pointer"
                  )}
                  onClick={() => isOutput && isLong && toggleExpand(activity._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", styles.dot)} />

                    {styles.label && (
                      <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0 w-16 text-right tabular-nums font-mono">
                        {styles.label}
                      </span>
                    )}

                    {agent && (
                      <span className="text-[11px] font-bold shrink-0 text-muted-foreground w-20 truncate">
                        {agent.role}
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-xs break-words leading-relaxed",
                        isOutput ? "text-muted-foreground font-mono" : styles.color
                      )}>
                        {isExpanded || !isLong
                          ? activity.content
                          : activity.content.substring(0, 200) + "..."
                        }
                      </span>
                    </div>

                    <span className="text-[10px] text-muted-foreground/40 shrink-0 tabular-nums">
                      {timeAgo(activity._creationTime)}
                    </span>

                    {isOutput && isLong && (
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 text-muted-foreground/40 shrink-0 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-2 ml-5 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border border-border/50">
                      {activity.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
