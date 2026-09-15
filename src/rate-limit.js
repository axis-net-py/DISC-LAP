export function createFixedWindowLimiter({ limit = 8, windowMs = 60_000 } = {}) {
  const buckets = new Map();
  return {
    consume(key) {
      const now = Date.now();
      const current = buckets.get(key);
      if (!current || current.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    }
  };
}
