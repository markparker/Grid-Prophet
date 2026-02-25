import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession, setSession } from "@/lib/session"

// GET - list all leagues a player belongs to (by google_id or email)
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const supabase = await createClient()

  // Get current player's google_id
  const { data: currentPlayer } = await supabase
    .from("players")
    .select("google_id, email")
    .eq("id", session.playerId)
    .single()

  if (!currentPlayer) {
    return NextResponse.json({ leagues: [] })
  }

  // Find all players with the same google_id
  let allPlayers: Array<{
    id: string
    name: string
    group_id: string
    avatar_url: string | null
    email: string | null
    google_id: string | null
    groups: { name: string; invite_code: string }
  }> = []

  if (currentPlayer.google_id) {
    const { data } = await supabase
      .from("players")
      .select("*, groups(name, invite_code)")
      .eq("google_id", currentPlayer.google_id)

    allPlayers = data || []
  }

  // If no google linked, just return the current league
  if (allPlayers.length === 0) {
    const { data } = await supabase
      .from("players")
      .select("*, groups(name, invite_code)")
      .eq("id", session.playerId)

    allPlayers = data || []
  }

  const leagues = allPlayers.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    groupId: p.group_id,
    groupName: p.groups.name,
    inviteCode: p.groups.invite_code,
    avatarUrl: p.avatar_url,
    isCurrent: p.id === session.playerId,
  }))

  return NextResponse.json({ leagues })
}

// POST - switch active league
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const { playerId } = body

  if (!playerId) {
    return NextResponse.json({ error: "Player ID required" }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify this player belongs to the same Google user
  const { data: currentPlayer } = await supabase
    .from("players")
    .select("google_id")
    .eq("id", session.playerId)
    .single()

  const { data: targetPlayer } = await supabase
    .from("players")
    .select("*, groups(name)")
    .eq("id", playerId)
    .single()

  if (!targetPlayer) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 })
  }

  // Security check: must share the same google_id
  if (!currentPlayer?.google_id || currentPlayer.google_id !== targetPlayer.google_id) {
    return NextResponse.json({ error: "Unauthorized league switch" }, { status: 403 })
  }

  await setSession({
    playerId: targetPlayer.id,
    groupId: targetPlayer.group_id,
    playerName: targetPlayer.name,
    groupName: targetPlayer.groups.name,
    avatarUrl: targetPlayer.avatar_url || "",
    email: targetPlayer.email || "",
    googleLinked: true,
  })

  return NextResponse.json({ success: true })
}
