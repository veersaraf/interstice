import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    name: v.string(),
    role: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    addedBy: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contacts", args);
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("contacts").collect();
  },
});

export const search = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .collect();
  },
});
