"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ReprocessButtonProps {
  raceId: string
  round: number
  raceName: string
}

export function ReprocessButton({ raceId, round, raceName }: ReprocessButtonProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  async function handleReprocess() {
    if (!confirm(`Reprocess results for ${raceName}? This will re-fetch from F1 API and recalculate all scores.`)) {
      return
    }

    setLoading(true)
    setStatus("idle")

    try {
      const res = await fetch("/api/admin/reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceId, round }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus("success")
        toast.success(data.message || "Race reprocessed successfully")
        // Reset status after 3 seconds
        setTimeout(() => setStatus("idle"), 3000)
      } else {
        setStatus("error")
        toast.error(data.error || "Failed to reprocess race")
        setTimeout(() => setStatus("idle"), 3000)
      }
    } catch (error) {
      setStatus("error")
      toast.error("Network error - please try again")
      setTimeout(() => setStatus("idle"), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReprocess}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Processing...
        </>
      ) : status === "success" ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" />
          Done
        </>
      ) : status === "error" ? (
        <>
          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
          Failed
        </>
      ) : (
        <>
          <RefreshCw className="h-3.5 w-3.5" />
          Reprocess
        </>
      )}
    </Button>
  )
}
