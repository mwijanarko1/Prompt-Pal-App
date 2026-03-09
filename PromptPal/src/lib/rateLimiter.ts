type RateLimitEntry = {
  timestamps: number[];
};

class RateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();

  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const bucketKey = `${key}:${limit}:${windowMs}`;
    const now = Date.now();
    const entry = this.store.get(bucketKey) ?? { timestamps: [] };
    entry.timestamps = entry.timestamps.filter((timestamp) => now - timestamp < windowMs);

    if (entry.timestamps.length >= limit) {
      this.store.set(bucketKey, entry);
      return false;
    }

    entry.timestamps.push(now);
    this.store.set(bucketKey, entry);
    return true;
  }

  clear(): void {
    this.store.clear();
  }
}

export const rateLimiter = new RateLimiter();
