import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const start = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("heartbeat_runs", {
      agentId: args.agentId,
      status: "running",
      startedAt: Date.now(),
    });
  },
});

export const succeed = mutation({
  args: { id: v.id("heartbeat_runs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "succeeded",
      finishedAt: Date.now(),
    });
  },
});

export const fail = mutation({
  args: { id: v.id("heartbeat_runs"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "failed",
      finishedAt: Date.now(),
      error: args.error,
    });
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("heartbeat_runs")
      .order("desc")
      .take(args.limit ?? 20);
  },
});
