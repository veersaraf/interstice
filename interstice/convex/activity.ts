import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const log = mutation({
  args: {
    agentId: v.optional(v.id("agents")),
    action: v.string(),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activity_log", args);
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity_log")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const addUserComment = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activity_log", {
      action: "user_comment",
      content: args.content,
      taskId: args.taskId,
    });
  },
});

export const getByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity_log")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .collect();
  },
});
