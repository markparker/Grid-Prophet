"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Gauge, AlertCircle } from "lucide-react"
import type { OpenF1Lap } from "@/lib/openf1"

interface Props {
  laps: OpenF1Lap[]
  isLoading: boolean
  error: unknown
  teamColor: string
  laps2?: OpenF1Lap[]
  teamColor2?: string
  driverLabel?: string
  driverLabel2?: string
}

interface SpeedStats {
  bestI1: number | null
  bestI2: number | null
  bestST: number | null
  avgI1: number | null
  avgI2: number | null
  avgST: number | null
}

function computeSpeedStats(laps: OpenF1Lap[]): SpeedStats {
  let bestI1: number | null = null
  let bestI2: number | null = null
  let bestST: number | null = null
  let sumI1 = 0, countI1 = 0
  let sumI2 = 0, countI2 = 0
  let sumST = 0, countST = 0

  for (const lap of laps) {
    if (lap.is_pit_out_lap) continue
    if (lap.i1_speed != null) {
      if (bestI1 === null || lap.i1_speed > bestI1) bestI1 = lap.i1_speed
      sumI1 += lap.i1_speed; countI1++
    }
    if (lap.i2_speed != null) {
      if (bestI2 === null || lap.i2_speed > bestI2) bestI2 = lap.i2_speed
      sumI2 += lap.i2_speed; countI2++
    }
    if (lap.st_speed != null) {
      if (bestST === null || lap.st_speed > bestST) bestST = lap.st_speed
      sumST += lap.st_speed; countST++
    }
  }

  return {
    bestI1, bestI2, bestST,
    avgI1: countI1 > 0 ? Math.round(sumI1 / countI1) : null,
    avgI2: countI2 > 0 ? Math.round(sumI2 / countI2) : null,
    avgST: countST > 0 ? Math.round(sumST / countST) : null,
  }
}

export function SpeedTrapPanel({
  laps, isLoading, error, teamColor,
  laps2, teamColor2, driverLabel, driverLabel2,
}: Props) {
  const isComparing = laps2 && laps2.length > 0

  const { chartData, stats1, stats2 } = useMemo(() => {
    const raceLaps = laps
      .filter((l) => !l.is_pit_out_lap && l.lap_number > 0)
      .sort((a, b) => a.lap_number - b.lap_number)

    const stats1 = computeSpeedStats(raceLaps)

    if (!isComparing) {
      const chartData = raceLaps
        .filter((l) => l.i1_speed != null || l.i2_speed != null || l.st_speed != null)
        .map((l) => ({
          lap: l.lap_number,
          i1_d1: l.i1_speed,
          i2_d1: l.i2_speed,
          st_d1: l.st_speed,
        }))
      return { chartData, stats1, stats2: null }
    }

    const raceLaps2 = laps2
      .filter((l) => !l.is_pit_out_lap && l.lap_number > 0)
      .sort((a, b) => a.lap_number - b.lap_number)

    const stats2 = computeSpeedStats(raceLaps2)

    const d1Map = new Map<number, OpenF1Lap>()
    for (const l of raceLaps) d1Map.set(l.lap_number, l)

    const d2Map = new Map<number, OpenF1Lap>()
    for (const l of raceLaps2) d2Map.set(l.lap_number, l)

    const allLaps = new Set([...d1Map.keys(), ...d2Map.keys()])
    const sortedLaps = Array.from(allLaps).sort((a, b) => a - b)

    const chartData = sortedLaps.map((lap) => {
      const l1 = d1Map.get(lap)
      const l2 = d2Map.get(lap)
      return {
        lap,
        i1_d1: l1?.i1_speed ?? null,
        i2_d1: l1?.i2_speed ?? null,
        st_d1: l1?.st_speed ?? null,
        i1_d2: l2?.i1_speed ?? null,
        i2_d2: l2?.i2_speed ?? null,
        st_d2: l2?.st_speed ?? null,
      }
    })

    return { chartData, stats1, stats2 }
  }, [laps, laps2, isComparing])

  if (error) {
    return (
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <AlertCircle className="h-6 w-6 text-destructive/60" />
          <p className="text-xs text-muted-foreground">Unable to load speed trap data.</p>
        </CardContent>
      </Card>
    )
  }

  const d1Label = driverLabel ?? "Driver 1"
  const d2Label = driverLabel2 ?? "Driver 2"

  return (
    <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Gauge className="h-4 w-4" style={{ color: teamColor }} />
          Speed Traps
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No speed trap data available.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Speed trap chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="lap"
                    tick={{ fontSize: 9, fill: "oklch(0.60 0 0)" }}
                    axisLine={{ stroke: "oklch(0.27 0.005 260)" }}
                    tickLine={false}
                    label={{ value: "Lap", position: "insideBottomRight", offset: -5, fontSize: 9, fill: "oklch(0.50 0 0)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "oklch(0.60 0 0)" }}
                    axisLine={{ stroke: "oklch(0.27 0.005 260)" }}
                    tickLine={false}
                    width={35}
                    domain={["auto", "auto"]}
                    tickFormatter={(v: number) => `${v}`}
                    label={{ value: "km/h", angle: -90, position: "insideLeft", offset: 5, fontSize: 9, fill: "oklch(0.50 0 0)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.17 0.005 260)",
                      border: "1px solid oklch(0.27 0.005 260)",
                      borderRadius: "6px",
                      fontSize: "11px",
                      color: "oklch(0.96 0 0)",
                    }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        i1_d1: `${d1Label} I1`,
                        i2_d1: `${d1Label} I2`,
                        st_d1: `${d1Label} ST`,
                        i1_d2: `${d2Label} I1`,
                        i2_d2: `${d2Label} I2`,
                        st_d2: `${d2Label} ST`,
                      }
                      return [`${value} km/h`, labels[name] ?? name]
                    }}
                    labelFormatter={(label) => `Lap ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    height={24}
                    formatter={(value: string) => {
                      const labels: Record<string, string> = {
                        i1_d1: `${isComparing ? d1Label + " " : ""}I1`,
                        i2_d1: `${isComparing ? d1Label + " " : ""}I2`,
                        st_d1: `${isComparing ? d1Label + " " : ""}ST`,
                        i1_d2: `${d2Label} I1`,
                        i2_d2: `${d2Label} I2`,
                        st_d2: `${d2Label} ST`,
                      }
                      return labels[value] ?? value
                    }}
                    wrapperStyle={{ fontSize: "9px" }}
                  />
                  {/* Driver 1 lines — solid, dashed, dotted */}
                  <Line type="monotone" dataKey="i1_d1" stroke={teamColor} strokeWidth={1.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="i2_d1" stroke={teamColor} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="6 3" />
                  <Line type="monotone" dataKey="st_d1" stroke={teamColor} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="2 2" />
                  {/* Driver 2 lines */}
                  {isComparing && (
                    <>
                      <Line type="monotone" dataKey="i1_d2" stroke={teamColor2} strokeWidth={1.5} dot={false} connectNulls />
                      <Line type="monotone" dataKey="i2_d2" stroke={teamColor2} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="6 3" />
                      <Line type="monotone" dataKey="st_d2" stroke={teamColor2} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="2 2" />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary stats */}
            <div className="flex flex-col gap-2">
              <SpeedStatsRow stats={stats1} teamColor={teamColor} label={isComparing ? driverLabel : undefined} />
              {isComparing && stats2 && (
                <SpeedStatsRow stats={stats2} teamColor={teamColor2 ?? "#888888"} label={driverLabel2} />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SpeedStatsRow({ stats, teamColor, label }: { stats: SpeedStats; teamColor: string; label?: string }) {
  const items = [
    { label: "Best I1", value: stats.bestI1 != null ? `${stats.bestI1} km/h` : "—" },
    { label: "Best I2", value: stats.bestI2 != null ? `${stats.bestI2} km/h` : "—" },
    { label: "Best ST", value: stats.bestST != null ? `${stats.bestST} km/h` : "—" },
    { label: "Avg I1", value: stats.avgI1 != null ? `${stats.avgI1} km/h` : "—" },
    { label: "Avg I2", value: stats.avgI2 != null ? `${stats.avgI2} km/h` : "—" },
    { label: "Avg ST", value: stats.avgST != null ? `${stats.avgST} km/h` : "—" },
  ]

  return (
    <div className="flex items-center gap-2">
      <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: teamColor }} />
      {label && (
        <span className="w-10 shrink-0 text-[9px] font-bold uppercase tracking-wider" style={{ color: teamColor }}>
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col">
            <span className="text-[8px] uppercase tracking-wider text-muted-foreground">{item.label}</span>
            <span className="font-mono text-xs font-bold tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
