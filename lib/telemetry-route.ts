import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { cacheGet, cacheSet } from "@/lib/openf1-cache"

/**
 * Parses and validates the shared session_key + driver_number query params.
 * Returns the parsed numbers, or a 400 error response if either is missing.
 */
export function parseDriverParams(
  request: NextRequest
): { sessionKey: number; driverNumber: number } | NextResponse {
  const { searchParams } = new URL(request.url)
  const sessionKey = Number(searchParams.get("session_key"))
  const driverNumber = Number(searchParams.get("driver_number"))
  if (!sessionKey || !driverNumber) {
    return NextResponse.json(
      { error: "Missing session_key or driver_number" },
      { status: 400 }
    )
  }
  return { sessionKey, driverNumber }
}

/**
 * Factory for simple driver telemetry GET routes that:
 *   1. Require auth
 *   2. Accept session_key + driver_number params
 *   3. Cache results permanently
 *   4. Return { [responseKey]: data }
 *
 * Usage:
 *   export const GET = createDriverTelemetryRoute(
 *     "laps",            // cache key prefix & used in openf1:laps:...
 *     "laps",            // JSON response key
 *     fetchLaps          // (sessionKey, driverNumber) => Promise<T[] | null>
 *   )
 */
export function createDriverTelemetryRoute<T>(
  cachePrefix: string,
  responseKey: string,
  fetchFn: (sessionKey: number, driverNumber: number) => Promise<T[] | null>
) {
  return async function GET(request: NextRequest) {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const params = parseDriverParams(request)
    if (params instanceof NextResponse) return params
    const { sessionKey, driverNumber } = params

    const cacheKey = `openf1:${cachePrefix}:${sessionKey}:${driverNumber}`
    const cached = cacheGet<T[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ [responseKey]: cached })
    }

    const data = await fetchFn(sessionKey, driverNumber)
    const result = data ?? []
    cacheSet(cacheKey, result)
    return NextResponse.json({ [responseKey]: result })
  }
}
