import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchPit } from "@/lib/openf1"
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

  const cacheKey = `openf1:pit:${sessionKey}:${driverNumber}`
  const cached = cacheGet<typeof pits>(cacheKey)
  if (cached) {
    return NextResponse.json({ pits: cached })
  }

  const pits = await fetchPit(sessionKey, driverNumber)
  if (!pits) {
    return NextResponse.json({ pits: [] })
  }

  cacheSet(cacheKey, pits)
  return NextResponse.json({ pits })
}
