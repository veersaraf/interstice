import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const outreachStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("responded"),
  v.literal("converted"),
  v.literal("lost")
);

// Create a lead
export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    name: v.string(),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    relevanceScore: v.number(),
    reason: v.string(),
    outreachStatus: v.optional(outreachStatusValidator),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leads", {
      taskId: args.taskId,
      name: args.name,
      company: args.company,
      email: args.email,
      phone: args.phone,
      relevanceScore: args.relevanceScore,
      reason: args.reason,
      outreachStatus: args.outreachStatus ?? "new",
    });
  },
});

// List all leads (for dashboard)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("leads").order("desc").take(50);
  },
});

// Get leads for a specific task
export const getByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// Get leads by outreach status
export const getByStatus = query({
  args: { outreachStatus: outreachStatusValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_outreachStatus", (q) =>
        q.eq("outreachStatus", args.outreachStatus)
      )
      .take(50);
  },
});

// Update lead outreach status
export const updateStatus = mutation({
  args: {
    id: v.id("leads"),
    outreachStatus: outreachStatusValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { outreachStatus: args.outreachStatus });
  },
});

// Get a single lead
export const get = query({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
