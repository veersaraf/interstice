"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, timeAgo } from "../../lib/utils";
import {
  FileText,
  ChevronDown,
  Copy,
  Check,
  BarChart3,
  Download,
  ExternalLink,
  Eye,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import ReactMarkdown from "react-markdown";

const roleColors: Record<string, string> = {
  CEO: "text-amber-700",
  Research: "text-blue-700",
  Content: "text-purple-700",
  Outreach: "text-orange-700",
  Analytics: "text-cyan-700",
};

const roleDimBg: Record<string, string> = {
  CEO: "bg-amber-50",
  Research: "bg-blue-50",
  Content: "bg-purple-50",
  Outreach: "bg-orange-50",
  Analytics: "bg-cyan-50",
};

const roleAvatar: Record<string, string> = {
  CEO: "/avatars/ceo.png",
  Research: "/avatars/research.png",
  Content: "/avatars/content.png",
  Outreach: "/avatars/outreach.png",
  Analytics: "/avatars/analytics.png",
};

/**
 * Extract image URLs from agent output (OpenAI generation URLs, etc.)
 * and convert them to a renderable gallery.
 */
function extractImageUrls(output: string): string[] {
  const urls: string[] = [];
  // Match local image paths from generate_images (saved to public/output/images/)
  const localPattern = /\/output\/images\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp|gif)/gi;
  // Match remote image URLs
  const urlPattern = /https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s"'<>]*)?/gi;
  // Also match oaidalleapiprodscus URLs (no extension)
  const oaiPattern = /https?:\/\/oaidalleapiprodscus[^\s"'<>]+/gi;
  let match;
  while ((match = localPattern.exec(output)) !== null) urls.push(match[0]);
  while ((match = urlPattern.exec(output)) !== null) {
    if (!urls.includes(match[0])) urls.push(match[0]);
  }
  while ((match = oaiPattern.exec(output)) !== null) {
    if (!urls.includes(match[0])) urls.push(match[0]);
  }
  return urls;
}

/**
 * Image gallery component for TikTok slideshow images in output.
 */
function OutputImageGallery({ urls }: { urls: string[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const sceneLabels = ["Hook", "Problem", "Solution", "Features", "Social Proof", "CTA"];

  return (
    <div className="mt-3 mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Eye className="w-3.5 h-3.5 text-purple-600" />
        <span className="text-[11px] font-semibold text-purple-700">Generated Images ({urls.length})</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <div
            key={i}
            className="relative group cursor-pointer rounded-lg overflow-hidden border border-purple-100 hover:border-purple-300 transition-colors"
            onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
          >
            <img
              src={url}
              alt={sceneLabels[i] || `Image ${i + 1}`}
              className="w-full aspect-[2/3] object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                {sceneLabels[i] || `Slide ${i + 1}`}
              </span>
            </div>
          </div>
        ))}
      </div>
      {selectedIdx !== null && (
        <div className="mt-2 rounded-lg overflow-hidden border border-purple-200">
          <img
            src={urls[selectedIdx]}
            alt={sceneLabels[selectedIdx] || `Image ${selectedIdx + 1}`}
            className="w-full max-h-[500px] object-contain bg-stone-50"
          />
        </div>
      )}
    </div>
  );
}

function detectOutputFormat(output: string): "markdown" | "html" | "text" {
  const trimmed = output.trim();
  if (
    /^<!doctype\s+html/i.test(trimmed) ||
    /^<html[\s>]/i.test(trimmed) ||
    (/<\/(div|section|article|main|body|head)>/i.test(trimmed) && trimmed.length > 200)
  ) return "html";
  const mdSignals = [/^#{1,6}\s/m, /^\s*[-*]\s/m, /^\s*\d+\.\s/m, /```/, /\*\*[^*]+\*\*/, /\[.+?\]\(.+?\)/, /^\s*>\s/m, /\|.+\|.+\|/];
  if (mdSignals.filter((re) => re.test(trimmed)).length >= 2) return "markdown";
  return "text";
}

export function FindingsPage() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [diskImages, setDiskImages] = useState<string[]>([]);

  // Fetch available images from disk — works even if task output doesn't contain URLs
  useEffect(() => {
    fetch("/api/images")
      .then((r) => r.json())
      .then((data) => setDiskImages(data.images ?? []))
      .catch(() => {});
  }, [tasks]); // Re-fetch when tasks update


  // Filter to tasks that have substantive output (exclude CEO synthesis/delegation messages)
  const tasksWithOutput = useMemo(() => {
    if (!tasks || !agents) return [];
    const ceoAgentId = agents.find((a) => a.role === "CEO")?._id;
    return tasks
      .filter((t) => {
        if (!t.output || t.output.trim().length === 0) return false;
        // Exclude CEO tasks — those are delegation summaries, not real outputs
        if (t.agentId === ceoAgentId) return false;
        return true;
      })
      .sort((a, b) => (b.completedAt ?? b._creationTime) - (a.completedAt ?? a._creationTime));
  }, [tasks, agents]);

  const agentMap = useMemo(
    () => new Map((agents ?? []).map((a) => [a._id, a])),
    [agents]
  );

  if (!tasks || !agents) {
    return (
      <div className="max-w-[1100px] space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
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

  const downloadOutput = (content: string, format: string) => {
    const ext = format === "html" ? "html" : format === "markdown" ? "md" : "txt";
    const blob = new Blob([content], { type: format === "html" ? "text/html" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInNewTab = (content: string, format: string) => {
    const blob = new Blob([content], { type: format === "html" ? "text/html" : "text/plain" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const cleanInput = (raw: string) =>
    raw.replace(/\[OMI_UID:[^\]]+\]/g, "").replace(/\[SYNTHESIS\]/g, "").replace(/\[VOICE_COMMAND\]/g, "").trim();

  return (
    <div className="max-w-[1100px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Outputs</h1>
          <span className="text-[11px] text-muted-foreground font-medium">
            {tasksWithOutput.length} output{tasksWithOutput.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {tasksWithOutput.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No outputs yet</p>
          <p className="text-xs text-muted-foreground">
            Task outputs will appear here as your agents complete work
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasksWithOutput.map((task) => {
            const agent = task.agentId ? agentMap.get(task.agentId) ?? null : null;
            const isExpanded = expandedIds.has(task._id);
            const isCopied = copiedId === task._id;
            const output = task.output!;
            const format = detectOutputFormat(output);
            const taskTitle = cleanInput(task.input);
            const role = agent?.role ?? "";

            return (
              <Card key={task._id} className="overflow-hidden">
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/20 transition-colors"
                  onClick={() => toggleExpand(task._id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {agent && (
                      <div className={cn(
                        "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
                        roleDimBg[role] ?? "bg-stone-50"
                      )}>
                        <img src={roleAvatar[role] ?? ""} alt={role} className="w-full h-full object-cover rounded-md" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {taskTitle.length > 80 ? taskTitle.slice(0, 80) + "…" : taskTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {agent && (
                          <span className={cn("text-[10px] font-semibold", roleColors[role] ?? "text-stone-500")}>
                            {role}
                          </span>
                        )}
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider",
                          format === "html" ? "bg-blue-50 text-blue-600" :
                          format === "markdown" ? "bg-purple-50 text-purple-600" :
                          "bg-stone-100 text-stone-500"
                        )}>
                          {format}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                      {timeAgo(task.completedAt ?? task._creationTime)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyContent(output, task._id); }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Copy"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadOutput(output, format); }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {format === "html" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openInNewTab(output, format); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground/60 transition-transform", isExpanded && "rotate-180")} />
                  </div>
                </div>

                {/* Expanded output content */}
                {isExpanded && (() => {
                  let imageUrls = extractImageUrls(output);
                  // Fallback: if Content agent TikTok task has no images in output,
                  // use images from disk (pre-generated or auto-generated)
                  if (imageUrls.length === 0 && role === "Content" && /tiktok|slideshow|slide\s*\d/i.test(output)) {
                    imageUrls = diskImages;
                  }
                  return (
                  <div className="border-t border-border">
                    {/* Image gallery for Content agent outputs */}
                    {imageUrls.length > 0 && (
                      <div className="px-5 pt-3">
                        <OutputImageGallery urls={imageUrls} />
                      </div>
                    )}
                    {format === "html" ? (
                      <div className="bg-white">
                        <iframe
                          srcDoc={output}
                          className="w-full border-0"
                          style={{ minHeight: "400px", height: "50vh" }}
                          sandbox="allow-scripts"
                          title="HTML output"
                        />
                      </div>
                    ) : format === "markdown" ? (
                      <div className="px-5 py-4 prose-interstice">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <h1 className="text-sm font-bold text-foreground mb-2 mt-3 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-[13px] font-semibold text-foreground mb-1.5 mt-2.5">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs font-semibold text-foreground mb-1 mt-2">{children}</h3>,
                            p: ({ children }) => <p className="text-xs text-foreground/85 leading-relaxed mb-2">{children}</p>,
                            ul: ({ children }) => <ul className="text-xs text-foreground/85 list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                            ol: ({ children }) => <ol className="text-xs text-foreground/85 list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            code: ({ className, children }) => {
                              const isBlock = className?.includes("language-");
                              return isBlock ? (
                                <pre className="bg-card rounded-lg p-3 border border-border/50 overflow-x-auto mb-2">
                                  <code className="text-[11px] font-mono text-foreground/90">{children}</code>
                                </pre>
                              ) : (
                                <code className="text-[11px] font-mono bg-primary/10 text-primary px-1 py-0.5 rounded">{children}</code>
                              );
                            },
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-xs text-muted-foreground italic">{children}</blockquote>
                            ),
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {children}
                              </a>
                            ),
                            img: ({ src, alt }) => (
                              <img src={src} alt={alt || ""} className="max-w-full rounded-lg border border-border/50 my-2" loading="lazy" />
                            ),
                          }}
                        >
                          {output}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="px-5 py-4">
                        <div className="text-[13px] text-foreground/85 whitespace-pre-wrap leading-relaxed">
                          {output}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })()}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
