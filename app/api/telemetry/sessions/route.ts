import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchSessions } from "@/lib/openf1"
import { cacheGet, cacheSet } from "@/lib/openf1-cache"

const CACHE_KEY = "openf1:sessions:2026:Race"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Check cache — session mappings are cached permanently
  const cached = cacheGet<typeof result>(CACHE_KEY)
  if (cached) {
    return NextResponse.json({ sessions: cached })
  }

  const sessions = await fetchSessions(2026, "Race")
  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sessions: [] })
  }

  const result = sessions.map((s) => ({
    session_key: s.session_key,
    country_name: s.country_name,
    circuit_short_name: s.circuit_short_name,
    location: s.location,
    date_start: s.date_start,
    date_end: s.date_end,
  }))

  // Cache permanently (null TTL = no expiry)
  cacheSet(CACHE_KEY, result, null)

  return NextResponse.json({ sessions: result })
}
