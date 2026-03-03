import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchStints } from "@/lib/openf1"
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

  const cacheKey = `openf1:stints:${sessionKey}:${driverNumber}`
  const cached = cacheGet<typeof stints>(cacheKey)
  if (cached) {
    return NextResponse.json({ stints: cached })
  }

  const stints = await fetchStints(sessionKey, driverNumber)
  if (!stints) {
    return NextResponse.json({ stints: [] })
  }

  cacheSet(cacheKey, stints)
  return NextResponse.json({ stints })
}
