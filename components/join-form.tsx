"use client"

import { useState } from "react"
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

export function JoinForm() {
  const [loading, setLoading] = useState(false)

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
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to join group")
        setLoading(false)
        return
      }
      toast.success(`Joined ${data.group.name}!`)
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
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create group")
        setLoading(false)
        return
      }
      if (data.emailSent) {
        toast.success(`Group created! Invite code sent to ${email}`)
      } else {
        toast.success(
          `Group created! Invite code: ${data.group.invite_code} (email could not be sent)`
        )
      }
      window.location.href = "/dashboard"
    } catch {
      toast.error("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <Tabs defaultValue="join">
        <CardHeader className="pb-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join">Join Group</TabsTrigger>
            <TabsTrigger value="create">Create Group</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="join" className="mt-0">
            <CardTitle className="mb-1 text-lg">Join a League</CardTitle>
            <CardDescription className="mb-4">
              Enter your group&apos;s invite code to join.
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
              Start a new prediction league and invite friends.
            </CardDescription>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="create-group">Group Name</Label>
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
  )
}
