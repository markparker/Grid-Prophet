import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"
import { sendInviteCodeEmail, sendLeagueWelcomeEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, name, inviteCode, playerName, email, googleId, avatarUrl } = body

  const supabase = await createClient()

  if (action === "create") {
    if (!name || !playerName) {
      return NextResponse.json({ error: "League name and player name are required" }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required to receive the league invite code" }, { status: 400 })
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

    const playerInsert: Record<string, string | boolean> = { group_id: group.id, name: playerName, last_login: new Date().toISOString() }
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

    try {
      await setSession({
        playerId: player.id,
        groupId: group.id,
        playerName: player.name,
        groupName: group.name,
        avatarUrl: player.avatar_url || "",
        email: player.email || "",
        googleLinked: !!player.google_id,
      })
      console.log("[v0] Session set for player:", player.name, "group:", group.name)
    } catch (sessionError) {
      console.error("[v0] Session set failed:", sessionError)
    }

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
      console.log("[v0] Invite email sent to:", email)
    } catch (emailError) {
      console.error("[v0] Email send failed, group still created:", emailError)
    }

    console.log("[v0] Returning success - invite_code:", group.invite_code, "group:", group.name)
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
      return NextResponse.json({ error: "Invalid invite code. No league found." }, { status: 404 })
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

    const joinInsert: Record<string, string | boolean> = { group_id: group.id, name: playerName, last_login: new Date().toISOString() }
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

    // Send league info email to the new member (non-blocking)
    const joinEmail = player.email || email
    if (joinEmail) {
      sendLeagueWelcomeEmail({
        to: joinEmail,
        playerName: player.name,
        groupName: group.name,
        inviteCode: group.invite_code,
      }).catch(() => {/* ignore email failures */})
    }

    return NextResponse.json({ group, player })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
