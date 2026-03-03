"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import type { CarStatsSummary } from "@/lib/openf1"

interface Props {
  stats: CarStatsSummary | null
  isLoading: boolean
  error: unknown
  teamColor: string
}

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "—"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) return `${mins}:${secs.toFixed(3).padStart(6, "0")}`
  return secs.toFixed(3)
}

export function CarStatsReadout({ stats, isLoading, error, teamColor }: Props) {
  if (error) {
    return (
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex items-center gap-2 py-3">
          <AlertCircle className="h-4 w-4 text-destructive/60" />
          <span className="text-xs text-muted-foreground">Unable to load car stats.</span>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="py-3">
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const items = [
    { label: "Top Speed", value: `${stats.topSpeed} km/h` },
    { label: "Avg Speed", value: `${stats.avgSpeed} km/h` },
    { label: "Best Lap", value: formatTime(stats.bestLapTime) },
    { label: "DRS", value: `${stats.drsActivations}x` },
    { label: "Laps", value: String(stats.totalLaps) },
  ]

  return (
    <Card
      className="border-border/30 bg-card/80 backdrop-blur-sm"
      style={{ borderTopColor: teamColor, borderTopWidth: "2px" }}
    >
      <CardContent className="py-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
              <span className="font-mono text-sm font-bold tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
