"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function JoinForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Join form state
  const [joinCode, setJoinCode] = useState("")
  const [joinName, setJoinName] = useState("")

  // Create form state
  const [createGroupName, setCreateGroupName] = useState("")
  const [createName, setCreateName] = useState("")

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCode.trim() || !joinName.trim()) return
    setLoading(true)

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          inviteCode: joinCode.trim(),
          playerName: joinName.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to join group")
        return
      }

      toast.success(`Joined ${data.group.name}!`)
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createGroupName.trim() || !createName.trim()) return
    setLoading(true)

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          groupName: createGroupName.trim(),
          playerName: createName.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create group")
        return
      }

      toast.success(
        `Group created! Share this invite code: ${data.inviteCode}`,
        { duration: 10000 }
      )
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full border-border bg-card">
      <CardContent className="p-0">
        <Tabs defaultValue="join" className="w-full">
          <TabsList className="w-full rounded-b-none border-b border-border bg-secondary/50">
            <TabsTrigger value="join" className="flex-1 text-xs font-medium uppercase tracking-wider">
              Join Group
            </TabsTrigger>
            <TabsTrigger value="create" className="flex-1 text-xs font-medium uppercase tracking-wider">
              Create Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="join" className="p-6">
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="joinCode" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Invite Code
                </Label>
                <Input
                  id="joinCode"
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono text-lg tracking-widest uppercase bg-background"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="joinName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Your Name
                </Label>
                <Input
                  id="joinName"
                  placeholder="Enter your display name"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  maxLength={30}
                  className="bg-background"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Join Group
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="create" className="p-6">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="createGroupName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Group Name
                </Label>
                <Input
                  id="createGroupName"
                  placeholder='e.g. "The Grid Gang"'
                  value={createGroupName}
                  onChange={(e) => setCreateGroupName(e.target.value)}
                  maxLength={50}
                  className="bg-background"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="createName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Your Name
                </Label>
                <Input
                  id="createName"
                  placeholder="Enter your display name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  maxLength={30}
                  className="bg-background"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Group
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
