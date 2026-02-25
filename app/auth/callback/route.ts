import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")
  const isLinkFlow = searchParams.get("link") === "true"

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

        // If this is a link-account flow from the profile page, redirect back to profile
        if (isLinkFlow && next) {
          return NextResponse.redirect(`${origin}${next}?link=true`)
        }

        // Check if this Google user already has a player linked
        const { data: existingPlayer } = await supabase
          .from("players")
          .select("*, groups(*)")
          .eq("google_id", googleId)
          .single()

        if (existingPlayer) {
          // Returning user -- restore their session
          const avatarUrl =
            existingPlayer.avatar_url ||
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            ""

          // Update avatar from Google if player doesn't have one yet
          if (!existingPlayer.avatar_url && avatarUrl) {
            await supabase
              .from("players")
              .update({ avatar_url: avatarUrl })
              .eq("id", existingPlayer.id)
          }

          await setSession({
            playerId: existingPlayer.id,
            groupId: existingPlayer.group_id,
            playerName: existingPlayer.name,
            groupName: existingPlayer.groups.name,
            avatarUrl: avatarUrl,
            email: existingPlayer.email || email,
            googleLinked: true,
          })
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        // New Google user -- send them to the join page with their info prefilled
        const avatarFromGoogle =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          ""
        const params = new URLSearchParams({
          google_id: googleId,
          email: email,
          name: fullName,
          avatar_url: avatarFromGoogle,
        })
        return NextResponse.redirect(`${origin}/?${params.toString()}`)
      }
    }
  }

  // Auth failed -- redirect to home with error
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
