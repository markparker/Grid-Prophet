import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://www.gridprophets.com"))
  }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress

  if (!email) {
    return NextResponse.redirect(new URL("/join", process.env.NEXT_PUBLIC_APP_URL || "https://www.gridprophets.com"))
  }

  const supabase = await createClient()

  // Check if user exists in database by email
  const { data: player } = await supabase
    .from("players")
    .select("*, groups(name)")
    .eq("email", email)
    .single()

  if (player && player.group_id) {
    // Update last_login and login_method
    await supabase
      .from("players")
      .update({ 
        last_login: new Date().toISOString(),
        login_method: 'clerk'
      })
      .eq("id", player.id)

    // Set session for existing user
    await setSession({
      playerId: player.id,
      groupId: player.group_id,
      playerName: player.name,
      groupName: player.groups?.name || "",
      avatarUrl: user?.imageUrl,
      email: email,
      googleLinked: true,
      isAdmin: player.is_admin || false,
    })

    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL || "https://www.gridprophets.com"))
  }

  // New user or user without a group - send to join page
  return NextResponse.redirect(new URL("/join", process.env.NEXT_PUBLIC_APP_URL || "https://www.gridprophets.com"))
}
