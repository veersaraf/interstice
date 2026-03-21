import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const get = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// Seed all 5 agents — idempotent, safe to call multiple times
export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("agents").collect();
    if (existing.length > 0) return { seeded: false, count: existing.length };

    const ceoId = await ctx.db.insert("agents", {
      name: "ceo",
      role: "CEO",
      title: "Chief Executive Officer",
      status: "idle",
      description:
        "Receives commands, decomposes into tasks, delegates to specialists, monitors progress, synthesizes results.",
    });

    await ctx.db.insert("agents", {
      name: "research",
      role: "Research",
      title: "Research Analyst",
      status: "idle",
      reportsTo: ceoId,
      description:
        "Web research, competitive analysis, market summaries, fact-finding via Perplexity API.",
    });

    await ctx.db.insert("agents", {
      name: "comms",
      role: "Communications",
      title: "Communications Specialist",
      status: "idle",
      reportsTo: ceoId,
      description:
        "Email drafting, outreach templates, investor messages, follow-ups.",
    });

    await ctx.db.insert("agents", {
      name: "developer",
      role: "Developer",
      title: "Software Developer",
      status: "idle",
      reportsTo: ceoId,
      description:
        "Code generation, landing pages, scaffolding, file output.",
    });

    await ctx.db.insert("agents", {
      name: "call",
      role: "Call",
      title: "Call Agent",
      status: "idle",
      reportsTo: ceoId,
      description:
        "Outbound phone calls via ElevenLabs + Twilio. Always requires approval.",
    });

    return { seeded: true, count: 5 };
  },
});
