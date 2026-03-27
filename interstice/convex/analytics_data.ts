import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Record an analytics data point
export const record = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
    channel: v.string(),
    metric: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analytics_data", args);
  },
});

// List all analytics data (for dashboard)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("analytics_data").order("desc").take(100);
  },
});

// Get analytics data for a specific task
export const getByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analytics_data")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// Get analytics data by channel
export const getByChannel = query({
  args: { channel: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analytics_data")
      .withIndex("by_channel", (q) => q.eq("channel", args.channel))
      .order("desc")
      .take(50);
  },
});
