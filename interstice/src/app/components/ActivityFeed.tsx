"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";

const actionStyles: Record<string, { color: string; dot: string; label?: string }> = {
  command_received:    { color: "text-foreground",    dot: "bg-foreground",    label: "CMD"      },
  task_started:        { color: "text-blue-700",      dot: "bg-blue-600",      label: "START"    },
  agent_output:        { color: "text-muted-foreground", dot: "bg-muted-foreground"               },
  task_completed:      { color: "text-green-700",     dot: "bg-green-600",     label: "DONE"     },
  task_error:          { color: "text-red-700",       dot: "bg-red-600",       label: "ERR"      },
  delegated:           { color: "text-amber-700",     dot: "bg-amber-600",     label: "DELEGATE" },
  delegation_complete: { color: "text-amber-600",     dot: "bg-amber-500",     label: "SENT"     },
  findings_posted:     { color: "text-cyan-700",      dot: "bg-cyan-600",      label: "SHARED"   },
  synthesis_triggered: { color: "text-purple-700",    dot: "bg-purple-600",    label: "SYNTH"    },
  synthesis:           { color: "text-purple-600",    dot: "bg-purple-500",    label: "RESULT"   },
  approval_requested:  { color: "text-amber-600",     dot: "bg-amber-500",     label: "APPROVAL" },
};

export function ActivityFeed() {
  const activities = useQuery(api.activity.list, { limit: 60 });
  const agents     = useQuery(api.agents.list);

  if (!activities || !agents) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-5 rounded animate-pulse" style={{ background: "var(--surface-3)" }} />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  return (
    <div className="h-64 overflow-y-auto p-3">
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-sm text-gray-600">Waiting for commands…</p>
          <p className="text-xs text-gray-700 mt-1">Agents will stream output here in real-time</p>
        </div>
      ) : (
        <div className="space-y-0.5 font-mono text-[11px]">
          {activities.map((activity) => {
            const agent  = activity.agentId ? agentMap.get(activity.agentId) : null;
            const styles = actionStyles[activity.action] ?? { color: "text-gray-600", dot: "bg-gray-700" };
            const isOutput = activity.action === "agent_output";
            const content  = isOutput
              ? activity.content.substring(0, 180) + (activity.content.length > 180 ? "…" : "")
              : activity.content;

            return (
              <div
                key={activity._id}
                className={cn("flex items-start gap-2 py-0.5 leading-relaxed group", styles.color)}
              >
                {/* Dot */}
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", styles.dot)} />

                {/* Label badge */}
                {styles.label && (
                  <span className="text-[9px] font-bold opacity-50 shrink-0 w-14 text-right tabular-nums">
                    {styles.label}
                  </span>
                )}

                {/* Agent tag */}
                {agent && (
                  <span className="font-bold shrink-0 text-[10px] opacity-60">
                    [{agent.role}]
                  </span>
                )}

                {/* Content */}
                <span className={cn("break-words min-w-0", isOutput && "opacity-50")}>
                  {content}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
