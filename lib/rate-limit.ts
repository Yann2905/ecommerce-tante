type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;

export function getClientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > 10000) {
    for (const [entryKey, entry] of buckets) if (entry.resetAt <= now) buckets.delete(entryKey);
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count > MAX_REQUESTS) return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  return { allowed: true, retryAfter: 0 };
}
