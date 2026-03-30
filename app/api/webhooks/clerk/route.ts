import { Webhook } from "svix"
import { WebhookEvent } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!SIGNING_SECRET) {
    throw new Error("Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local")
  }

  const wh = new Webhook(SIGNING_SECRET)
  const evt: WebhookEvent = await req.json()
  const { id } = evt.data
  const eventType = evt.type

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const { id: clerkUserId, email_addresses, first_name, last_name, image_url } = evt.data

      if (!email_addresses || email_addresses.length === 0) {
        return Response.json({ error: "No email found" }, { status: 400 })
      }

      const email = email_addresses[0].email_address
      const name = [first_name, last_name].filter(Boolean).join(" ") || email.split("@")[0]

      const supabase = await createClient()

      // Check if user already exists in our database
      const { data: existingPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("email", email)
        .maybeSingle()

      if (existingPlayer) {
        // Update existing user
        await supabase
          .from("players")
          .update({
            name,
            avatar_url: image_url || undefined,
            last_login: new Date().toISOString(),
            login_method: "clerk",
          })
          .eq("id", existingPlayer.id)
      } else {
        // Create new player without a group (they can join via invite code)
        await supabase.from("players").insert({
          email,
          name,
          avatar_url: image_url || undefined,
          last_login: new Date().toISOString(),
          login_method: "clerk",
        })
      }

      return Response.json({ success: true }, { status: 200 })
    }

    return Response.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error("Webhook error:", err)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
