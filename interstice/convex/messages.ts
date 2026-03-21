import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const send = mutation({
  args: {
    from: v.id("agents"),
    to: v.id("agents"),
    channel: v.string(),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", args);
  },
});

export const getForAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_to", (q) => q.eq("to", args.agentId))
      .collect();
  },
});

export const getByChannel = query({
  args: { channel: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channel", args.channel))
      .collect();
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("messages").order("desc").collect();
  },
});

export const markRead = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { readAt: Date.now() });
  },
});
