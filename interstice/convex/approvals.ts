import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    action: v.string(),
    details: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("approvals", {
      ...args,
      status: "pending",
    });
  },
});

export const approve = mutation({
  args: { id: v.id("approvals") },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval || approval.status !== "pending") return null;

    await ctx.db.patch(args.id, {
      status: "approved",
      resolvedAt: Date.now(),
    });

    // Resume the associated task
    await ctx.db.patch(approval.taskId, { status: "in_progress" });

    return await ctx.db.get(args.id);
  },
});

export const deny = mutation({
  args: { id: v.id("approvals") },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval || approval.status !== "pending") return null;

    await ctx.db.patch(args.id, {
      status: "denied",
      resolvedAt: Date.now(),
    });

    // Cancel the associated task
    await ctx.db.patch(approval.taskId, {
      status: "cancelled",
      completedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

export const listPending = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("approvals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("approvals").order("desc").collect();
  },
});
