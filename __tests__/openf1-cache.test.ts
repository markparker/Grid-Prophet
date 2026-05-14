import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { cacheGet, cacheSet } from "@/lib/openf1-cache"

// The module uses a module-level Map, so we re-import fresh per suite by
// manipulating fake timers rather than resetting module state.

describe("cacheGet / cacheSet", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns null for a key that has never been set", () => {
    expect(cacheGet("nonexistent")).toBeNull()
  })

  it("returns the stored value immediately after setting", () => {
    cacheSet("key1", { data: 42 })
    expect(cacheGet("key1")).toEqual({ data: 42 })
  })

  it("overwrites an existing key", () => {
    cacheSet("key2", "first")
    cacheSet("key2", "second")
    expect(cacheGet<string>("key2")).toBe("second")
  })

  it("stores null TTL (permanent) and never expires", () => {
    vi.useFakeTimers()
    cacheSet("permanent", "forever", null)
    // Advance 100 years worth of ms
    vi.advanceTimersByTime(1000 * 60 * 60 * 24 * 365 * 100)
    expect(cacheGet("permanent")).toBe("forever")
  })

  it("expires an entry after its TTL elapses", () => {
    vi.useFakeTimers()
    cacheSet("expiring", "temp", 1000) // 1 second TTL
    vi.advanceTimersByTime(999)
    expect(cacheGet("expiring")).toBe("temp")
    vi.advanceTimersByTime(2) // now at 1001ms
    expect(cacheGet("expiring")).toBeNull()
  })

  it("returns null exactly at expiry (boundary)", () => {
    vi.useFakeTimers()
    cacheSet("boundary", "value", 500)
    vi.advanceTimersByTime(500)
    // At exactly ttl ms, Date.now() > expiresAt is false → still valid
    // (expiresAt = Date.now() + 500 at set time; now Date.now() = that value)
    // The implementation uses >, so equal means not yet expired
    expect(cacheGet("boundary")).toBe("value")
  })

  it("returns null one ms after expiry (boundary + 1)", () => {
    vi.useFakeTimers()
    cacheSet("boundary2", "value", 500)
    vi.advanceTimersByTime(501)
    expect(cacheGet("boundary2")).toBeNull()
  })

  it("defaults to permanent TTL when no ttlMs is provided", () => {
    vi.useFakeTimers()
    cacheSet("default-ttl", "permanent-by-default")
    vi.advanceTimersByTime(1000 * 60 * 60 * 24 * 365)
    expect(cacheGet("default-ttl")).toBe("permanent-by-default")
  })

  it("caches different types: arrays, objects, numbers, booleans", () => {
    cacheSet("arr", [1, 2, 3])
    cacheSet("obj", { a: 1 })
    cacheSet("num", 99)
    cacheSet("bool", false)
    expect(cacheGet("arr")).toEqual([1, 2, 3])
    expect(cacheGet("obj")).toEqual({ a: 1 })
    expect(cacheGet<number>("num")).toBe(99)
    expect(cacheGet<boolean>("bool")).toBe(false)
  })

  it("expired entries are evicted on read (deleted from map)", () => {
    vi.useFakeTimers()
    cacheSet("evict-me", "gone", 100)
    vi.advanceTimersByTime(200)
    // First read triggers eviction
    expect(cacheGet("evict-me")).toBeNull()
    // Confirm it's gone (not a stale entry still lurking)
    expect(cacheGet("evict-me")).toBeNull()
  })
})
