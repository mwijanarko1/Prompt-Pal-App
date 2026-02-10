import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  // Per-minute limits
  perMinute: {
    default: 60,
    authenticated: 120,
    anonymous: 30,
  },
  // Per-hour limits
  perHour: {
    default: 1000,
    authenticated: 2000,
    anonymous: 500,
  },
} as const;

/**
 * Rate limit check result
 */
type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  window: string;
};

/**
 * Rate limiting utility for Convex functions
 * Uses sliding window algorithm with in-memory caching
 */
export async function checkRateLimit(
  ctx: any,
  identifier: string,
  windowMs: number = 60000, // 1 minute default
  maxRequests: number = 60
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Try to get existing rate limit record
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier", (q: any) => q.eq("identifier", identifier))
    .first();
  
  if (!existing) {
    // First request - create new record
    await ctx.db.insert("rateLimits", {
      identifier,
      count: 1,
      windowStart: now,
      createdAt: now,
      updatedAt: now,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
      limit: maxRequests,
      window: `${windowMs}ms`,
    };
  }
  
  // Check if window has expired
  if (existing.windowStart < windowStart) {
    // Reset the window
    await ctx.db.patch(existing._id, {
      count: 1,
      windowStart: now,
      updatedAt: now,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
      limit: maxRequests,
      window: `${windowMs}ms`,
    };
  }
  
  // Window still active - check limit
  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.windowStart + windowMs,
      limit: maxRequests,
      window: `${windowMs}ms`,
    };
  }
  
  // Increment count
  await ctx.db.patch(existing._id, {
    count: existing.count + 1,
    updatedAt: now,
  });
  
  return {
    allowed: true,
    remaining: maxRequests - existing.count - 1,
    resetAt: existing.windowStart + windowMs,
    limit: maxRequests,
    window: `${windowMs}ms`,
  };
}

/**
 * Clean up old rate limit records (run periodically)
 */
export const cleanupRateLimits = mutation({
  args: {
    olderThanMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (args.olderThanMs || 24 * 60 * 60 * 1000); // Default: 24 hours
    
    const oldRecords = await ctx.db
      .query("rateLimits")
      .filter((q) => q.lt(q.field("updatedAt"), cutoff))
      .collect();
    
    let deleted = 0;
    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
      deleted++;
    }
    
    return { deleted };
  },
});

/**
 * Get current rate limit status for an identifier
 */
export const getRateLimitStatus = query({
  args: {
    identifier: v.string(),
    windowMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identifier, windowMs = 60000 } = args;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier", (q) => q.eq("identifier", identifier))
      .first();
    
    if (!existing || existing.windowStart < windowStart) {
      return {
        remaining: RATE_LIMITS.perMinute.default,
        resetAt: now + windowMs,
        limit: RATE_LIMITS.perMinute.default,
      };
    }
    
    return {
      remaining: Math.max(0, RATE_LIMITS.perMinute.default - existing.count),
      resetAt: existing.windowStart + windowMs,
      limit: RATE_LIMITS.perMinute.default,
    };
  },
});