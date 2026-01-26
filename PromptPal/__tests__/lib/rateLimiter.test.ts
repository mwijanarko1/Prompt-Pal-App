import { rateLimiter } from '@/lib/rateLimiter';

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
});
