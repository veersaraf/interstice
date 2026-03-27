"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, timeAgo } from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  MessageCircle,
  Bot,
  Send,
  Mic,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";

/* ─── Agent avatar + color config ─────────────────────────────── */
const agentConfig: Record<string, { avatar: string; color: string; bg: string; label: string }> = {
  CEO:            { avatar: "/avatars/ceo.png",            color: "text-amber-700",   bg: "bg-amber-50",   label: "CEO" },
  Research:       { avatar: "/avatars/research.png",       color: "text-blue-700",    bg: "bg-blue-50",    label: "Research" },
  Content:        { avatar: "/avatars/content.png",        color: "text-purple-700",  bg: "bg-purple-50",  label: "Content" },
  Outreach:       { avatar: "/avatars/outreach.png",       color: "text-orange-700",  bg: "bg-orange-50",  label: "Outreach" },
  Analytics:      { avatar: "/avatars/analytics.png",      color: "text-cyan-700",    bg: "bg-cyan-50",    label: "Analytics" },
};

/* ─── Parse CEO JSON into readable delegation ─────────────────── */
function tryParseDelegation(content: string): { agent: string; task: string }[] | null {
  try {
    // Match patterns like {"tasks":[{"agent":"research","input":"..."}]}
    const parsed = JSON.parse(content);
    if (parsed?.tasks && Array.isArray(parsed.tasks)) {
      return parsed.tasks.map((t: { agent?: string; input?: string }) => ({
        agent: t.agent ?? "Agent",
        task: t.input ?? "",
      }));
    }
  } catch {
    // Not JSON — check for stringified JSON prefix
    const match = content.match(/^\{.*"tasks"\s*:\s*\[/);
    if (match) {
      try {
        const parsed = JSON.parse(content);
        if (parsed?.tasks) {
          return parsed.tasks.map((t: { agent?: string; input?: string }) => ({
            agent: t.agent ?? "Agent",
            task: t.input ?? "",
          }));
        }
      } catch { /* not parseable */ }
    }
  }
  return null;
}

/* ─── Detect delegation text patterns ─────────────────────────── */
function tryParseDelegationText(content: string): { agent: string; task: string }[] | null {
  // Match "CEO delegated to Research: ..." pattern
  const match = content.match(/^CEO delegated to (\w+):\s*([\s\S]+)/);
  if (match) {
    return [{ agent: match[1], task: match[2] }];
  }
  return null;
}

/* ─── Friendly action labels (no jargon) ───────────────────────── */
function friendlyAction(action: string, agentRole?: string): string {
  const name = agentRole ?? "Agent";
  switch (action) {
    case "command_received": return "You said";
    case "task_started": return `${name} started working`;
    case "agent_output": return name;
    case "task_completed": return `${name} finished`;
    case "task_error": return `${name} hit an error`;
    case "delegated": return "CEO delegated";
    case "delegation_complete": return "Task sent";
    case "findings_posted": return `${name} shared results`;
    case "synthesis_triggered": return "CEO is reviewing";
    case "synthesis": return "CEO summarized";
    case "approval_requested": return `${name} needs your OK`;
    default: return name;
  }
}

/* ─── Delegation Card — renders JSON delegations nicely ───────── */
function DelegationCard({ delegations }: { delegations: { agent: string; task: string }[] }) {
  return (
    <div className="space-y-1.5">
      {delegations.map((d, i) => {
        const agentName = d.agent.charAt(0).toUpperCase() + d.agent.slice(1);
        const cfg = agentConfig[agentName];
        return (
          <div
            key={i}
            className="flex items-start gap-2 px-2.5 py-2 rounded-xl bg-white/60 border border-stone-100"
          >
            <ArrowRight className={cn("w-3 h-3 mt-0.5 shrink-0", cfg?.color ?? "text-stone-400")} />
            <div className="min-w-0">
              <span className={cn("text-[10px] font-bold", cfg?.color ?? "text-stone-600")}>
                {agentName}
              </span>
              <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5 line-clamp-2">
                {d.task}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
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
  const isError = activity.action === "task_error";
  const isApproval = activity.action === "approval_requested";
  const isFinding = activity.action === "findings_posted";
  const isDone = activity.action === "task_completed";
  const isSynthesis = activity.action === "synthesis" || activity.action === "synthesis_triggered";
  const isDelegation = activity.action === "delegated";

  const cfg = agent ? agentConfig[agent.role] : null;

  // Try to parse structured content
  const delegations = tryParseDelegation(activity.content) || tryParseDelegationText(activity.content);
  const isStructuredDelegation = delegations !== null;

  const contentToShow = activity.content;
  const isLong = contentToShow.length > 200 && !isStructuredDelegation;

  const displayContent = isExpanded
    ? contentToShow
    : isLong
      ? contentToShow.substring(0, 200) + "…"
      : contentToShow;

  // User commands show on right side
  if (isCommand) {
    return (
      <div className="flex justify-end mb-3 px-3">
        <div className="max-w-[85%]">
          <div className="px-3.5 py-2.5 rounded-2xl rounded-br-md bg-primary text-white text-xs leading-relaxed shadow-sm">
            <span className="flex items-center gap-1.5">
              <Mic className="w-3 h-3 opacity-60 shrink-0" />
              {activity.content}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground/50 text-right mt-0.5 pr-1">
            {timeAgo(activity._creationTime)}
          </div>
        </div>
      </div>
    );
  }

  // Status event — compact inline pill
  if (isDone) {
    return (
      <div className="flex items-center justify-center gap-1.5 my-2 px-3">
        <div className="h-px flex-1 bg-green-200/50" />
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200/60">
          <CheckCircle2 className="w-3 h-3 text-green-600" />
          <span className="text-[10px] text-green-700 font-medium">
            {agent?.role ?? "Agent"} completed task
          </span>
        </div>
        <div className="h-px flex-1 bg-green-200/50" />
      </div>
    );
  }

  // Approval request — inline card
  if (isApproval) {
    return (
      <div className="flex gap-2 mb-3 px-3">
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
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold text-amber-700">Needs your approval</span>
            <span className="text-[9px] text-muted-foreground/40 tabular-nums">
              {timeAgo(activity._creationTime)}
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md text-xs leading-relaxed shadow-sm border bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-amber-800">{activity.content}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Finding — compact notification
  if (isFinding) {
    return (
      <div className="flex items-center justify-center gap-1.5 my-2 px-3">
        <div className="h-px flex-1 bg-cyan-200/50" />
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200/60">
          <FileText className="w-3 h-3 text-cyan-600" />
          <span className="text-[10px] text-cyan-700 font-medium">
            {agent?.role ?? "Agent"} posted findings
          </span>
        </div>
        <div className="h-px flex-1 bg-cyan-200/50" />
      </div>
    );
  }

  // Synthesis — special CEO card
  if (isSynthesis && activity.action === "synthesis") {
    return (
      <div className="flex gap-2 mb-3 px-3">
        <div className="w-9 h-9 rounded-full shrink-0 mt-0.5 border overflow-hidden bg-amber-50 border-amber-200/80">
          <img src="/avatars/ceo.png" alt="CEO" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 max-w-[85%]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span className="text-[10px] font-bold text-amber-700">CEO Summary</span>
            <span className="text-[9px] text-muted-foreground/40 tabular-nums">
              {timeAgo(activity._creationTime)}
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md text-xs leading-relaxed shadow-sm border bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200/80 text-amber-900">
            <ChatMarkdown content={isExpanded ? contentToShow : isLong ? contentToShow.substring(0, 300) + "…" : contentToShow} />
            {contentToShow.length > 300 && (
              <button onClick={onToggle} className="block text-[10px] text-primary font-medium mt-1.5">
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default agent message
  return (
    <div className="flex gap-2 mb-3 px-3">
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
            isDelegation
              ? "bg-amber-50/50 border-amber-200/60 text-stone-700"
              : isError
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-stone-50 border-stone-200 text-stone-700",
            isLong && "cursor-pointer",
          )}
          onClick={() => isLong && onToggle()}
        >
          {isStructuredDelegation ? (
            <DelegationCard delegations={delegations!} />
          ) : (
            <>
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
            </>
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
  "synthesis_triggered",   // redundant when synthesis follows
]);

function isNoisyContent(content: string): boolean {
  if (content.length < 10 && /^(ok|done|starting|working)/i.test(content)) return true;
  return false;
}

/* ─── Dedup — collapse redundant delegation messages ──────────── */
function deduplicateActivities(
  activities: { _id: string; action: string; content: string; _creationTime: number; agentId?: string }[]
): typeof activities {
  const result: typeof activities = [];
  const seenDelegations = new Set<string>();

  for (const activity of activities) {
    // For agent_output from CEO that is just JSON delegation — skip if we already have a "delegated" entry
    if (activity.action === "agent_output") {
      const delegations = tryParseDelegation(activity.content);
      if (delegations) {
        const key = delegations.map(d => d.agent).sort().join(",");
        if (seenDelegations.has(key)) continue;
        seenDelegations.add(key);
      }
    }

    // For "delegated" entries, track the agents involved
    if (activity.action === "delegated") {
      const delegations = tryParseDelegationText(activity.content);
      if (delegations) {
        const key = delegations.map(d => d.agent.toLowerCase()).sort().join(",");
        seenDelegations.add(key);
      }
    }

    result.push(activity);
  }
  return result;
}

/* ─── Inline command input ────────────────────────────────────── */
function InlineChatInput() {
  const [command, setCommand] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim() }),
      });
      if (res.ok) setCommand("");
    } catch { /* silent */ } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-3 py-2.5 border-t border-stone-200/60 bg-white/50 shrink-0">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Tell your team what to do..."
            className={cn(
              "w-full h-9 px-3.5 pr-8 rounded-xl text-xs",
              "bg-stone-50/80 border border-stone-200/80 text-foreground",
              "placeholder:text-muted-foreground/40",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
              "transition-all"
            )}
            disabled={sending}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Mic className="w-3 h-3 text-muted-foreground/25" />
          </div>
        </div>
        <button
          type="submit"
          disabled={!command.trim() || sending}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
            command.trim() && !sending
              ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
              : "bg-stone-100 text-stone-300"
          )}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
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

  // Filter noise, dedup, and reverse for chat order (latest at bottom)
  const chatOrderActivities = useMemo(() => {
    if (!activities) return [];
    const filtered = [...activities]
      .filter((a) => !NOISY_ACTIONS.has(a.action) && !isNoisyContent(a.content));
    const deduped = deduplicateActivities(filtered);
    return deduped.reverse();
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
        {chatOrderActivities.length > 0 && (
          <span className="ml-auto text-[9px] text-muted-foreground/50 tabular-nums">
            {chatOrderActivities.length} messages
          </span>
        )}
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
              const agent = activity.agentId ? agentMap.get(activity.agentId as any) : null;
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

      {/* Inline command input */}
      <InlineChatInput />
    </div>
  );
}
