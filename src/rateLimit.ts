/** Fixed-window counter per key. In memory, so it resets on restart and is per instance. */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private max: number,
    private windowMs: number,
    private now: () => number = Date.now,
  ) {}

  /** Counts one use of `key`. Returns false once the key is over its limit. */
  take(key: string): boolean {
    const now = this.now();
    if (this.hits.size > 10_000) {
      for (const [k, h] of this.hits) if (h.resetAt <= now) this.hits.delete(k);
    }
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.max;
  }
}
