"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Brain,
  Target,
  FileText,
  Plus,
  CheckCircle2,
  Circle,
  PauseCircle,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

/* ─── Types ─────────────────────────────────────────────── */

type Goal = {
  _id: Id<"goals">;
  _creationTime: number;
  title: string;
  description: string;
  status: "active" | "completed" | "paused";
};

type GoalStatus = Goal["status"];

type ContextDoc = {
  id: string;
  title: string;
  description: string;
  type: "identity" | "positioning" | "contacts" | "learnings" | "decisions" | "custom";
  content: string;
};

/* ─── Constants ─────────────────────────────────────────── */

const statusConfig: Record<GoalStatus, { label: string; icon: typeof Circle; color: string; variant: "success" | "info" | "warning" }> = {
  active:    { label: "Active",    icon: Circle,       color: "text-green-600",  variant: "success" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-blue-600",   variant: "info"    },
  paused:    { label: "Paused",    icon: PauseCircle,  color: "text-amber-600",  variant: "warning" },
};

const typeColors: Record<string, string> = {
  identity: "bg-purple-50 text-purple-700 border-purple-200",
  positioning: "bg-blue-50 text-blue-700 border-blue-200",
  contacts: "bg-green-50 text-green-700 border-green-200",
  learnings: "bg-amber-50 text-amber-700 border-amber-200",
  decisions: "bg-red-50 text-red-700 border-red-200",
  custom: "bg-stone-50 text-stone-700 border-stone-200",
};

// Dummy company context docs seeded from the memory/company.md content
const defaultContextDocs: ContextDoc[] = [
  {
    id: "identity",
    title: "Company Identity",
    description: "Who we are and what we do",
    type: "identity",
    content: "Name: Interstice\nTagline: The gap between intent and execution — filled by AI agents.\nWhat we do: AI agent orchestration for solopreneurs. You speak, your AI team executes.\nFounded: HackHayward 2026 (March 21-22, Cal State East Bay)\nTeam: Veer Saraf (builder), Warren (pitch)",
  },
  {
    id: "positioning",
    title: "Market Positioning",
    description: "How we fit in the market",
    type: "positioning",
    content: "We sit on top of OMI (hardware wearable) and add the orchestration layer it's missing.\nInspired by Paperclip AI but stripped for speed and demo-ability.\nTarget: solopreneurs who want to run a one-person company with AI agents doing the work.",
  },
  {
    id: "contacts",
    title: "Key Contacts",
    description: "Important people and their info",
    type: "contacts",
    content: "Veer Saraf (founder, builder) — Phone: +13312296729 | Email: veersaraf25@gmail.com\nWarren Kalvakota (co-founder, pitch) — Phone: +12092841138 | Email: kalvakotavarun@gmail.com",
  },
  {
    id: "decisions",
    title: "Key Decisions",
    description: "Major decisions and their reasoning",
    type: "decisions",
    content: "Claude CLI subprocesses instead of API calls — no API key needed, session persistence via --resume.\nConvex for real-time backend — eliminates WebSocket boilerplate.\nHeartbeat-based execution — agents wake, pick up tasks, report back.\nSkill system with approval gates — certain actions require human confirmation.",
  },
];

/* ─── Sub-section tabs ──────────────────────────────────── */

const memoryTabs = [
  { id: "context", label: "Company Context", icon: FileText },
  { id: "goals", label: "Goals", icon: Target },
] as const;

type MemoryTab = (typeof memoryTabs)[number]["id"];

/* ─── Goal Form ─────────────────────────────────────────── */

function GoalForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Goal;
  onSave: (data: { title: string; description: string; status?: GoalStatus }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<GoalStatus>(initial?.status ?? "active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      ...(initial ? { status } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg p-6 space-y-4 bg-card border border-border shadow-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            {initial ? "Edit Goal" : "New Goal"}
          </h3>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Title *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Close seed round by Q2" />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Description *</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does success look like?" rows={3} />
        </div>

        {initial && (
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Status</label>
            <div className="flex gap-2">
              {(["active", "completed", "paused"] as GoalStatus[]).map((s) => {
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                      status === s
                        ? cn(cfg.color, "bg-current/10 border-current/25")
                        : "text-muted-foreground border-border hover:border-border/80"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm" disabled={!title.trim() || !description.trim()}>
            {initial ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ─── Context Doc Form ──────────────────────────────────── */

function ContextDocForm({
  onSave,
  onCancel,
}: {
  onSave: (doc: ContextDoc) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({
      id: `custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      type: "custom",
      content: content.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg p-6 space-y-4 bg-card border border-border shadow-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Add Context Document</h3>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Title *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Brand Guidelines" />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this document" />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Content *</label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste or type content here..." rows={6} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm" disabled={!title.trim() || !content.trim()}>Add Document</Button>
        </div>
      </form>
    </div>
  );
}

/* ─── Goals Section ─────────────────────────────────────── */

function GoalsSection() {
  const goals = useQuery(api.goals.list);
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const removeGoal = useMutation(api.goals.remove);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async (data: { title: string; description: string }) => {
    await createGoal(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: { title: string; description: string; status?: GoalStatus }) => {
    if (!editing) return;
    await updateGoal({ id: editing._id, ...data });
    setEditing(null);
  };

  const handleDelete = async (id: Id<"goals">) => {
    await removeGoal({ id });
  };

  const handleStatusCycle = async (goal: Goal) => {
    const next: GoalStatus =
      goal.status === "active" ? "completed" : goal.status === "completed" ? "paused" : "active";
    await updateGoal({ id: goal._id, status: next });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">
          Goals give your agents context about what the company is working toward.
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3" />
          New Goal
        </Button>
      </div>

      <Card className="overflow-hidden">
        {!goals ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-purple-50 border border-purple-200">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No goals yet</p>
            <p className="text-xs text-muted-foreground">Add goals so your agents know what to work toward.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {goals.map((goal) => {
              const cfg = statusConfig[goal.status];
              const StatusIcon = cfg.icon;
              const isExpanded = expanded.has(goal._id);

              return (
                <div key={goal._id} className="group">
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">
                    <button
                      onClick={() => handleStatusCycle(goal)}
                      className={cn("shrink-0 transition-colors", cfg.color)}
                      title={`Status: ${cfg.label} — click to cycle`}
                    >
                      <StatusIcon className="w-4 h-4" />
                    </button>

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(goal._id)}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium truncate",
                          goal.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {goal.title}
                        </span>
                        <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(goal._id)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditing(goal)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal._id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 pl-11 border-t border-border">
                      <p className="text-xs text-muted-foreground leading-relaxed pt-3 whitespace-pre-wrap">
                        {goal.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        Created {new Date(goal._creationTime).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showForm && <GoalForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}
      {editing && <GoalForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />}
    </>
  );
}

/* ─── Context Section ───────────────────────────────────── */

function ContextSection() {
  const [docs, setDocs] = useState<ContextDoc[]>(defaultContextDocs);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = (doc: ContextDoc) => {
    setDocs((prev) => [...prev, doc]);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">
          Company context your agents reference when making decisions.
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3" />
          Add Document
        </Button>
      </div>

      <div className="grid gap-2.5">
        {docs.map((doc) => {
          const isExpanded = expanded.has(doc.id);
          return (
            <Card key={doc.id} className="overflow-hidden">
              <div className="group">
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(doc.id)}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted/50">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{doc.title}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", typeColors[doc.type] ?? typeColors.custom)}>
                        {doc.type}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{doc.description}</p>
                    )}
                  </div>

                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")} />

                  {doc.type === "custom" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <pre className="text-xs text-muted-foreground leading-relaxed pt-3 whitespace-pre-wrap font-sans">
                      {doc.content}
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {showForm && <ContextDocForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}
    </>
  );
}

/* ─── Memory Page (exported) ────────────────────────────── */

export function MemoryPage() {
  const [activeTab, setActiveTab] = useState<MemoryTab>("context");

  return (
    <div className="max-w-[1000px] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Brain className="w-5 h-5 text-primary" />
        <h1 className="text-sm font-semibold text-foreground">Memory</h1>
        <span className="text-xs text-muted-foreground">— What your agents know about the company</span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border">
        {memoryTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "goals" ? <GoalsSection /> : <ContextSection />}
    </div>
  );
}
