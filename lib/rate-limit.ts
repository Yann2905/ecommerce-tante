import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

type Entry = { count: number; resetAt: number };
const localBuckets = new Map<string, Entry>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;

const redisConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const distributedLimiter = redisConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '10 m'),
      analytics: true,
      prefix: 'emmaashop:ratelimit:orders',
    })
  : null;

export function getClientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function localLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (localBuckets.size > 10000) {
    for (const [entryKey, entry] of localBuckets) if (entry.resetAt <= now) localBuckets.delete(entryKey);
  }
  const current = localBuckets.get(key);
  if (!current || current.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  return current.count > MAX_REQUESTS
    ? { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
    : { allowed: true, retryAfter: 0 };
}

export async function checkRateLimit(key: string): Promise<{ allowed: boolean; retryAfter: number }> {
  if (!distributedLimiter) return localLimit(key);
  try {
    const result = await distributedLimiter.limit(key);
    return { allowed: result.success, retryAfter: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) };
  } catch {
    // Un incident Upstash ne doit pas rendre le checkout inutilisable.
    return localLimit(key);
  }
}
