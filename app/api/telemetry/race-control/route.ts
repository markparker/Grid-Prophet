import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchRaceControl } from "@/lib/openf1"
import { cacheGet, cacheSet } from "@/lib/openf1-cache"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionKey = Number(searchParams.get("session_key"))

  if (!sessionKey) {
    return NextResponse.json(
      { error: "Missing session_key" },
      { status: 400 }
    )
  }

  const cacheKey = `openf1:race-control:${sessionKey}`
  const cached = cacheGet<typeof messages>(cacheKey)
  if (cached) {
    return NextResponse.json({ messages: cached })
  }

  const messages = await fetchRaceControl(sessionKey)

  const result = messages || []
  cacheSet(cacheKey, result)
  return NextResponse.json({ messages: result })
}
