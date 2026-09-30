type RateLimitEntry = {
  count: number;
  windowStart: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

const requests = new Map<string, RateLimitEntry>();

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const existing = requests.get(identifier);

  if (!existing) {
    requests.set(identifier, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: LIMIT - 1,
      retryAfter: Math.ceil(WINDOW_MS / 1000),
    };
  }

  const elapsed = now - existing.windowStart;

  if (elapsed >= WINDOW_MS) {
    requests.set(identifier, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: LIMIT - 1,
      retryAfter: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (existing.count >= LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(
        (WINDOW_MS - elapsed) / 1000
      ),
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: LIMIT - existing.count,
    retryAfter: Math.ceil(
      (WINDOW_MS - elapsed) / 1000
    ),
  };
}