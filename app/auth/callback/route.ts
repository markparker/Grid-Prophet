import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"

// This endpoint is hit after Clerk authentication
// Since Clerk handles the UI, this is mostly a fallback/redirect
export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  // Redirect to dashboard - the user was already synced via the webhook
  redirect("/dashboard")
}
