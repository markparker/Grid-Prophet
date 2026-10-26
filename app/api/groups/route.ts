import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"
import { sendInviteCodeEmail, sendLeagueWelcomeEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, name, inviteCode, playerName, email, avatarUrl } = body

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

    const playerInsert: Record<string, string | boolean> = { group_id: group.id, name: playerName, last_login: new Date().toISOString(), login_method: 'clerk' }
    if (email) playerInsert.email = email
    if (avatarUrl) playerInsert.avatar_url = avatarUrl

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert(playerInsert)
      .select()
      .single()

    if (playerError) {
      // The group row was already inserted above. Without this the failed
      // attempt leaves an empty group behind, and retrying makes another one —
      // a broken sign-up left nine orphaned groups before this was fixed.
      await supabase.from("groups").delete().eq("id", group.id)
      console.error("[league] player insert failed, rolled back group:", playerError.message)
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
        googleLinked: false,
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

    // Identity is decided by the signed-in account, not by the typed name.
    // Matching on name alone meant anyone holding the invite code could type an
    // existing member's name and be handed that member's session, predictions
    // and score.
    const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase()
    const signedInEmail = normalize(email)

    const { data: members } = await supabase
      .from("players")
      .select()
      .eq("group_id", group.id)

    const roster = members || []

    // Already a member under this account: sign straight back in, whatever name
    // was typed. Without this, players whose row predates Clerk never get their
    // email attached and have to re-enter the invite code on every visit.
    const byEmail = signedInEmail
      ? roster.find((m) => normalize(m.email) === signedInEmail)
      : undefined

    if (byEmail) {
      await setSession({
        playerId: byEmail.id,
        groupId: group.id,
        playerName: byEmail.name,
        groupName: group.name,
        avatarUrl: avatarUrl || byEmail.avatar_url || "",
        email: byEmail.email || "",
        googleLinked: !!byEmail.google_id,
      })
      return NextResponse.json({ group, player: byEmail })
    }

    const byName = roster.find((m) => normalize(m.name) === normalize(playerName))

    if (byName) {
      // Claimed by someone else's account — refuse rather than hand over the session.
      if (normalize(byName.email) && normalize(byName.email) !== signedInEmail) {
        return NextResponse.json(
          { error: "That name is already taken in this league. Please choose a different one." },
          { status: 409 }
        )
      }

      // An unclaimed slot from before sign-in existed: attach this account to it.
      const { data: claimed } = await supabase
        .from("players")
        .update({
          email: email || byName.email,
          avatar_url: avatarUrl || byName.avatar_url,
          login_method: 'clerk',
          last_login: new Date().toISOString(),
        })
        .eq("id", byName.id)
        .select()
        .single()

      const player = claimed || byName
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

    const joinInsert: Record<string, string | boolean> = { group_id: group.id, name: playerName, last_login: new Date().toISOString(), login_method: 'clerk' }
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
