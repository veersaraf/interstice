import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    agentId: v.id("agents"),
    claudeSessionId: v.string(),
    cwd: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        claudeSessionId: args.claudeSessionId,
        cwd: args.cwd,
      });
      return existing._id;
    }

    return await ctx.db.insert("sessions", args);
  },
});

export const getForAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});
