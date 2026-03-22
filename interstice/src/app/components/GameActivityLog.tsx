"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, timeAgo } from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  MessageCircle,
  Bot,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";

/* ─── Agent avatar + color config ─────────────────────────────── */
const agentConfig: Record<string, { avatar: string; color: string; bg: string }> = {
  CEO:            { avatar: "/avatars/ceo.png",            color: "text-amber-700",   bg: "bg-amber-50" },
  Research:       { avatar: "/avatars/research.png",       color: "text-blue-700",    bg: "bg-blue-50" },
  Communications: { avatar: "/avatars/communications.png", color: "text-purple-700",  bg: "bg-purple-50" },
  Developer:      { avatar: "/avatars/developer.png",      color: "text-emerald-700", bg: "bg-emerald-50" },
  Call:           { avatar: "/avatars/call.png",           color: "text-orange-700",  bg: "bg-orange-50" },
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
        "w-9 h-9 rounded-full shrink-0 mt-0.5 border overflow-hidden",
        cfg?.bg ?? "bg-stone-50",
        "border-stone-200/80"
      )}>
        {cfg?.avatar ? (
          <img src={cfg.avatar} alt={agent?.role ?? "Agent"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Bot className="w-4 h-4 text-muted-foreground" /></div>
        )}
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
            "px-3.5 py-2.5 rounded-2xl rounded-tl-md text-xs leading-relaxed shadow-sm border",
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
                        ? "bg-stone-50 border-stone-200 text-stone-700"
                        : "bg-white border-stone-200 text-foreground",
            isLong && "cursor-pointer",
          )}
          onClick={() => isLong && onToggle()}
        >
          <ChatMarkdown content={displayContent} />
          {isLong && !isExpanded && (
            <button className="block text-[10px] text-primary font-medium mt-1.5">
              Show more
            </button>
          )}
          {isLong && isExpanded && (
            <button className="block text-[10px] text-primary font-medium mt-1.5">
              Show less
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── ChatMarkdown — clean, compact markdown for chat bubbles ──── */
function ChatMarkdown({ content }: { content: string }) {
  // Quick check: if no markdown signals, just render as plain text
  const hasMarkdown = /[#*_`\[\]|>]/.test(content);
  if (!hasMarkdown) {
    return <span className="whitespace-pre-wrap break-words">{content}</span>;
  }

  return (
    <div className="chat-markdown break-words">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <p className="font-bold text-[13px] mb-1.5 mt-1 first:mt-0">{children}</p>,
          h2: ({ children }) => <p className="font-semibold text-xs mb-1 mt-1">{children}</p>,
          h3: ({ children }) => <p className="font-semibold text-xs mb-0.5 mt-1">{children}</p>,
          p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-3.5 mb-1.5 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-3.5 mb-1.5 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ className, children }) => {
            const isBlock = className?.includes("language-");
            return isBlock ? (
              <pre className="bg-white/60 rounded-lg p-2 my-1.5 overflow-x-auto border border-stone-200/50">
                <code className="text-[10px] font-mono">{children}</code>
              </pre>
            ) : (
              <code className="text-[10.5px] font-mono bg-white/60 px-1 py-0.5 rounded border border-stone-200/30">{children}</code>
            );
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-stone-300 pl-2.5 my-1.5 italic opacity-80">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-1.5 rounded-lg border border-stone-200/50">
              <table className="w-full text-[10px]">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="text-left font-semibold px-2 py-1 bg-stone-100/50 border-b border-stone-200/50">{children}</th>,
          td: ({ children }) => <td className="px-2 py-1 border-b border-stone-100">{children}</td>,
          hr: () => <hr className="my-2 border-stone-200/40" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ─── Noise filter — hide low-value internal chatter ─────────── */
const NOISY_ACTIONS = new Set([
  "delegation_complete",   // duplicate of "delegated"
  "task_started",          // obvious from context
]);

function isNoisyContent(content: string): boolean {
  // Filter out very short internal-sounding messages
  if (content.length < 10 && /^(ok|done|starting|working)/i.test(content)) return true;
  return false;
}

/* ─── Main Activity Log ────────────────────────────────────────── */
export function GameActivityLog() {
  const activities = useQuery(api.activity.list, { limit: 50 });
  const agents = useQuery(api.agents.list);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Auto-scroll to bottom (chat-style: latest at bottom)
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activities?.length]);

  const agentMap = useMemo(
    () => new Map((agents ?? []).map((a) => [a._id, a])),
    [agents],
  );

  // Filter noise and reverse for chat order (latest at bottom)
  const chatOrderActivities = useMemo(() => {
    if (!activities) return [];
    return [...activities]
      .filter((a) => !NOISY_ACTIONS.has(a.action) && !isNoisyContent(a.content))
      .reverse();
  }, [activities]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (!activities || !agents) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-stone-200/60 flex items-center gap-1.5 shrink-0 bg-stone-50/50">
        <MessageCircle className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-foreground">Chat</span>
      </div>

      {/* Chat Stream */}
      <ScrollArea className="flex-1">
        <div className="py-3">
          {chatOrderActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground/40 mb-3" />
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
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
