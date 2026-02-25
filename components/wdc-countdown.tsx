"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"

interface Props {
  lockDate: string // ISO string -- qualifying start of first race
}

function getTimeLeft(lockDate: string) {
  const diff = new Date(lockDate).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export function WdcCountdown({ lockDate }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(lockDate))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeLeft(getTimeLeft(lockDate))
    const interval = setInterval(() => {
      const t = getTimeLeft(lockDate)
      setTimeLeft(t)
    }, 1000)
    return () => clearInterval(interval)
  }, [lockDate])

  if (!mounted) return null

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
        <Lock className="h-4 w-4 text-destructive flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-destructive">Predictions Locked</p>
          <p className="text-xs text-muted-foreground">The 2026 season has begun. WDC predictions are now closed.</p>
        </div>
      </div>
    )
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ]

  const urgency = timeLeft.days === 0 && timeLeft.hours < 6

  return (
    <div className={cn(
      "rounded-lg border px-4 py-3",
      urgency
        ? "border-primary/50 bg-primary/10"
        : "border-border bg-card"
    )}>
      <p className={cn(
        "mb-2 text-xs font-medium uppercase tracking-wider",
        urgency ? "text-primary" : "text-muted-foreground"
      )}>
        Predictions lock when qualifying begins
      </p>
      <div className="flex items-center gap-3">
        {units.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <span className={cn(
              "font-mono text-2xl font-bold tabular-nums",
              urgency ? "text-primary" : "text-foreground"
            )}>
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
        <div className={cn(
          "ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
          urgency
            ? "bg-primary/20 text-primary"
            : "bg-secondary text-muted-foreground"
        )}>
          {urgency ? "Closing soon" : "Open"}
        </div>
      </div>
    </div>
  )
}
