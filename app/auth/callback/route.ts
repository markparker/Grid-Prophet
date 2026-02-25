import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { setSession } from "@/lib/session"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")
  const isLinkFlow = searchParams.get("link") === "true"

  if (code) {
    const cookieStore = await cookies()

    // We need to track cookies that Supabase wants to set so we can
    // forward them on the redirect response (cookieStore.set inside
    // a route handler that returns a redirect may not stick).
    const cookiesToForward: {
      name: string
      value: string
      options: Record<string, unknown>
    }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch {
                // ignore -- we forward on the redirect below
              }
              cookiesToForward.push({ name, value, options })
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
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

        // Helper to create a redirect that carries auth cookies
        function redirectWithCookies(url: string) {
          const response = NextResponse.redirect(url)
          for (const { name, value, options } of cookiesToForward) {
            response.cookies.set(name, value, options as Record<string, string>)
          }
          return response
        }

        // If this is a link-account flow from the profile page, redirect back
        if (isLinkFlow && next) {
          return redirectWithCookies(`${origin}${next}?link=true`)
        }

        // Check if this Google user already has a player linked
        const { data: existingPlayer } = await supabase
          .from("players")
          .select("*, groups(*)")
          .eq("google_id", googleId)
          .single()

        if (existingPlayer) {
          const avatarUrl =
            existingPlayer.avatar_url ||
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            ""

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
          return redirectWithCookies(`${origin}/dashboard`)
        }

        // New Google user -- prefill the join form
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
        return redirectWithCookies(`${origin}/?${params.toString()}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
