import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agent registry — CEO, Research, Comms, Developer, Call
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    title: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("error")
    ),
    reportsTo: v.optional(v.id("agents")),
    description: v.string(),
    currentTask: v.optional(v.string()), // What the agent is currently doing
    adapterType: v.optional(v.union(v.literal("claude"), v.literal("codex"))), // LLM backend — defaults to "claude"
    model: v.optional(v.string()), // Model override (e.g. "gpt-5.3-codex", "claude-sonnet-4-6")
  })
    .index("by_status", ["status"])
    .index("by_name", ["name"]),

  // Task queue — atomic checkout, parent/child hierarchy
  tasks: defineTable({
    agentId: v.optional(v.id("agents")),
    parentTaskId: v.optional(v.id("tasks")),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("pending_approval"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    input: v.string(),
    output: v.optional(v.string()),
    createdBy: v.optional(v.id("agents")),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    retryCount: v.optional(v.number()), // Track failures — cancel after MAX_RETRIES
  })
    .index("by_agent_status", ["agentId", "status"])
    .index("by_status", ["status"])
    .index("by_parent", ["parentTaskId"]),

  // Inter-agent direct messages
  messages: defineTable({
    from: v.id("agents"),
    to: v.id("agents"),
    channel: v.string(),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
    readAt: v.optional(v.number()),
  })
    .index("by_to", ["to"])
    .index("by_channel", ["channel"])
    .index("by_task", ["taskId"]),

  // Shared findings — agents post results here for others to read
  findings: defineTable({
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
    content: v.string(),
    summary: v.optional(v.string()),
  }).index("by_task", ["taskId"]),

  // Approval gates — pause execution until human confirms
  approvals: defineTable({
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    action: v.string(),
    details: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied")
    ),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_task", ["taskId"]),

  // Activity log — immutable audit trail, streaming agent output
  activity_log: defineTable({
    agentId: v.optional(v.id("agents")),
    action: v.string(),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
  }),

  // Heartbeat run records
  heartbeat_runs: defineTable({
    agentId: v.id("agents"),
    status: v.union(
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_agent", ["agentId"]),

  // Claude session persistence — maps agent to session ID for --resume
  sessions: defineTable({
    agentId: v.id("agents"),
    claudeSessionId: v.string(),
    cwd: v.string(),
  }).index("by_agent", ["agentId"]),

  // Company goals — context injected into agent prompts
  goals: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused")
    ),
  }),

  // Company contacts — people the company knows about
  contacts: defineTable({
    name: v.string(),
    role: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    addedBy: v.optional(v.id("agents")),
  }).index("by_name", ["name"]),
});
