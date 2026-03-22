"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Target, Plus, CheckCircle2, Circle, PauseCircle, Pencil, Trash2, X, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

type Goal = {
  _id: Id<"goals">;
  _creationTime: number;
  title: string;
  description: string;
  status: "active" | "completed" | "paused";
};

type GoalStatus = Goal["status"];

const statusConfig: Record<GoalStatus, { label: string; icon: typeof Circle; color: string; variant: "success" | "info" | "warning" }> = {
  active:    { label: "Active",    icon: Circle,       color: "text-emerald-400", variant: "success" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-blue-400",    variant: "info"    },
  paused:    { label: "Paused",    icon: PauseCircle,  color: "text-yellow-400",  variant: "warning" },
};

const tabs: { id: "all" | GoalStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "paused", label: "Paused" },
];

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

export function GoalsPage() {
  const goals = useQuery(api.goals.list);
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const removeGoal = useMutation(api.goals.remove);

  const [filter, setFilter] = useState<"all" | GoalStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = goals?.filter((g) => filter === "all" || g.status === filter) ?? [];

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

  const counts = {
    all: goals?.length ?? 0,
    active: goals?.filter((g) => g.status === "active").length ?? 0,
    completed: goals?.filter((g) => g.status === "completed").length ?? 0,
    paused: goals?.filter((g) => g.status === "paused").length ?? 0,
  };

  return (
    <div className="max-w-[1000px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Target className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Goals</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3" />
          New Goal
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-3 py-2 text-xs font-medium transition-colors relative",
              filter === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className="ml-1.5 text-[10px] text-muted-foreground/60">{counts[tab.id]}</span>
            )}
            {filter === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {!goals ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-purple-500/10 border border-purple-500/20">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {filter === "all" ? "No goals yet" : `No ${filter} goals`}
            </p>
            <p className="text-xs text-muted-foreground">
              Goals give your agents context about what the company is working toward.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((goal) => {
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
                        className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal._id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
    </div>
  );
}
