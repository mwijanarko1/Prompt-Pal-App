import { aiProxy } from '@/lib/aiProxy';
import { logger } from '@/lib/logger';

// Constants
const DEFAULT_USAGE_THRESHOLD = 80; // Percentage threshold for "near limit" warnings

export interface UsageStats {
  tier: 'free' | 'pro';
  used: {
    textCalls: number;
    imageCalls: number;
  };
  limits: {
    textCalls: number;
    imageCalls: number;
  };
  periodStart: number;
}

export class UsageClient {
  /**
   * Fetches current user usage statistics from the backend
   * @returns Promise resolving to usage statistics
   * @throws {Error} If API request fails
   */
  static async getUsage(): Promise<UsageStats> {
    try {
      const response = await aiProxy.get('/api/user/usage');
      return response.data;
    } catch (error) {
      logger.error('UsageClient', error, { operation: 'getUsage' });
      throw new Error('Failed to load usage statistics. Please check your connection and try again.');
    }
  }


  /**
   * Calculates remaining calls for each type
   * @param usage - Current usage statistics
   * @returns Object with remaining calls for text and image generation
   */
  static getRemainingCalls(usage: UsageStats): { textCalls: number; imageCalls: number } {
    return {
      textCalls: Math.max(0, usage.limits.textCalls - usage.used.textCalls),
      imageCalls: Math.max(0, usage.limits.imageCalls - usage.used.imageCalls),
    };
  }

  /**
   * Checks if user is near their usage limits
   * @param usage - Current usage statistics
   * @param thresholdPercent - Percentage threshold (default: 80%)
   * @returns True if any usage type is at or above the threshold
   */
  static isNearLimit(usage: UsageStats, thresholdPercent: number = DEFAULT_USAGE_THRESHOLD): boolean {
    if (thresholdPercent < 0 || thresholdPercent > 100) {
      throw new Error('Threshold percentage must be between 0 and 100');
    }

    const textUsagePercent = (usage.used.textCalls / usage.limits.textCalls) * 100;
    const imageUsagePercent = (usage.used.imageCalls / usage.limits.imageCalls) * 100;

    return textUsagePercent >= thresholdPercent || imageUsagePercent >= thresholdPercent;
  }

  /**
   * Gets usage percentage for a specific call type
   * @param usage - Current usage statistics
   * @param type - Type of calls to check ('text' or 'image')
   * @returns Usage percentage (0-100)
   */
  static getUsagePercentage(usage: UsageStats, type: 'text' | 'image'): number {
    const used = type === 'text' ? usage.used.textCalls : usage.used.imageCalls;
    const limit = type === 'text' ? usage.limits.textCalls : usage.limits.imageCalls;

    return Math.min(100, (used / limit) * 100);
  }
}