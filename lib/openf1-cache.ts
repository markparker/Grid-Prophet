interface CacheEntry<T> {
  value: T
  expiresAt: number | null // null = never expires
}

const cache = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL_MS = null // permanent — historical race data is immutable

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
  const effectiveTtl = ttlMs === undefined ? DEFAULT_TTL_MS : ttlMs
  cache.set(key, {
    value,
    expiresAt: effectiveTtl === null ? null : Date.now() + effectiveTtl,
  })
}
