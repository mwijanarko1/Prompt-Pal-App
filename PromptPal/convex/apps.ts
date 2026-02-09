import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getApp = query({
  args: {
    appId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apps")
      .withIndex("by_app_id", (q) => q.eq("id", args.appId))
      .first();
  },
});

export const insert = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    freeLimits: v.object({
      textCalls: v.number(),
      imageCalls: v.number(),
      audioSummaries: v.number(),
      dailyQuests: v.optional(v.number()),
      imageLevels: v.optional(v.number()),
      codingLogicLevels: v.optional(v.number()),
      copywritingLevels: v.optional(v.number()),
    }),
    proLimits: v.object({
      textCalls: v.number(),
      imageCalls: v.number(),
      audioSummaries: v.number(),
      dailyQuests: v.optional(v.number()),
      imageLevels: v.optional(v.number()),
      codingLogicLevels: v.optional(v.number()),
      copywritingLevels: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("apps", args);
  },
});

export const updateLimits = mutation({
  args: {
    appId: v.string(),
    freeLimits: v.object({
      textCalls: v.number(),
      imageCalls: v.number(),
      audioSummaries: v.number(),
      dailyQuests: v.optional(v.number()),
      imageLevels: v.optional(v.number()),
      codingLogicLevels: v.optional(v.number()),
      copywritingLevels: v.optional(v.number()),
    }),
    proLimits: v.object({
      textCalls: v.number(),
      imageCalls: v.number(),
      audioSummaries: v.number(),
      dailyQuests: v.optional(v.number()),
      imageLevels: v.optional(v.number()),
      codingLogicLevels: v.optional(v.number()),
      copywritingLevels: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const { appId, freeLimits, proLimits } = args;

    const existing = await ctx.db
      .query("apps")
      .withIndex("by_app_id", (q) => q.eq("id", appId))
      .first();

    if (!existing) {
      throw new Error(`App ${appId} not found`);
    }

    await ctx.db.patch(existing._id, {
      freeLimits,
      proLimits,
    });

    return existing._id;
  },
});