"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  PauseCircle,
  Pencil,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../lib/utils";

type Goal = {
  _id: Id<"goals">;
  _creationTime: number;
  title: string;
  description: string;
  status: "active" | "completed" | "paused";
};

type GoalStatus = Goal["status"];

const statusConfig: Record<GoalStatus, { label: string; icon: typeof Circle; color: string; bg: string; border: string }> = {
  active: {
    label: "Active",
    icon: Circle,
    color: "text-green-400",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-blue-400",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    color: "text-yellow-400",
    bg: "rgba(234,179,8,0.1)",
    border: "rgba(234,179,8,0.25)",
  },
};

const tabs: { id: "all" | GoalStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "paused", label: "Paused" },
];

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
      >
        <Target className="w-6 h-6 text-purple-400" />
      </div>
      <p className="text-sm font-medium text-gray-300 mb-1">
        {filter === "all" ? "No goals yet" : `No ${filter} goals`}
      </p>
      <p className="text-xs text-gray-500">
        Goals give your agents context about what the company is working toward.
      </p>
    </div>
  );
}

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl p-6 space-y-4"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">
            {initial ? "Edit Goal" : "New Goal"}
          </h3>
          <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Close seed round by Q2"
            className="w-full px-3 py-2 rounded-md text-xs text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-blue-500/50"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does success look like?"
            rows={3}
            className="w-full px-3 py-2 rounded-md text-xs text-white placeholder-gray-600 outline-none resize-none focus:ring-1 focus:ring-blue-500/50"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          />
        </div>

        {initial && (
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Status</label>
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
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      status === s ? cfg.color : "text-gray-500"
                    )}
                    style={{
                      background: status === s ? cfg.bg : "transparent",
                      border: `1px solid ${status === s ? cfg.border : "var(--border)"}`,
                    }}
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
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
            style={{ border: "1px solid var(--border)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !description.trim()}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
          >
            {initial ? "Save Changes" : "Create Goal"}
          </button>
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
          <Target className="w-4 h-4 text-gray-500" />
          <h1 className="text-sm font-semibold text-white">Goals</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Goal
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-3 py-2 text-xs font-medium transition-colors relative",
              filter === tab.id
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className="ml-1.5 text-[10px] text-gray-600">{counts[tab.id]}</span>
            )}
            {filter === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {!goals ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((goal) => {
              const cfg = statusConfig[goal.status];
              const StatusIcon = cfg.icon;
              const isExpanded = expanded.has(goal._id);

              return (
                <div key={goal._id} className="group">
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    {/* Status toggle */}
                    <button
                      onClick={() => handleStatusCycle(goal)}
                      className={cn("shrink-0 transition-colors", cfg.color)}
                      title={`Status: ${cfg.label} — click to cycle`}
                    >
                      <StatusIcon className="w-4 h-4" />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(goal._id)}>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            goal.status === "completed" ? "text-gray-500 line-through" : "text-white"
                          )}
                        >
                          {goal.title}
                        </span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color.replace("text-", ""), border: `1px solid ${cfg.border}` }}
                        >
                          <span className={cfg.color}>{cfg.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Expand arrow */}
                    <button
                      onClick={() => toggleExpand(goal._id)}
                      className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      <ChevronDown
                        className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")}
                      />
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditing(goal)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal._id)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-3 pl-11"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <p className="text-xs text-gray-400 leading-relaxed pt-3 whitespace-pre-wrap">
                        {goal.description}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-2">
                        Created {new Date(goal._creationTime).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && <GoalForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}
      {editing && (
        <GoalForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
