import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Post findings (agents share results here)
export const post = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
    content: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("findings", args);
  },
});

// Get all findings (for dashboard)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("findings").order("desc").collect();
  },
});

// Get findings for a specific task
export const getByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("findings")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// Get all recent findings (for injecting into agent prompts)
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("findings")
      .order("desc")
      .take(args.limit ?? 10);
    return results;
  },
});
