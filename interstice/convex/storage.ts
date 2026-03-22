import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate an upload URL for file storage
// Agents call this to get a signed URL, then upload the file directly
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get a download URL for a stored file
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
