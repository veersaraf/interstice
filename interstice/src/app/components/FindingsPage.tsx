"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, timeAgo } from "../../lib/utils";
import { FileText, ChevronDown, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card } from "../../components/ui/card";

const roleColors: Record<string, string> = {
  CEO:            "text-amber-700",
  Research:       "text-blue-700",
  Communications: "text-purple-700",
  Developer:      "text-emerald-700",
  Call:           "text-orange-700",
};

const roleDimBg: Record<string, string> = {
  CEO:            "bg-amber-500/[0.06]",
  Research:       "bg-blue-500/[0.06]",
  Communications: "bg-purple-500/[0.06]",
  Developer:      "bg-emerald-500/[0.06]",
  Call:           "bg-orange-500/[0.06]",
};

export function FindingsPage() {
  const findings = useQuery(api.findings.list);
  const agents = useQuery(api.agents.list);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!findings || !agents) {
    return (
      <div className="max-w-[1100px] space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const toggleExpand = (id: string) => {
    setExpandedFindings((prev) => {
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

  return (
    <div className="max-w-[1100px] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Agent Output & Findings</h1>
        <span className="text-[11px] text-muted-foreground font-medium">{findings.length} results</span>
      </div>

      {findings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-cyan-500/10 border border-cyan-500/20">
            <FileText className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No findings yet</p>
          <p className="text-xs text-muted-foreground">
            Agent research results and outputs will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {findings.map((finding) => {
            const agent = agentMap.get(finding.agentId);
            const isExpanded = expandedFindings.has(finding._id);
            const isLong = finding.content.length > 400;
            const isCopied = copiedId === finding._id;

            return (
              <Card key={finding._id} className="overflow-hidden">
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/20 transition-colors"
                  onClick={() => toggleExpand(finding._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                      roleDimBg[agent?.role ?? ""] ?? "bg-zinc-500/[0.06]"
                    )}>
                      <FileText className={cn("w-3.5 h-3.5", roleColors[agent?.role ?? ""] ?? "text-zinc-400")} />
                    </div>
                    <div>
                      <span className={cn("text-xs font-bold", roleColors[agent?.role ?? ""] ?? "text-zinc-400")}>
                        {agent?.role ?? "Agent"}
                      </span>
                      {finding.summary && (
                        <p className="text-xs text-muted-foreground mt-0.5">{finding.summary}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">{timeAgo(finding._creationTime)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyContent(finding.content, finding._id); }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground/60 transition-transform", isExpanded && "rotate-180")} />
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-4 border-t border-border">
                  <div className={cn(
                    "text-xs text-foreground/70 whitespace-pre-wrap leading-relaxed pt-3 font-mono",
                    !isExpanded && isLong && "max-h-32 overflow-hidden relative"
                  )}>
                    {isExpanded || !isLong ? finding.content : finding.content.substring(0, 400) + "..."}
                    {!isExpanded && isLong && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
                    )}
                  </div>
                  {!isExpanded && isLong && (
                    <button
                      onClick={() => toggleExpand(finding._id)}
                      className="text-[11px] text-primary hover:text-primary/80 mt-2 font-medium"
                    >
                      Show full output
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
