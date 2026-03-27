import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchPositions, fetchIntervals } from "@/lib/openf1"
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

  const cacheKey = `openf1:positions:${sessionKey}:${driverNumber}`
  const cached = cacheGet<{ positions: unknown[]; intervals: unknown[] }>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

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
