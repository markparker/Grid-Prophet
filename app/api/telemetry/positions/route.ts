import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchPositions, fetchIntervals } from "@/lib/openf1"
import { cacheGet, cacheSet } from "@/lib/openf1-cache"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionKey = Number(searchParams.get("session_key"))
  const driverNumber = Number(searchParams.get("driver_number"))

  if (!sessionKey || !driverNumber) {
    return NextResponse.json(
      { error: "Missing session_key or driver_number" },
      { status: 400 }
    )
  }

  const cacheKey = `openf1:positions:${sessionKey}:${driverNumber}`
  const cached = cacheGet<{ positions: typeof positions; intervals: typeof intervals }>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  // Fetch positions and intervals in parallel
  const [positions, intervals] = await Promise.all([
    fetchPositions(sessionKey, driverNumber),
    fetchIntervals(sessionKey, driverNumber),
  ])

  const result = {
    positions: positions || [],
    intervals: intervals || [],
  }

  cacheSet(cacheKey, result)
  return NextResponse.json(result)
}
