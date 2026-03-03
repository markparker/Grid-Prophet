interface CacheEntry<T> {
  value: T
  expiresAt: number | null // null = never expires
}

const cache = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs?: number | null): void {
  cache.set(key, {
    value,
    expiresAt: ttlMs === null ? null : Date.now() + (ttlMs ?? DEFAULT_TTL_MS),
  })
}
