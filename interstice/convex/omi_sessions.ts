import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    uid: v.string(),
    sessionId: v.string(),
    lastTranscript: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("omi_sessions")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sessionId: args.sessionId,
        lastTranscript: args.lastTranscript ?? existing.lastTranscript,
        lastActiveAt: Date.now(),
        status: "active",
      });
      return existing._id;
    }

    return await ctx.db.insert("omi_sessions", {
      uid: args.uid,
      sessionId: args.sessionId,
      lastTranscript: args.lastTranscript,
      lastActiveAt: Date.now(),
      status: "active",
    });
  },
});

export const getByUid = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("omi_sessions")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .first();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("omi_sessions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});
