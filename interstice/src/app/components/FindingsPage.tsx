"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { timeAgo } from "../../lib/utils";
import { FileText, ChevronDown, Copy, Check } from "lucide-react";
import { useState } from "react";

const roleColors: Record<string, string> = {
  CEO:            "text-yellow-400",
  Research:       "text-blue-400",
  Communications: "text-purple-400",
  Developer:      "text-green-400",
  Call:           "text-orange-400",
};

const roleBg: Record<string, string> = {
  CEO:            "rgba(251,191,36,0.08)",
  Research:       "rgba(96,165,250,0.08)",
  Communications: "rgba(192,132,252,0.08)",
  Developer:      "rgba(52,211,153,0.08)",
  Call:           "rgba(251,146,60,0.08)",
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
          <div key={i} className="h-32 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
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
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="max-w-[1100px] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <FileText className="w-4 h-4 text-gray-500" />
        <h1 className="text-sm font-semibold text-white">Agent Output & Findings</h1>
        <span className="text-[11px] text-gray-500 font-medium">{findings.length} results</span>
      </div>

      {/* Findings list */}
      {findings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            <FileText className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-sm font-medium text-gray-300 mb-1">No findings yet</p>
          <p className="text-xs text-gray-500">
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
              <div
                key={finding._id}
                className="rounded-lg overflow-hidden"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleExpand(finding._id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: roleBg[agent?.role ?? ""] ?? "rgba(156,163,175,0.08)" }}
                    >
                      <FileText className={cn("w-3.5 h-3.5", roleColors[agent?.role ?? ""] ?? "text-gray-400")} />
                    </div>
                    <div>
                      <span className={cn("text-xs font-bold", roleColors[agent?.role ?? ""] ?? "text-gray-400")}>
                        {agent?.role ?? "Agent"}
                      </span>
                      {finding.summary && (
                        <p className="text-xs text-gray-400 mt-0.5">{finding.summary}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 tabular-nums">{timeAgo(finding._creationTime)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyContent(finding.content, finding._id); }}
                      className="p-1.5 rounded-md text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <ChevronDown className={cn("w-4 h-4 text-gray-600 transition-transform", isExpanded && "rotate-180")} />
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className={cn(
                    "text-xs text-gray-300 whitespace-pre-wrap leading-relaxed pt-3 font-mono",
                    !isExpanded && isLong && "max-h-32 overflow-hidden relative"
                  )}>
                    {isExpanded || !isLong ? finding.content : finding.content.substring(0, 400) + "…"}
                    {!isExpanded && isLong && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--surface-2)] to-transparent" />
                    )}
                  </div>
                  {!isExpanded && isLong && (
                    <button
                      onClick={() => toggleExpand(finding._id)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 mt-2 font-medium"
                    >
                      Show full output →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
