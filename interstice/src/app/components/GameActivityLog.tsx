"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, timeAgo } from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Copy,
  Check,
  FileText,
  BarChart3,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

/* ─── Agent emoji + color config ───────────────────────────────── */
const agentConfig: Record<string, { emoji: string; color: string; bg: string }> = {
  CEO:            { emoji: "🧑‍💼", color: "text-amber-700",   bg: "bg-amber-50" },
  Research:       { emoji: "🔬", color: "text-blue-700",    bg: "bg-blue-50" },
  Communications: { emoji: "✉️", color: "text-purple-700",  bg: "bg-purple-50" },
  Developer:      { emoji: "⌨️", color: "text-emerald-700", bg: "bg-emerald-50" },
  Call:           { emoji: "📱", color: "text-orange-700",  bg: "bg-orange-50" },
};

/* ─── Friendly action labels (no jargon) ───────────────────────── */
function friendlyAction(action: string, agentRole?: string): string {
  const name = agentRole ?? "Agent";
  switch (action) {
    case "command_received": return "You said";
    case "task_started": return `${name} started working`;
    case "agent_output": return `${name}`;
    case "task_completed": return `${name} finished`;
    case "task_error": return `${name} hit an error`;
    case "delegated": return `CEO assigned work`;
    case "delegation_complete": return `Task sent`;
    case "findings_posted": return `${name} shared results`;
    case "synthesis_triggered": return `CEO is reviewing`;
    case "synthesis": return `CEO summarized`;
    case "approval_requested": return `${name} needs your OK`;
    default: return name;
  }
}

/* ─── Chat bubble component ────────────────────────────────────── */
function ChatBubble({
  activity,
  agent,
  isExpanded,
  onToggle,
}: {
  activity: { _id: string; action: string; content: string; _creationTime: number };
  agent: { role: string } | null;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isCommand = activity.action === "command_received";
  const isOutput = activity.action === "agent_output";
  const isError = activity.action === "task_error";
  const isApproval = activity.action === "approval_requested";
  const isFinding = activity.action === "findings_posted";
  const isDone = activity.action === "task_completed";
  const isSynthesis = activity.action === "synthesis" || activity.action === "synthesis_triggered";

  const cfg = agent ? agentConfig[agent.role] : null;
  const isLong = activity.content.length > 200;

  // User commands show on right side (like iMessage sent)
  if (isCommand) {
    return (
      <div className="flex justify-end mb-2 px-3">
        <div className="max-w-[85%]">
          <div className="px-3.5 py-2.5 rounded-2xl rounded-br-md bg-primary text-white text-xs leading-relaxed shadow-sm">
            {activity.content}
          </div>
          <div className="text-[9px] text-muted-foreground/50 text-right mt-0.5 pr-1">
            {timeAgo(activity._creationTime)}
          </div>
        </div>
      </div>
    );
  }

  // Agent messages show on left (like iMessage received)
  const displayContent = isExpanded
    ? activity.content
    : isLong
      ? activity.content.substring(0, 200) + "…"
      : activity.content;

  return (
    <div className="flex gap-2 mb-2 px-3">
      {/* Agent avatar */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5 border",
        cfg?.bg ?? "bg-stone-50",
        "border-stone-200/80"
      )}>
        {cfg?.emoji ?? "🤖"}
      </div>

      <div className="flex-1 min-w-0 max-w-[85%]">
        {/* Agent name + action */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn("text-[10px] font-bold", cfg?.color ?? "text-stone-600")}>
            {friendlyAction(activity.action, agent?.role)}
          </span>
          <span className="text-[9px] text-muted-foreground/40 tabular-nums">
            {timeAgo(activity._creationTime)}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl rounded-tl-md text-xs leading-relaxed shadow-sm border",
            isError
              ? "bg-red-50 border-red-200 text-red-700"
              : isApproval
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : isDone
                  ? "bg-green-50 border-green-200 text-green-800"
                  : isFinding
                    ? "bg-cyan-50 border-cyan-200 text-cyan-800"
                    : isSynthesis
                      ? "bg-purple-50 border-purple-200 text-purple-800"
                      : isOutput
                        ? "bg-stone-50 border-stone-200 text-stone-600"
                        : "bg-white border-stone-200 text-foreground",
            isLong && "cursor-pointer",
          )}
          onClick={() => isLong && onToggle()}
        >
          <span className="whitespace-pre-wrap break-words">{displayContent}</span>
          {isLong && !isExpanded && (
            <button className="block text-[10px] text-primary font-medium mt-1">
              Show more
            </button>
          )}
          {isLong && isExpanded && (
            <button className="block text-[10px] text-primary font-medium mt-1">
              Show less
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Activity Log ────────────────────────────────────────── */
export function GameActivityLog() {
  const activities = useQuery(api.activity.list, { limit: 50 });
  const agents = useQuery(api.agents.list);
  const findings = useQuery(api.findings.getRecent, { limit: 5 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"activity" | "output">("activity");

  // Auto-scroll to bottom (chat-style: latest at bottom)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities?.length]);

  if (!activities || !agents) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyContent = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* no-op */ }
  };

  // Reverse activities so latest is at the bottom (chat order)
  const chatOrderActivities = [...activities].reverse();

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
      {/* Tab header */}
      <div className="px-3 py-2 border-b border-stone-200/60 flex items-center gap-1 shrink-0 bg-stone-50/50">
        <button
          onClick={() => setTab("activity")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5",
            tab === "activity"
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-stone-100"
          )}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setTab("output")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5",
            tab === "output"
              ? "bg-cyan-50 text-cyan-700 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-stone-100"
          )}
        >
          📄 Output
          {findings && findings.length > 0 && (
            <span className="text-[9px] bg-cyan-100 text-cyan-700 px-1.5 rounded-full font-bold">
              {findings.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {tab === "activity" ? (
          /* ─── Chat-style Activity Stream ─── */
          <div ref={scrollRef} className="py-3">
            {chatOrderActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <span className="text-3xl mb-3">💬</span>
                <p className="text-xs text-muted-foreground font-medium">No activity yet</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  Tell your team what to do and watch them work
                </p>
              </div>
            ) : (
              chatOrderActivities.map((activity) => {
                const agent = activity.agentId ? agentMap.get(activity.agentId) : null;
                return (
                  <ChatBubble
                    key={activity._id}
                    activity={activity}
                    agent={agent ?? null}
                    isExpanded={expandedItems.has(activity._id)}
                    onToggle={() => toggleExpand(activity._id)}
                  />
                );
              })
            )}
          </div>
        ) : (
          /* ─── Output / Findings ─── */
          <div>
            {!findings || findings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <span className="text-3xl mb-3">📄</span>
                <p className="text-xs text-muted-foreground font-medium">No results yet</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  Agent reports and deliverables appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {findings.map((finding) => {
                  const agent = agentMap.get(finding.agentId);
                  const isExpanded = expandedItems.has(finding._id);
                  const isLong = finding.content.length > 300;
                  const isCopied = copiedId === finding._id;
                  const cfg = agent ? agentConfig[agent.role] : null;

                  return (
                    <div key={finding._id} className="px-3 py-3">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs border",
                            cfg?.bg ?? "bg-stone-50",
                            "border-stone-200/80"
                          )}>
                            {cfg?.emoji ?? "🤖"}
                          </div>
                          <span className={cn("text-xs font-bold", cfg?.color ?? "text-stone-600")}>
                            {agent?.role ?? "Agent"}
                          </span>
                          {finding.summary && (
                            <span className="text-[10px] text-muted-foreground">— {finding.summary}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-muted-foreground/50 tabular-nums">{timeAgo(finding._creationTime)}</span>
                          <button
                            onClick={() => copyContent(finding.content, finding._id)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-stone-100 transition-colors"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className={cn(
                        "text-xs text-foreground/70 whitespace-pre-wrap leading-relaxed rounded-xl p-3 bg-stone-50 border border-stone-100",
                        !isExpanded && isLong && "max-h-28 overflow-hidden relative cursor-pointer"
                      )}
                        onClick={() => isLong && !isExpanded && toggleExpand(finding._id)}
                      >
                        {isExpanded ? finding.content : (isLong ? finding.content.substring(0, 300) : finding.content)}
                        {!isExpanded && isLong && (
                          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-stone-50 to-transparent rounded-b-xl" />
                        )}
                      </div>

                      {isExpanded && (
                        <button onClick={() => toggleExpand(finding._id)} className="text-[10px] text-primary hover:text-primary/80 mt-1.5 font-medium">
                          Show less
                        </button>
                      )}
                      {!isExpanded && isLong && (
                        <button onClick={() => toggleExpand(finding._id)} className="text-[10px] text-primary hover:text-primary/80 mt-1.5 font-medium">
                          Show full output
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
