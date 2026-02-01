import {
  rateLimiter,
  isTextGenerationAllowed,
  isImageGenerationAllowed,
  getTextGenerationLimitStatus,
  getImageGenerationLimitStatus,
  AI_RATE_LIMITS,
} from '@/lib/rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  it('should allow requests within limit', () => {
    expect(rateLimiter.isAllowed('test', 5, 60000)).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.isAllowed('test', 5, 60000);
    }
    expect(rateLimiter.isAllowed('test', 5, 60000)).toBe(false);
  });

  it('should reset after window expires', async () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.isAllowed('test', 5, 100);
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(rateLimiter.isAllowed('test', 5, 60000)).toBe(true);
  });

  it('should handle multiple keys independently', () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.isAllowed('key1', 5, 60000);
    }
    expect(rateLimiter.isAllowed('key1', 5, 60000)).toBe(false);
    expect(rateLimiter.isAllowed('key2', 5, 60000)).toBe(true);
  });

  describe('getRemainingRequests', () => {
    it('returns maxRequests when no entry or window expired', () => {
      expect(rateLimiter.getRemainingRequests('newkey', 5)).toBe(5);
    });

    it('decrements as requests are consumed', () => {
      rateLimiter.isAllowed('r', 5, 60000);
      expect(rateLimiter.getRemainingRequests('r', 5)).toBe(4);
      rateLimiter.isAllowed('r', 5, 60000);
      expect(rateLimiter.getRemainingRequests('r', 5)).toBe(3);
    });

    it('returns 0 when limit exceeded', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed('r', 5, 60000);
      }
      expect(rateLimiter.getRemainingRequests('r', 5)).toBe(0);
    });

    it('returns maxRequests again after clear', () => {
      rateLimiter.isAllowed('r', 5, 60000);
      rateLimiter.clear();
      expect(rateLimiter.getRemainingRequests('r', 5)).toBe(5);
    });
  });

  describe('getTimeUntilReset', () => {
    it('returns 0 when no entry', () => {
      expect(rateLimiter.getTimeUntilReset('none')).toBe(0);
    });

    it('returns positive ms when within window', () => {
      rateLimiter.isAllowed('t', 5, 60000);
      const ms = rateLimiter.getTimeUntilReset('t');
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(60000);
    });
  });

  describe('AI text generation helpers', () => {
    const max = AI_RATE_LIMITS.textGeneration.maxRequests;

    it('isTextGenerationAllowed allows within limit', () => {
      expect(isTextGenerationAllowed()).toBe(true);
    });

    it('isTextGenerationAllowed blocks after limit', () => {
      for (let i = 0; i < max; i++) {
        isTextGenerationAllowed();
      }
      expect(isTextGenerationAllowed()).toBe(false);
    });

    it('getTextGenerationLimitStatus returns remaining and resetInMs', () => {
      const status = getTextGenerationLimitStatus();
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetInMs');
      expect(status.remaining).toBe(max);
      expect(status.resetInMs).toBeGreaterThanOrEqual(0);
    });

    it('getTextGenerationLimitStatus decrements remaining after requests', () => {
      isTextGenerationAllowed();
      const status = getTextGenerationLimitStatus();
      expect(status.remaining).toBe(max - 1);
    });
  });

  describe('AI image generation helpers', () => {
    const max = AI_RATE_LIMITS.imageGeneration.maxRequests;

    it('isImageGenerationAllowed allows within limit', () => {
      expect(isImageGenerationAllowed()).toBe(true);
    });

    it('isImageGenerationAllowed blocks after limit', () => {
      for (let i = 0; i < max; i++) {
        isImageGenerationAllowed();
      }
      expect(isImageGenerationAllowed()).toBe(false);
    });

    it('getImageGenerationLimitStatus returns remaining and resetInMs', () => {
      const status = getImageGenerationLimitStatus();
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetInMs');
      expect(status.remaining).toBe(max);
      expect(status.resetInMs).toBeGreaterThanOrEqual(0);
    });

    it('text and image limits are independent', () => {
      for (let i = 0; i < AI_RATE_LIMITS.textGeneration.maxRequests; i++) {
        isTextGenerationAllowed();
      }
      expect(isTextGenerationAllowed()).toBe(false);
      expect(isImageGenerationAllowed()).toBe(true);
    });
  });
});
