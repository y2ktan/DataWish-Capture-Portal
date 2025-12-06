const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

type Key = string;

const buckets = new Map<
  Key,
  {
    count: number;
    windowStart: number;
  }
>();

export function rateLimit(key: Key) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false };
  }

  bucket.count += 1;
  return { allowed: true };
}


