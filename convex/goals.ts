import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("goals", {
      ...args,
      status: "active",
    });
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("goals").collect();
  },
});

export const listActive = query({
  handler: async (ctx) => {
    return await ctx.db.query("goals").collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("goals"),
    status: v.optional(
      v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))
    ),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});
