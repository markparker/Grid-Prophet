import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"
import { sendInviteCodeEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, name, inviteCode, playerName, email, googleId, avatarUrl } = body

  const supabase = await createClient()

  if (action === "create") {
    if (!name || !playerName) {
      return NextResponse.json({ error: "Group name and player name are required" }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required to receive the invite code" }, { status: 400 })
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

    const playerInsert: Record<string, string> = { group_id: group.id, name: playerName }
    if (googleId) playerInsert.google_id = googleId
    if (email) playerInsert.email = email
    if (avatarUrl) playerInsert.avatar_url = avatarUrl

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert(playerInsert)
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
      avatarUrl: player.avatar_url || "",
      email: player.email || "",
      googleLinked: !!player.google_id,
    })

    // Send invite code email (non-blocking -- don't fail group creation if email fails)
    let emailSent = false
    try {
      await sendInviteCodeEmail({
        to: email,
        groupName: group.name,
        inviteCode: group.invite_code,
        creatorName: player.name,
      })
      emailSent = true
    } catch (emailError) {
      console.error("Email send failed, group still created:", emailError)
    }

    return NextResponse.json({ group, player, emailSent })
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
        avatarUrl: existingPlayer.avatar_url || "",
        email: existingPlayer.email || "",
        googleLinked: !!existingPlayer.google_id,
      })
      return NextResponse.json({ group, player: existingPlayer })
    }

    const joinInsert: Record<string, string> = { group_id: group.id, name: playerName }
    if (googleId) joinInsert.google_id = googleId
    if (email) joinInsert.email = email
    if (avatarUrl) joinInsert.avatar_url = avatarUrl

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert(joinInsert)
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
      avatarUrl: player.avatar_url || "",
      email: player.email || "",
      googleLinked: !!player.google_id,
    })

    return NextResponse.json({ group, player })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
