"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { timeAgo } from "../../lib/utils";
import { History, ChevronDown } from "lucide-react";
import { useState } from "react";

const actionStyles: Record<string, { color: string; dot: string; label?: string }> = {
  command_received:    { color: "text-white",      dot: "bg-white",      label: "CMD"      },
  task_started:        { color: "text-blue-400",   dot: "bg-blue-400",   label: "START"    },
  agent_output:        { color: "text-gray-400",   dot: "bg-gray-600"                      },
  task_completed:      { color: "text-green-400",  dot: "bg-green-400",  label: "DONE"     },
  task_error:          { color: "text-red-400",    dot: "bg-red-400",    label: "ERR"      },
  delegated:           { color: "text-yellow-400", dot: "bg-yellow-400", label: "DELEGATE" },
  delegation_complete: { color: "text-yellow-300", dot: "bg-yellow-300", label: "SENT"     },
  findings_posted:     { color: "text-cyan-400",   dot: "bg-cyan-400",   label: "SHARED"   },
  synthesis_triggered: { color: "text-purple-400", dot: "bg-purple-400", label: "SYNTH"    },
  synthesis:           { color: "text-purple-300", dot: "bg-purple-300", label: "RESULT"   },
  approval_requested:  { color: "text-yellow-300", dot: "bg-yellow-300", label: "APPROVAL" },
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
          <div key={i} className="h-6 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
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
          <History className="w-4 h-4 text-gray-500" />
          <h1 className="text-sm font-semibold text-white">Activity</h1>
          <span className="text-[11px] text-gray-500 font-medium">{filtered.length} events</span>
        </div>

        {/* Agent filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-600">Filter:</span>
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="text-xs px-2 py-1 rounded-md text-gray-300 outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <option value="all">All agents</option>
            {agents.map((a) => (
              <option key={a._id} value={a._id}>{a.role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity stream */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="w-8 h-8 text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">No activity yet</p>
            <p className="text-xs text-gray-600 mt-1">Agent actions will stream here in real-time</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {filtered.map((activity) => {
              const agent = activity.agentId ? agentMap.get(activity.agentId) : null;
              const styles = actionStyles[activity.action] ?? { color: "text-gray-600", dot: "bg-gray-700" };
              const isOutput = activity.action === "agent_output";
              const isExpanded = expandedItems.has(activity._id);
              const isLong = activity.content.length > 200;

              return (
                <div
                  key={activity._id}
                  className={cn(
                    "px-4 py-2.5 hover:bg-white/[0.015] transition-colors",
                    isOutput && "cursor-pointer"
                  )}
                  onClick={() => isOutput && isLong && toggleExpand(activity._id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Dot */}
                    <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", styles.dot)} />

                    {/* Label */}
                    {styles.label && (
                      <span className="text-[10px] font-bold text-gray-600 shrink-0 w-16 text-right tabular-nums font-mono">
                        {styles.label}
                      </span>
                    )}

                    {/* Agent */}
                    {agent && (
                      <span className="text-[11px] font-bold shrink-0 text-gray-500 w-20 truncate">
                        {agent.role}
                      </span>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-xs break-words leading-relaxed",
                        isOutput ? "text-gray-500 font-mono" : styles.color
                      )}>
                        {isExpanded || !isLong
                          ? activity.content
                          : activity.content.substring(0, 200) + "…"
                        }
                      </span>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-gray-700 shrink-0 tabular-nums">
                      {timeAgo(activity._creationTime)}
                    </span>

                    {/* Expand indicator */}
                    {isOutput && isLong && (
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 text-gray-700 shrink-0 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    )}
                  </div>

                  {/* Expanded full content */}
                  {isExpanded && (
                    <div className="mt-2 ml-5 p-3 rounded-md bg-black/20 text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {activity.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
