"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function SyncButton() {
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/f1/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Sync failed")
      } else if (data.synced > 0) {
        toast.success(`Synced ${data.synced} race(s)!`)
        router.refresh()
      } else {
        toast.info(data.message || "No new results to sync")
      }
    } catch {
      toast.error("Failed to sync results")
    }
    setSyncing(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      className="gap-1.5"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync Results"}
    </Button>
  )
}
