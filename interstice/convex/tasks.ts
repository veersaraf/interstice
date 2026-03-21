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
