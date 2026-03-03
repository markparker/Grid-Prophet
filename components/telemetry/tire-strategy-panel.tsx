"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Circle } from "lucide-react"
import type { OpenF1Stint } from "@/lib/openf1"

const COMPOUND_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  SOFT: { bg: "#FF3333", text: "#FFFFFF", label: "S" },
  MEDIUM: { bg: "#FFC300", text: "#000000", label: "M" },
  HARD: { bg: "#FFFFFF", text: "#000000", label: "H" },
  INTERMEDIATE: { bg: "#39B54A", text: "#FFFFFF", label: "I" },
  WET: { bg: "#0067FF", text: "#FFFFFF", label: "W" },
}

interface Props {
  stints: OpenF1Stint[]
  isLoading: boolean
  error: unknown
  teamColor: string
}

export function TireStrategyPanel({ stints, isLoading, error, teamColor }: Props) {
  const sortedStints = useMemo(
    () => [...stints].sort((a, b) => a.stint_number - b.stint_number),
    [stints]
  )

  const totalLaps = useMemo(() => {
    if (sortedStints.length === 0) return 0
    return Math.max(...sortedStints.map((s) => s.lap_end))
  }, [sortedStints])

  if (error) {
    return (
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <AlertCircle className="h-6 w-6 text-destructive/60" />
          <p className="text-xs text-muted-foreground">Unable to load tire strategy.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Circle className="h-4 w-4" style={{ color: teamColor }} />
            Tire Strategy
          </CardTitle>
          {sortedStints.length > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {sortedStints.length - 1} stop{sortedStints.length - 1 !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : sortedStints.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No tire data available.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Horizontal stint timeline */}
            <div className="flex h-10 w-full gap-0.5 overflow-hidden rounded-md">
              {sortedStints.map((stint) => {
                const compound = COMPOUND_COLORS[stint.compound] ?? COMPOUND_COLORS.MEDIUM
                const widthPercent = totalLaps > 0
                  ? ((stint.lap_end - stint.lap_start + 1) / totalLaps) * 100
                  : 100 / sortedStints.length

                return (
                  <div
                    key={stint.stint_number}
                    className="relative flex items-center justify-center overflow-hidden text-[10px] font-bold transition-opacity hover:opacity-90"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: compound.bg,
                      color: compound.text,
                      minWidth: "24px",
                    }}
                    title={`${stint.compound} — Laps ${stint.lap_start}-${stint.lap_end} (${stint.tyre_age_at_start} laps old at start)`}
                  >
                    {compound.label}
                  </div>
                )
              })}
            </div>

            {/* Stint details */}
            <div className="flex flex-wrap gap-2">
              {sortedStints.map((stint) => {
                const compound = COMPOUND_COLORS[stint.compound] ?? COMPOUND_COLORS.MEDIUM
                const lapCount = stint.lap_end - stint.lap_start + 1

                return (
                  <div
                    key={stint.stint_number}
                    className="flex items-center gap-1.5 rounded-md border border-border/20 bg-secondary/20 px-2 py-1"
                  >
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-sm text-[8px] font-black"
                      style={{ backgroundColor: compound.bg, color: compound.text }}
                    >
                      {compound.label}
                    </span>
                    <span className="font-mono text-[10px] text-foreground">
                      L{stint.lap_start}–{stint.lap_end}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ({lapCount} laps)
                    </span>
                    {stint.tyre_age_at_start > 0 && (
                      <span className="font-mono text-[9px] text-muted-foreground/60">
                        +{stint.tyre_age_at_start} used
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
