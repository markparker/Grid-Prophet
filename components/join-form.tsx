"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function JoinForm() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const searchParams = useSearchParams()

  // Prefill from Google OAuth callback
  const googleId = searchParams.get("google_id") || ""
  const googleEmail = searchParams.get("email") || ""
  const googleName = searchParams.get("name") || ""
  const googleAvatarUrl = searchParams.get("avatar_url") || ""
  const authError = searchParams.get("error")

  useEffect(() => {
    if (authError === "auth_failed") {
      toast.error("Google sign-in failed. Please try again.")
    }
    if (googleId) {
      toast.info("Signed in with Google! Now create or join a prediction league.")
    }
  }, [authError, googleId])

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error("Failed to start Google sign-in")
      setGoogleLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const inviteCode = (form.get("inviteCode") as string).trim()
    const playerName = (form.get("playerName") as string).trim()

    if (!inviteCode || !playerName) {
      toast.error("Please fill in all fields")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          inviteCode,
          playerName,
          googleId: googleId || undefined,
          email: googleEmail || undefined,
          avatarUrl: googleAvatarUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to join league")
        setLoading(false)
        return
      }
      toast.success(`Joined league: ${data.group.name}!`)
      window.location.href = "/dashboard"
    } catch {
      toast.error("Something went wrong")
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const groupName = (form.get("groupName") as string).trim()
    const playerName = (form.get("playerName") as string).trim()

    if (!groupName || !playerName) {
      toast.error("Please fill in all fields")
      setLoading(false)
      return
    }

    const email = (form.get("email") as string).trim()

    if (!email) {
      toast.error("Please enter your email to receive the invite code")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: groupName,
          playerName,
          email,
          googleId: googleId || undefined,
          avatarUrl: googleAvatarUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create league")
        setLoading(false)
        return
      }
      if (data.emailSent) {
        toast.success(`League created! Invite code sent to ${email}`)
      } else {
        toast.success(
          `League created! Invite code: ${data.group.invite_code} (email could not be sent)`
        )
      }
      window.location.href = "/dashboard"
    } catch {
      toast.error("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Google Sign-In for returning users */}
      {!googleId && (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground text-center">
                Already in a prediction league? Sign back in instantly.
              </p>
              <Button
                variant="outline"
                className="w-full gap-3"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {googleLoading ? "Redirecting..." : "Sign in with Google"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Google account info if signed in */}
      {googleId && (
        <Card className="bg-card border-primary/20 border-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {googleName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{googleName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {googleEmail}
                </p>
              </div>
              <span className="text-xs text-primary font-medium shrink-0">
                Google connected
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join / Create tabs */}
      <Card className="bg-card border-border">
        <Tabs defaultValue="join">
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Join League</TabsTrigger>
              <TabsTrigger value="create">Create League</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="join" className="mt-0">
              <CardTitle className="mb-1 text-lg">Join a League</CardTitle>
              <CardDescription className="mb-4">
                Enter your league&apos;s invite code to join.
              </CardDescription>
              <form onSubmit={handleJoin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="join-code">Invite Code</Label>
                  <Input
                    id="join-code"
                    name="inviteCode"
                    placeholder="e.g., ABC123"
                    className="font-mono uppercase"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="join-name">Your Name</Label>
                  <Input
                    id="join-name"
                    name="playerName"
                    placeholder="e.g., Lewis"
                    defaultValue={googleName}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Joining..." : "Join League"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="create" className="mt-0">
              <CardTitle className="mb-1 text-lg">Create a League</CardTitle>
              <CardDescription className="mb-4">
                Start a new prediction league and invite your friends.
              </CardDescription>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-group">League Name</Label>
                  <Input
                    id="create-group"
                    name="groupName"
                    placeholder="e.g., Paddock Pals"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-name">Your Name</Label>
                  <Input
                    id="create-name"
                    name="playerName"
                    placeholder="e.g., Lewis"
                    defaultValue={googleName}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-email">Your Email</Label>
                  <Input
                    id="create-email"
                    name="email"
                    type="email"
                    placeholder="e.g., lewis@example.com"
                    defaultValue={googleEmail}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The invite code will be emailed to you.
                  </p>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create League"}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
