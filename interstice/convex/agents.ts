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
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { status: args.status };
    if (args.currentTask !== undefined) {
      patch.currentTask = args.currentTask;
    }
    if (args.status === "idle") {
      patch.currentTask = undefined;
    }
    await ctx.db.patch(args.id, patch);
  },
});

// Update an agent's LLM adapter and model settings
export const setAdapter = mutation({
  args: {
    id: v.id("agents"),
    adapterType: v.optional(v.union(v.literal("claude"), v.literal("codex"))),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {};
    if (args.adapterType !== undefined) patch.adapterType = args.adapterType;
    // Empty string clears the model so Codex uses its default (ChatGPT accounts don't support explicit models)
    if (args.model !== undefined) patch.model = args.model || undefined;
    await ctx.db.patch(args.id, patch);
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
      name: "content",
      role: "Content",
      title: "Content Creator",
      status: "idle",
      reportsTo: ceoId,
      description:
        "Creates ALL marketing content from Research findings — TikTok slideshows, X posts, LinkedIn posts, landing pages, email sequences. The Larry agent.",
    });

    await ctx.db.insert("agents", {
      name: "outreach",
      role: "Outreach",
      title: "Outreach Specialist",
      status: "idle",
      reportsTo: ceoId,
      description:
        "Personalized cold emails, Bland AI phone calls, lead tracking. Reads research lead list. Approval gate on all sends and calls.",
    });

    await ctx.db.insert("agents", {
      name: "analytics",
      role: "Analytics",
      title: "Analytics Agent",
      status: "idle",
      reportsTo: ceoId,
      description:
        "Monitors performance across channels. Diagnoses funnel problems. Updates other agents skill files based on findings.",
    });

    return { seeded: true, count: 5 };
  },
});
