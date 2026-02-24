import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, name, inviteCode, playerName } = body

  const supabase = await createClient()

  if (action === "create") {
    if (!name || !playerName) {
      return NextResponse.json({ error: "Group name and player name are required" }, { status: 400 })
    }

    const code = inviteCode || Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({ name, invite_code: code })
      .select()
      .single()

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 })
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({ group_id: group.id, name: playerName })
      .select()
      .single()

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 })
    }

    await setSession({
      playerId: player.id,
      groupId: group.id,
      playerName: player.name,
      groupName: group.name,
    })

    return NextResponse.json({ group, player })
  }

  if (action === "join") {
    if (!inviteCode || !playerName) {
      return NextResponse.json({ error: "Invite code and player name are required" }, { status: 400 })
    }

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select()
      .eq("invite_code", inviteCode.toUpperCase())
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    // Check if player already exists
    const { data: existingPlayer } = await supabase
      .from("players")
      .select()
      .eq("group_id", group.id)
      .eq("name", playerName)
      .single()

    if (existingPlayer) {
      await setSession({
        playerId: existingPlayer.id,
        groupId: group.id,
        playerName: existingPlayer.name,
        groupName: group.name,
      })
      return NextResponse.json({ group, player: existingPlayer })
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({ group_id: group.id, name: playerName })
      .select()
      .single()

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 })
    }

    await setSession({
      playerId: player.id,
      groupId: group.id,
      playerName: player.name,
      groupName: group.name,
    })

    return NextResponse.json({ group, player })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
