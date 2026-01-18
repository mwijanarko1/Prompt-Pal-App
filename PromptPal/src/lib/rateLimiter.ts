/**
 * Simple in-memory rate limiter for client-side request throttling
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();

  /**
   * Check if a request is allowed under the current rate limit
   * @param key - Unique identifier for the rate limit bucket
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns True if request is allowed, false if rate limited
   */
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired, allow and reset
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   * @param key - Unique identifier for the rate limit bucket
   * @param maxRequests - Maximum requests allowed in the window
   * @returns Number of remaining requests
   */
  getRemainingRequests(key: string, maxRequests: number): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until reset for a key
   * @param key - Unique identifier for the rate limit bucket
   * @returns Milliseconds until reset, or 0 if not rate limited
   */
  getTimeUntilReset(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const timeLeft = entry.resetTime - Date.now();
    return Math.max(0, timeLeft);
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  clear(): void {
    this.limits.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Convenience functions for AI proxy rate limiting
export const AI_RATE_LIMITS = {
  textGeneration: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  },
  imageGeneration: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
  },
} as const;

/**
 * Check if AI text generation request is allowed
 * @returns True if allowed, false if rate limited
 */
export function isTextGenerationAllowed(): boolean {
  return rateLimiter.isAllowed(
    'ai-text',
    AI_RATE_LIMITS.textGeneration.maxRequests,
    AI_RATE_LIMITS.textGeneration.windowMs
  );
}

/**
 * Check if AI image generation request is allowed
 * @returns True if allowed, false if rate limited
 */
export function isImageGenerationAllowed(): boolean {
  return rateLimiter.isAllowed(
    'ai-image',
    AI_RATE_LIMITS.imageGeneration.maxRequests,
    AI_RATE_LIMITS.imageGeneration.windowMs
  );
}

/**
 * Get rate limit status for text generation
 * @returns Object with remaining requests and reset time
 */
export function getTextGenerationLimitStatus(): {
  remaining: number;
  resetInMs: number;
} {
  return {
    remaining: rateLimiter.getRemainingRequests(
      'ai-text',
      AI_RATE_LIMITS.textGeneration.maxRequests
    ),
    resetInMs: rateLimiter.getTimeUntilReset('ai-text'),
  };
}

/**
 * Get rate limit status for image generation
 * @returns Object with remaining requests and reset time
 */
export function getImageGenerationLimitStatus(): {
  remaining: number;
  resetInMs: number;
} {
  return {
    remaining: rateLimiter.getRemainingRequests(
      'ai-image',
      AI_RATE_LIMITS.imageGeneration.maxRequests
    ),
    resetInMs: rateLimiter.getTimeUntilReset('ai-image'),
  };
}