"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
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
import { LogOut, HelpCircle } from "lucide-react"

interface JoinFormProps {
  onShowTour?: () => void
}

export function JoinForm({ onShowTour }: JoinFormProps) {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const authError = searchParams.get("error")

  if (authError === "auth_failed") {
    toast.error("Sign in failed. Please try again.")
  }

  async function handleSignOut() {
    await fetch("/api/session", { method: "DELETE" })
    await signOut({ redirectUrl: "/" })
  }

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const inviteCode = (form.get("inviteCode") as string).trim()
    const playerName = (form.get("playerName") as string).trim()
    const email = user?.primaryEmailAddress?.emailAddress || ""

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
          email,
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
    const email = user?.primaryEmailAddress?.emailAddress || ""

    if (!groupName || !playerName || !email) {
      toast.error("Please fill in all fields")
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
      const shareParams = new URLSearchParams({
        code: data.group.invite_code,
        name: data.group.name,
      })
      const shareUrl = `/share?${shareParams.toString()}`
      window.location.href = shareUrl
    } catch (err) {
      console.error("Create league error:", err)
      toast.error("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Show user info if signed in with Clerk */}
      {isSignedIn && user && (
        <Card className="bg-card border-primary/20 border-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={user.firstName || "User"}
                  className="h-9 w-9 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onShowTour && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onShowTour}
                    title="Show tour"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join / Create tabs */}
      <Card className="bg-card border-border">
        <Tabs defaultValue="create" className="w-full">
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
                    defaultValue={user?.firstName || ""}
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
                    defaultValue={user?.firstName || ""}
                    required
                  />
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
