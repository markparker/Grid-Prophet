"use client"

import { useEffect, useState } from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface League {
  playerId: string
  playerName: string
  groupId: string
  groupName: string
  inviteCode: string
  isCurrent: boolean
}

export function LeagueSwitcher({ currentGroupName }: { currentGroupName: string }) {
  const [leagues, setLeagues] = useState<League[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    async function fetchLeagues() {
      setLoading(true)
      try {
        const res = await fetch("/api/leagues")
        const data = await res.json()
        if (res.ok) {
          setLeagues(data.leagues || [])
        }
      } catch {
        // Silently fail -- just show current league
      } finally {
        setLoading(false)
      }
    }
    fetchLeagues()
  }, [])

  async function switchLeague(playerId: string) {
    setSwitching(true)
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      })
      if (res.ok) {
        toast.success("Switched league!")
        window.location.href = "/dashboard"
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to switch league")
      }
    } catch {
      toast.error("Failed to switch league")
    } finally {
      setSwitching(false)
    }
  }

  // Only show switcher if user has more than 1 league
  if (loading || leagues.length <= 1) {
    return (
      <span className="text-xs text-muted-foreground truncate max-w-32">
        {currentGroupName}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Switch league"
      >
        <span className="truncate max-w-32">{currentGroupName}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
            <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Your Leagues
            </p>
            {leagues.map((league) => (
              <button
                key={league.playerId}
                onClick={() => {
                  if (!league.isCurrent) switchLeague(league.playerId)
                  setOpen(false)
                }}
                disabled={switching}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-2 text-sm transition-colors",
                  league.isCurrent
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{league.groupName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {league.inviteCode}
                  </span>
                </div>
                {league.isCurrent && <Check className="h-4 w-4 text-primary" />}
                {switching && !league.isCurrent && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
