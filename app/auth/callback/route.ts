import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const googleId = user.id
        const email = user.email || ""
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split("@")[0]

        // Check if this Google user already has a player linked
        const { data: existingPlayer } = await supabase
          .from("players")
          .select("*, groups(*)")
          .eq("google_id", googleId)
          .single()

        if (existingPlayer) {
          // Returning user -- restore their session
          await setSession({
            playerId: existingPlayer.id,
            groupId: existingPlayer.group_id,
            playerName: existingPlayer.name,
            groupName: existingPlayer.groups.name,
          })
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        // New Google user -- send them to the join page with their info prefilled
        const params = new URLSearchParams({
          google_id: googleId,
          email: email,
          name: fullName,
        })
        return NextResponse.redirect(`${origin}/?${params.toString()}`)
      }
    }
  }

  // Auth failed -- redirect to home with error
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
