"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, timeAgo } from "../../lib/utils";
import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  Search,
  FileText,
  Mail,
  Users,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Globe,
  MessageSquare,
  Phone,
  TrendingUp,
  Target,
  Sparkles,
} from "lucide-react";

/* ─── Shared ──────────────────────────────────────────────────── */

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-stone-300" />
      </div>
      <p className="text-xs font-medium text-stone-400">{title}</p>
      <p className="text-[10px] text-stone-300 mt-0.5">{subtitle}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count?: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-medium text-muted-foreground bg-stone-100 px-1.5 py-0.5 rounded-full tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

function OutputMarkdown({ content }: { content: string }) {
  const hasMarkdown = /[#*_`\[\]|>]/.test(content);
  if (!hasMarkdown) {
    return <span className="whitespace-pre-wrap break-words text-xs leading-relaxed text-stone-700">{content}</span>;
  }
  return (
    <div className="prose-sm break-words text-xs leading-relaxed text-stone-700">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <p className="font-bold text-sm mb-2 mt-3 first:mt-0 text-foreground">{children}</p>,
          h2: ({ children }) => <p className="font-semibold text-xs mb-1.5 mt-2 text-foreground">{children}</p>,
          h3: ({ children }) => <p className="font-semibold text-xs mb-1 mt-1.5 text-foreground">{children}</p>,
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          code: ({ className, children }) => {
            const isBlock = className?.includes("language-");
            return isBlock ? (
              <pre className="bg-stone-50 rounded-lg p-3 my-2 overflow-x-auto border border-stone-200/50">
                <code className="text-[10px] font-mono">{children}</code>
              </pre>
            ) : (
              <code className="text-[10.5px] font-mono bg-stone-50 px-1 py-0.5 rounded border border-stone-200/30">{children}</code>
            );
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{children}</a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-lg border border-stone-200/60">
              <table className="w-full text-[11px]">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="text-left font-semibold px-2.5 py-1.5 bg-stone-50 border-b border-stone-200/50 text-foreground">{children}</th>,
          td: ({ children }) => <td className="px-2.5 py-1.5 border-b border-stone-100">{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/30 pl-3 my-2 italic text-stone-500">{children}</blockquote>
          ),
          hr: () => <hr className="my-3 border-stone-200/40" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ─── Research Panel ──────────────────────────────────────────── */

export function ResearchPanel() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const findings = useQuery(api.findings.getRecent, { limit: 20 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const agentMap = useMemo(() => new Map((agents ?? []).map((a) => [a._id, a])), [agents]);

  // Research outputs: tasks from Research agent that are done, or findings
  const researchOutputs = useMemo(() => {
    if (!tasks || !agents) return [];
    const researchAgent = agents.find((a) => a.role === "Research");
    if (!researchAgent) return [];
    return tasks
      .filter((t) => t.agentId === researchAgent._id && t.status === "done" && t.output)
      .sort((a, b) => (b.completedAt ?? b._creationTime) - (a.completedAt ?? a._creationTime));
  }, [tasks, agents]);

  if (!tasks || !agents) {
    return <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-stone-50 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div>
      <SectionHeader icon={Search} label="Research" count={researchOutputs.length} color="bg-blue-600" />

      {researchOutputs.length === 0 ? (
        <EmptyState icon={Search} title="No research yet" subtitle="Research agent outputs will appear here" />
      ) : (
        <div className="space-y-2">
          {researchOutputs.map((task) => {
            const isExpanded = expandedId === task._id;
            const output = task.output ?? "";
            const preview = output.length > 300 ? output.substring(0, 300) + "..." : output;

            return (
              <div key={task._id} className="bg-white rounded-xl border border-stone-200/80 overflow-hidden transition-all hover:border-blue-200/60">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : task._id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-1">{task.input}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {task.completedAt ? timeAgo(task.completedAt) : timeAgo(task._creationTime)}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                  )}
                </button>

                {/* Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-stone-100">
                    <div className="flex items-center justify-end gap-1 py-2">
                      <CopyButton text={output} />
                    </div>
                    <OutputMarkdown content={output} />
                  </div>
                )}

                {/* Preview when collapsed */}
                {!isExpanded && output.length > 0 && (
                  <div className="px-4 pb-3">
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">{preview}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Content Panel ───────────────────────────────────────────── */

const contentTypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  tiktok: { label: "TikTok", icon: Sparkles, color: "text-pink-600" },
  tweet: { label: "X Post", icon: MessageSquare, color: "text-sky-600" },
  linkedin: { label: "LinkedIn", icon: Globe, color: "text-blue-700" },
  email: { label: "Email", icon: Mail, color: "text-purple-600" },
  landing_page: { label: "Landing Page", icon: ExternalLink, color: "text-emerald-600" },
};

export function ContentPanel() {
  const contentOutputs = useQuery(api.content_outputs.list);
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Also include Communications agent tasks with output as content
  const commsOutputs = useMemo(() => {
    if (!tasks || !agents) return [];
    const commsAgent = agents.find((a) => a.role === "Communications");
    if (!commsAgent) return [];
    return tasks
      .filter((t) => t.agentId === commsAgent._id && t.status === "done" && t.output)
      .sort((a, b) => (b.completedAt ?? b._creationTime) - (a.completedAt ?? a._creationTime));
  }, [tasks, agents]);

  // Also dev agent tasks (landing pages, code)
  const devOutputs = useMemo(() => {
    if (!tasks || !agents) return [];
    const devAgent = agents.find((a) => a.role === "Developer");
    if (!devAgent) return [];
    return tasks
      .filter((t) => t.agentId === devAgent._id && t.status === "done" && t.output)
      .sort((a, b) => (b.completedAt ?? b._creationTime) - (a.completedAt ?? a._creationTime));
  }, [tasks, agents]);

  const allOutputs = useMemo(() => [...commsOutputs, ...devOutputs], [commsOutputs, devOutputs]);

  if (!tasks || !agents) {
    return <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-stone-50 rounded-xl animate-pulse" />)}</div>;
  }

  const totalCount = (contentOutputs?.length ?? 0) + allOutputs.length;

  return (
    <div>
      <SectionHeader icon={FileText} label="Content" count={totalCount} color="bg-purple-600" />

      {totalCount === 0 ? (
        <EmptyState icon={FileText} title="No content yet" subtitle="Generated content will appear here" />
      ) : (
        <div className="space-y-2">
          {/* Structured content_outputs */}
          {contentOutputs?.map((co) => {
            const cfg = contentTypeLabels[co.type];
            const Icon = cfg?.icon ?? FileText;
            const isExpanded = expandedId === co._id;
            const contentStr = typeof co.content === "string" ? co.content : JSON.stringify(co.content, null, 2);

            return (
              <div key={co._id} className="bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:border-purple-200/60 transition-all">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : co._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <Icon className={cn("w-4 h-4 shrink-0", cfg?.color ?? "text-stone-500")} />
                  <span className="text-xs font-medium text-foreground flex-1">{cfg?.label ?? co.type}</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                    co.status === "draft" ? "bg-stone-100 text-stone-500"
                      : co.status === "approved" ? "bg-green-50 text-green-700"
                        : "bg-blue-50 text-blue-700"
                  )}>
                    {co.status}
                  </span>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-stone-400" /> : <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-stone-100">
                    <div className="flex items-center justify-end gap-1 py-2">
                      <CopyButton text={contentStr} />
                    </div>
                    <OutputMarkdown content={contentStr} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Task-based content outputs */}
          {allOutputs.map((task) => {
            const isExpanded = expandedId === task._id;
            const output = task.output ?? "";
            const isHtml = output.trim().startsWith("<!") || output.trim().startsWith("<html");

            return (
              <div key={task._id} className="bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:border-purple-200/60 transition-all">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : task._id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left"
                >
                  <Mail className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-1">{task.input}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {task.completedAt ? timeAgo(task.completedAt) : timeAgo(task._creationTime)}
                    </p>
                  </div>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-stone-400" /> : <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-stone-100">
                    <div className="flex items-center justify-end gap-1 py-2">
                      <CopyButton text={output} />
                      {isHtml && (
                        <button
                          onClick={() => {
                            const blob = new Blob([output], { type: "text/html" });
                            const url = URL.createObjectURL(blob);
                            window.open(url, "_blank");
                          }}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {isHtml ? (
                      <iframe
                        srcDoc={output}
                        className="w-full h-64 rounded-lg border border-stone-200/50 bg-white"
                        sandbox="allow-scripts"
                      />
                    ) : (
                      <OutputMarkdown content={output} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Outreach Panel ──────────────────────────────────────────── */

const statusColors: Record<string, string> = {
  new: "bg-stone-100 text-stone-600",
  contacted: "bg-blue-50 text-blue-700",
  responded: "bg-amber-50 text-amber-700",
  converted: "bg-green-50 text-green-700",
  lost: "bg-red-50 text-red-700",
};

export function OutreachPanel() {
  const leads = useQuery(api.leads.list);
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);

  // Call agent tasks
  const callOutputs = useMemo(() => {
    if (!tasks || !agents) return [];
    const callAgent = agents.find((a) => a.role === "Call");
    if (!callAgent) return [];
    return tasks
      .filter((t) => t.agentId === callAgent._id && t.status === "done" && t.output)
      .sort((a, b) => (b.completedAt ?? b._creationTime) - (a.completedAt ?? a._creationTime));
  }, [tasks, agents]);

  if (!leads || !tasks || !agents) {
    return <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-stone-50 rounded-xl animate-pulse" />)}</div>;
  }

  const totalCount = leads.length + callOutputs.length;

  return (
    <div>
      <SectionHeader icon={Users} label="Outreach" count={totalCount} color="bg-green-600" />

      {totalCount === 0 ? (
        <EmptyState icon={Users} title="No outreach yet" subtitle="Leads and call transcripts will appear here" />
      ) : (
        <div className="space-y-3">
          {/* Lead table */}
          {leads.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-stone-100 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[11px] font-semibold text-foreground">Leads</span>
                <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{leads.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="text-left px-4 py-2 font-semibold text-stone-500">Name</th>
                      <th className="text-left px-4 py-2 font-semibold text-stone-500">Company</th>
                      <th className="text-left px-4 py-2 font-semibold text-stone-500">Score</th>
                      <th className="text-left px-4 py-2 font-semibold text-stone-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead._id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                        <td className="px-4 py-2 font-medium text-foreground">{lead.name}</td>
                        <td className="px-4 py-2 text-stone-500">{lead.company ?? "-"}</td>
                        <td className="px-4 py-2">
                          <span className="tabular-nums font-medium text-foreground">{lead.relevanceScore}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", statusColors[lead.outreachStatus])}>
                            {lead.outreachStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Call transcripts */}
          {callOutputs.map((task) => (
            <div key={task._id} className="bg-white rounded-xl border border-stone-200/80 p-4 hover:border-orange-200/60 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{task.input}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {task.completedAt ? timeAgo(task.completedAt) : timeAgo(task._creationTime)}
                  </p>
                  {task.output && (
                    <div className="mt-2 p-3 bg-stone-50 rounded-lg border border-stone-100">
                      <OutputMarkdown content={task.output.substring(0, 500)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Analytics Panel ─────────────────────────────────────────── */

export function AnalyticsPanel() {
  const analyticsData = useQuery(api.analytics_data.list);
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);

  if (!analyticsData || !tasks || !agents) {
    return <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-stone-50 rounded-xl animate-pulse" />)}</div>;
  }

  // Group analytics by channel
  const byChannel = useMemo(() => {
    const grouped: Record<string, { metric: string; value: number }[]> = {};
    for (const d of analyticsData) {
      if (!grouped[d.channel]) grouped[d.channel] = [];
      grouped[d.channel].push({ metric: d.metric, value: d.value });
    }
    return grouped;
  }, [analyticsData]);

  const channels = Object.keys(byChannel);

  // Count completed tasks and active agents as basic metrics
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalTasks = tasks.length;

  return (
    <div>
      <SectionHeader icon={BarChart3} label="Analytics" count={analyticsData.length} color="bg-orange-600" />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white rounded-xl border border-stone-200/80 px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-foreground tabular-nums">{completedTasks}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200/80 px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-foreground tabular-nums">{activeAgents}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200/80 px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-foreground tabular-nums">{totalTasks}</p>
          <p className="text-[10px] text-muted-foreground">Total Tasks</p>
        </div>
      </div>

      {channels.length === 0 && analyticsData.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No analytics yet" subtitle="Metrics will appear as agents complete work" />
      ) : (
        <div className="space-y-2">
          {channels.map((channel) => (
            <div key={channel} className="bg-white rounded-xl border border-stone-200/80 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-xs font-semibold text-foreground capitalize">{channel}</span>
              </div>
              <div className="space-y-1.5">
                {byChannel[channel].map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">{d.metric}</span>
                    <span className="font-medium text-foreground tabular-nums">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
