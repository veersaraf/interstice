import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new task (CEO creates these when delegating)
export const create = mutation({
  args: {
    agentId: v.optional(v.id("agents")),
    parentTaskId: v.optional(v.id("tasks")),
    input: v.string(),
    createdBy: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      ...args,
      status: "pending",
    });
  },
});

// Atomic task checkout — claim a pending task for an agent
// Returns the task if claimed, null if already taken
export const claim = mutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status !== "pending") return null;

    await ctx.db.patch(args.taskId, {
      status: "in_progress",
      agentId: args.agentId,
      startedAt: Date.now(),
    });
    return await ctx.db.get(args.taskId);
  },
});

// Complete a task with output
export const complete = mutation({
  args: {
    taskId: v.id("tasks"),
    output: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: "done",
      output: args.output,
      completedAt: Date.now(),
    });
  },
});

// Set task to pending_approval
export const requestApproval = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: "pending_approval" });
  },
});

// Resume a task after approval
export const resume = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: "in_progress" });
  },
});

// Cancel a task
export const cancel = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: "cancelled",
      completedAt: Date.now(),
    });
  },
});

// Get pending tasks for an agent
export const getPending = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_agent_status", (q) =>
        q.eq("agentId", args.agentId).eq("status", "pending")
      )
      .collect();
  },
});

// Get all tasks (for dashboard)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

// Get child tasks of a parent
export const getChildren = query({
  args: { parentTaskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.parentTaskId))
      .collect();
  },
});

// Get all pending tasks (for heartbeat)
export const getAllPending = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

// Get a single task by ID
export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Reset stuck in_progress tasks on server restart — these were orphaned by a crash
export const resetStuck = mutation({
  handler: async (ctx) => {
    const stuck = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
    let count = 0;
    for (const task of stuck) {
      await ctx.db.patch(task._id, {
        status: "pending",
        startedAt: undefined,
      });
      count++;
    }
    return { reset: count };
  },
});

// Reset stale in_progress tasks older than maxAgeMs — called every heartbeat tick
export const resetStale = mutation({
  args: { maxAgeMs: v.number() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const stale = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .collect();
    let count = 0;
    for (const task of stale) {
      if (task.startedAt && now - task.startedAt > args.maxAgeMs) {
        await ctx.db.patch(task._id, {
          status: "pending",
          startedAt: undefined,
        });
        count++;
      }
    }
    return { reset: count };
  },
});

// Reset a single task back to pending after a failure (so it can be retried).
// After MAX_RETRIES (2) failures, permanently cancel the task to stop the retry loop.
export const failTask = mutation({
  args: {
    taskId: v.id("tasks"),
    dropSession: v.optional(v.boolean()), // When true, caller should clear the agent session
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status === "done" || task.status === "cancelled") {
      return { cancelled: false, retryCount: task?.retryCount || 0 };
    }

    const retryCount = (task.retryCount || 0) + 1;
    const MAX_RETRIES = 2;

    if (retryCount >= MAX_RETRIES) {
      // Permanently cancel — stop the retry death spiral
      await ctx.db.patch(args.taskId, {
        status: "cancelled",
        retryCount,
        completedAt: Date.now(),
      });
      return { cancelled: true, retryCount };
    }

    // Reset to pending for retry
    await ctx.db.patch(args.taskId, {
      status: "pending",
      startedAt: undefined,
      retryCount,
    });
    return { cancelled: false, retryCount };
  },
});

// Clear all tasks (for dev/testing cleanup)
export const clearAll = mutation({
  handler: async (ctx) => {
    const all = await ctx.db.query("tasks").collect();
    for (const task of all) {
      await ctx.db.delete(task._id);
    }
    return { deleted: all.length };
  },
});
