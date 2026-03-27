import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a content output record
export const create = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("tiktok"),
      v.literal("tweet"),
      v.literal("linkedin"),
      v.literal("email"),
      v.literal("landing_page")
    ),
    content: v.any(),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("approved"), v.literal("published"))
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("content_outputs", {
      agentId: args.agentId,
      taskId: args.taskId,
      type: args.type,
      content: args.content,
      status: args.status ?? "draft",
    });
  },
});

// List all content outputs (for dashboard)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("content_outputs").order("desc").take(50);
  },
});

// Get content outputs for a specific task
export const getByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("content_outputs")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// Get content outputs by type
export const getByType = query({
  args: {
    type: v.union(
      v.literal("tiktok"),
      v.literal("tweet"),
      v.literal("linkedin"),
      v.literal("email"),
      v.literal("landing_page")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("content_outputs")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .take(20);
  },
});

// Update content output status
export const updateStatus = mutation({
  args: {
    id: v.id("content_outputs"),
    status: v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("published")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
