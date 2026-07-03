// Per-chat token-bucket rate limiter. Blocks command floods (DoS + RPC-quota
// burn). Deterministic clock is injectable so tests don't depend on wall time.

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly refillPerMs: number;

  constructor(perMinute: number) {
    this.capacity = Math.max(1, perMinute);
    this.refillPerMs = this.capacity / 60_000;
  }

  /** Returns true if the action is allowed (and consumes a token). */
  allow(key: string, now: number): boolean {
    const b = this.buckets.get(key) ?? { tokens: this.capacity, updatedAt: now };
    const elapsed = Math.max(0, now - b.updatedAt);
    b.tokens = Math.min(this.capacity, b.tokens + elapsed * this.refillPerMs);
    b.updatedAt = now;
    if (b.tokens < 1) {
      this.buckets.set(key, b);
      return false;
    }
    b.tokens -= 1;
    this.buckets.set(key, b);
    return true;
  }
}
