import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"

export async function POST(request: Request) {
  try {
    const { email, name, avatarUrl } = await request.json()

    if (!email) {
      return NextResponse.json({ redirect: "join" })
    }

    const supabase = await createClient()

    // Check if user exists in database by email
    const { data: player } = await supabase
      .from("players")
      .select("*, groups(name)")
      .eq("email", email)
      .single()

    if (player && player.group_id) {
      // Update last_login and login_method. Sign-in should still succeed if
      // this fails, but it must not fail silently: a check constraint rejected
      // every one of these writes for months, and the discarded error meant
      // nobody noticed last_login was never being recorded.
      const { error: touchError } = await supabase
        .from("players")
        .update({
          last_login: new Date().toISOString(),
          login_method: 'clerk',
          avatar_url: avatarUrl || player.avatar_url,
        })
        .eq("id", player.id)

      if (touchError) {
        console.error("[auth] failed to record sign-in for", player.id, touchError.message)
      }

      // Set session for existing user
      await setSession({
        playerId: player.id,
        groupId: player.group_id,
        playerName: player.name,
        groupName: player.groups?.name || "",
        avatarUrl: avatarUrl || player.avatar_url,
        email: email,
        googleLinked: true,
        isAdmin: player.is_admin || false,
      })

      return NextResponse.json({ redirect: "dashboard" })
    }

    // New user or user without a group - send to join page
    return NextResponse.json({ redirect: "join" })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ redirect: "join" })
  }
}
