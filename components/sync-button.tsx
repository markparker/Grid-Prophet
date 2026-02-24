"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function SyncButton({ variant = "default" }: { variant?: "default" | "ghost" | "outline" }) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/f1/sync", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        toast.error("Failed to sync results")
        return
      }

      if (data.synced > 0) {
        toast.success(`Synced ${data.synced} race(s) with latest results!`)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        toast.info(data.message || "Everything is up to date")
      }
    } catch {
      toast.error("Failed to sync results")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      className="gap-2"
    >
      <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
      {syncing ? "Syncing..." : "Sync Results"}
    </Button>
  )
}
