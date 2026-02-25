import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession, setSession } from "@/lib/session"

// GET - fetch full profile from DB
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: player, error } = await supabase
    .from("players")
    .select("*, groups(name, invite_code)")
    .eq("id", session.playerId)
    .single()

  if (error || !player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 })
  }

  return NextResponse.json({ player })
}

// PATCH - update profile fields
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const { name, avatarUrl } = body

  const supabase = await createClient()

  const updates: Record<string, string> = {}
  if (name && name.trim()) updates.name = name.trim()
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 })
  }

  const { data: player, error } = await supabase
    .from("players")
    .update(updates)
    .eq("id", session.playerId)
    .select("*, groups(name)")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update session with new info
  await setSession({
    ...session,
    playerName: player.name,
    avatarUrl: player.avatar_url || "",
    email: player.email || "",
    googleLinked: !!player.google_id,
  })

  return NextResponse.json({ player })
}

// POST - link Google account to existing player
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body

  const supabase = await createClient()

  if (action === "link_google") {
    // Get the current Supabase auth user (they just signed in with Google)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No Google session found. Please sign in with Google first." }, { status: 400 })
    }

    const googleId = user.id
    const email = user.email || ""
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      ""

    // Check if this Google account is already linked to another player
    const { data: existingLink } = await supabase
      .from("players")
      .select("id")
      .eq("google_id", googleId)
      .neq("id", session.playerId)
      .single()

    if (existingLink) {
      return NextResponse.json({ error: "This Google account is already linked to another player" }, { status: 409 })
    }

    const updateData: Record<string, string> = { google_id: googleId }
    if (email) updateData.email = email
    if (avatarUrl) updateData.avatar_url = avatarUrl

    const { data: player, error } = await supabase
      .from("players")
      .update(updateData)
      .eq("id", session.playerId)
      .select("*, groups(name)")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await setSession({
      ...session,
      playerName: player.name,
      avatarUrl: player.avatar_url || "",
      email: player.email || email,
      googleLinked: true,
    })

    return NextResponse.json({ player, linked: true })
  }

  if (action === "unlink_google") {
    const { data: player, error } = await supabase
      .from("players")
      .update({ google_id: null })
      .eq("id", session.playerId)
      .select("*, groups(name)")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await setSession({
      ...session,
      googleLinked: false,
    })

    return NextResponse.json({ player, linked: false })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
