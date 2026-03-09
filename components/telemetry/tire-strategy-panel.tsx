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
  stints2?: OpenF1Stint[]
  teamColor2?: string
  driverLabel?: string
  driverLabel2?: string
}

function StintTimeline({
  stints,
  totalLaps,
  teamColor,
  driverLabel,
}: {
  stints: OpenF1Stint[]
  totalLaps: number
  teamColor: string
  driverLabel?: string
}) {
  const sorted = [...stints].sort((a, b) => a.stint_number - b.stint_number)

  return (
    <div className="flex flex-col gap-1">
      {driverLabel && (
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: teamColor }}>
          {driverLabel}
        </span>
      )}
      <div className="flex h-10 w-full gap-0.5 overflow-hidden rounded-md">
        {sorted.map((stint) => {
          const compound = COMPOUND_COLORS[stint.compound] ?? COMPOUND_COLORS.MEDIUM
          const widthPercent = totalLaps > 0
            ? ((stint.lap_end - stint.lap_start + 1) / totalLaps) * 100
            : 100 / sorted.length

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
    </div>
  )
}

function StintDetails({ stints }: { stints: OpenF1Stint[] }) {
  const sorted = [...stints].sort((a, b) => a.stint_number - b.stint_number)

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((stint) => {
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
  )
}

export function TireStrategyPanel({
  stints, isLoading, error, teamColor,
  stints2, teamColor2, driverLabel, driverLabel2,
}: Props) {
  const isComparing = stints2 && stints2.length > 0

  const sortedStints = useMemo(
    () => [...stints].sort((a, b) => a.stint_number - b.stint_number),
    [stints]
  )

  const sortedStints2 = useMemo(
    () => (isComparing ? [...stints2].sort((a, b) => a.stint_number - b.stint_number) : []),
    [stints2, isComparing]
  )

  const totalLaps = useMemo(() => {
    const max1 = sortedStints.length > 0 ? Math.max(...sortedStints.map((s) => s.lap_end)) : 0
    const max2 = sortedStints2.length > 0 ? Math.max(...sortedStints2.map((s) => s.lap_end)) : 0
    return Math.max(max1, max2)
  }, [sortedStints, sortedStints2])

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
          {!isComparing && sortedStints.length > 0 && (
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
            {/* Stint timelines */}
            <StintTimeline
              stints={sortedStints}
              totalLaps={totalLaps}
              teamColor={teamColor}
              driverLabel={isComparing ? driverLabel : undefined}
            />
            {isComparing && (
              <StintTimeline
                stints={sortedStints2}
                totalLaps={totalLaps}
                teamColor={teamColor2 ?? "#888888"}
                driverLabel={driverLabel2}
              />
            )}

            {/* Stint details */}
            {!isComparing ? (
              <StintDetails stints={sortedStints} />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: teamColor }} />
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase" style={{ color: teamColor }}>
                      {driverLabel ?? "Driver 1"} — {sortedStints.length - 1} stop{sortedStints.length - 1 !== 1 ? "s" : ""}
                    </span>
                    <StintDetails stints={sortedStints} />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: teamColor2 }} />
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase" style={{ color: teamColor2 }}>
                      {driverLabel2 ?? "Driver 2"} — {sortedStints2.length - 1} stop{sortedStints2.length - 1 !== 1 ? "s" : ""}
                    </span>
                    <StintDetails stints={sortedStints2} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
