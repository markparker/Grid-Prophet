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
  pitStops: number
  stats2?: CarStatsSummary | null
  teamColor2?: string
  pitStops2?: number
  driverLabel?: string
  driverLabel2?: string
}

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "—"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) return `${mins}:${secs.toFixed(3).padStart(6, "0")}`
  return secs.toFixed(3)
}

function getItems(stats: CarStatsSummary, pitStops: number) {
  return [
    { label: "Top Speed", value: `${stats.topSpeed} km/h`, numeric: stats.topSpeed },
    { label: "Avg Speed", value: `${stats.avgSpeed} km/h`, numeric: stats.avgSpeed },
    { label: "Best Lap", value: formatTime(stats.bestLapTime), numeric: stats.bestLapTime },
    { label: "Pit Stops", value: String(pitStops), numeric: pitStops },
    { label: "Laps", value: String(stats.totalLaps), numeric: stats.totalLaps },
  ]
}

// For comparison, lower is better for time/pit stops, higher for speed/laps
const LOWER_IS_BETTER = new Set(["Best Lap", "Pit Stops"])

function isBetter(label: string, a: number | null, b: number | null): boolean {
  if (a === null || b === null) return false
  if (a === b) return false
  if (LOWER_IS_BETTER.has(label)) return a < b
  return a > b
}

export function CarStatsReadout({
  stats, isLoading, error, teamColor, pitStops,
  stats2, teamColor2, pitStops2, driverLabel, driverLabel2,
}: Props) {
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

  const items1 = getItems(stats, pitStops)
  const isComparing = stats2 != null
  const items2 = isComparing ? getItems(stats2, pitStops2 ?? 0) : null

  // Single-driver mode
  if (!isComparing) {
    return (
      <Card
        className="border-border/30 bg-card/80 backdrop-blur-sm"
        style={{ borderTopColor: teamColor, borderTopWidth: "2px" }}
      >
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {items1.map((item) => (
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

  // Comparison mode — dual stat bars
  return (
    <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
      <CardContent className="py-3">
        <div className="flex flex-col gap-2">
          {/* Driver 1 row */}
          <div className="flex items-center gap-3">
            <div
              className="w-1 self-stretch rounded-full"
              style={{ backgroundColor: teamColor }}
            />
            {driverLabel && (
              <span className="w-10 shrink-0 text-[9px] font-bold uppercase tracking-wider" style={{ color: teamColor }}>
                {driverLabel}
              </span>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {items1.map((item, i) => (
                <div key={item.label} className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                  <span className={`font-mono text-sm tabular-nums ${isBetter(item.label, item.numeric, items2![i].numeric) ? "font-bold" : "text-muted-foreground"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Driver 2 row */}
          <div className="flex items-center gap-3">
            <div
              className="w-1 self-stretch rounded-full"
              style={{ backgroundColor: teamColor2 }}
            />
            {driverLabel2 && (
              <span className="w-10 shrink-0 text-[9px] font-bold uppercase tracking-wider" style={{ color: teamColor2 }}>
                {driverLabel2}
              </span>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {items2!.map((item, i) => (
                <div key={item.label} className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                  <span className={`font-mono text-sm tabular-nums ${isBetter(item.label, item.numeric, items1[i].numeric) ? "font-bold" : "text-muted-foreground"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
