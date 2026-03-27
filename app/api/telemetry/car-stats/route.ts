import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchCarData, fetchLaps, aggregateCarStats } from "@/lib/openf1"
import { cacheGet, cacheSet } from "@/lib/openf1-cache"
import { parseDriverParams } from "@/lib/telemetry-route"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const params = parseDriverParams(request)
  if (params instanceof NextResponse) return params
  const { sessionKey, driverNumber } = params

  const cacheKey = `openf1:car-stats:${sessionKey}:${driverNumber}`
  const cached = cacheGet<ReturnType<typeof aggregateCarStats>>(cacheKey)
  if (cached) {
    return NextResponse.json({ stats: cached })
  }

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
