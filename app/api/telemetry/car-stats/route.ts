import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchCarData, fetchLaps, aggregateCarStats } from "@/lib/openf1"
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

  const cacheKey = `openf1:car-stats:${sessionKey}:${driverNumber}`
  const cached = cacheGet<typeof stats>(cacheKey)
  if (cached) {
    return NextResponse.json({ stats: cached })
  }

  // Fetch car data and laps in parallel for aggregation
  const [carData, laps] = await Promise.all([
    fetchCarData(sessionKey, driverNumber),
    fetchLaps(sessionKey, driverNumber),
  ])

  if (!carData || carData.length === 0) {
    return NextResponse.json({ stats: null })
  }

  const stats = aggregateCarStats(carData, laps)

  cacheSet(cacheKey, stats)
  return NextResponse.json({ stats })
}
