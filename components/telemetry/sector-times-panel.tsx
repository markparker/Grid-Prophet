"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts"
import { Timer, AlertCircle } from "lucide-react"
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

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined || seconds <= 0) return "—"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) return `${mins}:${secs.toFixed(3).padStart(6, "0")}`
  return secs.toFixed(3)
}

function processLaps(laps: OpenF1Lap[]) {
  const raceLaps = laps
    .filter((l) => !l.is_pit_out_lap && l.lap_number > 0)
    .sort((a, b) => a.lap_number - b.lap_number)

  let bestS1 = Infinity
  let bestS2 = Infinity
  let bestS3 = Infinity
  let bestLap = Infinity

  for (const lap of raceLaps) {
    if (lap.duration_sector_1 && lap.duration_sector_1 < bestS1) bestS1 = lap.duration_sector_1
    if (lap.duration_sector_2 && lap.duration_sector_2 < bestS2) bestS2 = lap.duration_sector_2
    if (lap.duration_sector_3 && lap.duration_sector_3 < bestS3) bestS3 = lap.duration_sector_3
    if (lap.lap_duration && lap.lap_duration < bestLap) bestLap = lap.lap_duration
  }

  return { raceLaps, bestS1, bestS2, bestS3, bestLap }
}

export function SectorTimesPanel({
  laps, isLoading, error, teamColor,
  laps2, teamColor2, driverLabel, driverLabel2,
}: Props) {
  const isComparing = laps2 && laps2.length > 0

  const d1 = useMemo(() => processLaps(laps), [laps])
  const d2 = useMemo(() => (isComparing ? processLaps(laps2) : null), [laps2, isComparing])

  // Merged chart data for lap time comparison
  const { chartData, deltaData } = useMemo(() => {
    const d1Map = new Map<number, number>()
    for (const l of d1.raceLaps) {
      if (l.lap_duration && l.lap_duration > 0) d1Map.set(l.lap_number, l.lap_duration)
    }

    if (!isComparing || !d2) {
      const chartData = Array.from(d1Map.entries()).map(([lap, time]) => ({ lap, time1: time }))
      return { chartData, deltaData: [] }
    }

    const d2Map = new Map<number, number>()
    for (const l of d2.raceLaps) {
      if (l.lap_duration && l.lap_duration > 0) d2Map.set(l.lap_number, l.lap_duration)
    }

    const allLaps = new Set([...d1Map.keys(), ...d2Map.keys()])
    const sortedLaps = Array.from(allLaps).sort((a, b) => a - b)

    const chartData = sortedLaps.map((lap) => ({
      lap,
      time1: d1Map.get(lap) ?? null,
      time2: d2Map.get(lap) ?? null,
    }))

    const deltaData = sortedLaps
      .filter((lap) => d1Map.has(lap) && d2Map.has(lap))
      .map((lap) => ({
        lap,
        delta: +((d1Map.get(lap)! - d2Map.get(lap)!)).toFixed(3),
      }))

    return { chartData, deltaData }
  }, [d1, d2, isComparing])

  function sectorClass(value: number | null, best: number): string {
    if (!value) return "text-muted-foreground"
    if (value === best) return "text-purple-400 font-bold"
    if (value < best * 1.005) return "text-green-400"
    return "text-foreground"
  }

  if (error) {
    return (
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <AlertCircle className="h-6 w-6 text-destructive/60" />
          <p className="text-xs text-muted-foreground">Unable to load sector times.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Timer className="h-4 w-4" style={{ color: teamColor }} />
          Sector Times
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : d1.raceLaps.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No lap data available.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Lap time progression chart */}
            {chartData.length > 1 && (
              <div className="h-40">
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
                      width={40}
                      domain={["auto", "auto"]}
                      tickFormatter={(v: number) => formatTime(v)}
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
                        const label = name === "time1"
                          ? (driverLabel ?? "Driver 1")
                          : name === "time2"
                          ? (driverLabel2 ?? "Driver 2")
                          : "Lap Time"
                        return [formatTime(value), label]
                      }}
                      labelFormatter={(label) => `Lap ${label}`}
                    />
                    {isComparing && (
                      <Legend
                        verticalAlign="top"
                        height={20}
                        formatter={(value: string) =>
                          value === "time1" ? (driverLabel ?? "Driver 1") : (driverLabel2 ?? "Driver 2")
                        }
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="time1"
                      stroke={teamColor}
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls
                      style={{ filter: `drop-shadow(0 0 4px ${teamColor}40)` }}
                    />
                    {isComparing && (
                      <Line
                        type="monotone"
                        dataKey="time2"
                        stroke={teamColor2}
                        strokeWidth={1.5}
                        dot={false}
                        connectNulls
                        style={{ filter: `drop-shadow(0 0 4px ${teamColor2}40)` }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Delta chart — only in comparison mode */}
            {isComparing && deltaData.length > 1 && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Lap Time Delta ({driverLabel ?? "D1"} − {driverLabel2 ?? "D2"})
                </span>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deltaData}>
                      <XAxis
                        dataKey="lap"
                        tick={{ fontSize: 8, fill: "oklch(0.60 0 0)" }}
                        axisLine={{ stroke: "oklch(0.27 0.005 260)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 8, fill: "oklch(0.60 0 0)" }}
                        axisLine={{ stroke: "oklch(0.27 0.005 260)" }}
                        tickLine={false}
                        width={35}
                        tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "oklch(0.17 0.005 260)",
                          border: "1px solid oklch(0.27 0.005 260)",
                          borderRadius: "6px",
                          fontSize: "11px",
                          color: "oklch(0.96 0 0)",
                        }}
                        formatter={(value: number) => {
                          const label = value > 0
                            ? `${driverLabel2 ?? "D2"} faster`
                            : `${driverLabel ?? "D1"} faster`
                          return [`${value > 0 ? "+" : ""}${value.toFixed(3)}s`, label]
                        }}
                        labelFormatter={(label) => `Lap ${label}`}
                      />
                      <ReferenceLine y={0} stroke="oklch(0.40 0 0)" />
                      <Bar dataKey="delta" radius={[1, 1, 0, 0]}>
                        {deltaData.map((d, i) => (
                          <Cell
                            key={i}
                            fill={d.delta > 0 ? (teamColor2 ?? "#22c55e") : teamColor}
                            fillOpacity={0.7}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Lap times table */}
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border/30 text-muted-foreground">
                    <th className="px-1 py-1 text-left font-medium">Lap</th>
                    <th className="px-1 py-1 text-right font-medium" style={isComparing ? { color: teamColor } : undefined}>S1</th>
                    <th className="px-1 py-1 text-right font-medium" style={isComparing ? { color: teamColor } : undefined}>S2</th>
                    <th className="px-1 py-1 text-right font-medium" style={isComparing ? { color: teamColor } : undefined}>S3</th>
                    <th className="px-1 py-1 text-right font-medium" style={isComparing ? { color: teamColor } : undefined}>Time</th>
                    {isComparing && (
                      <>
                        <th className="px-1 py-1 text-right font-medium" style={{ color: teamColor2 }}>S1</th>
                        <th className="px-1 py-1 text-right font-medium" style={{ color: teamColor2 }}>S2</th>
                        <th className="px-1 py-1 text-right font-medium" style={{ color: teamColor2 }}>S3</th>
                        <th className="px-1 py-1 text-right font-medium" style={{ color: teamColor2 }}>Time</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {(() => {
                    const d2Map = new Map<number, OpenF1Lap>()
                    if (isComparing && d2) {
                      for (const l of d2.raceLaps) d2Map.set(l.lap_number, l)
                    }

                    const allLapNumbers = new Set(d1.raceLaps.map((l) => l.lap_number))
                    if (isComparing && d2) {
                      for (const l of d2.raceLaps) allLapNumbers.add(l.lap_number)
                    }
                    const sorted = Array.from(allLapNumbers).sort((a, b) => a - b)

                    const d1Map = new Map<number, OpenF1Lap>()
                    for (const l of d1.raceLaps) d1Map.set(l.lap_number, l)

                    return sorted.map((lapNum) => {
                      const lap1 = d1Map.get(lapNum)
                      const lap2 = d2Map.get(lapNum)

                      return (
                        <tr key={lapNum} className="border-b border-border/10">
                          <td className="px-1 py-0.5 text-muted-foreground">{lapNum}</td>
                          <td className={`px-1 py-0.5 text-right ${lap1 ? sectorClass(lap1.duration_sector_1, d1.bestS1) : "text-muted-foreground/30"}`}>
                            {lap1 ? formatTime(lap1.duration_sector_1) : "—"}
                          </td>
                          <td className={`px-1 py-0.5 text-right ${lap1 ? sectorClass(lap1.duration_sector_2, d1.bestS2) : "text-muted-foreground/30"}`}>
                            {lap1 ? formatTime(lap1.duration_sector_2) : "—"}
                          </td>
                          <td className={`px-1 py-0.5 text-right ${lap1 ? sectorClass(lap1.duration_sector_3, d1.bestS3) : "text-muted-foreground/30"}`}>
                            {lap1 ? formatTime(lap1.duration_sector_3) : "—"}
                          </td>
                          <td className={`px-1 py-0.5 text-right ${lap1 ? sectorClass(lap1.lap_duration, d1.bestLap) : "text-muted-foreground/30"}`}>
                            {lap1 ? formatTime(lap1.lap_duration) : "—"}
                          </td>
                          {isComparing && (
                            <>
                              <td className={`px-1 py-0.5 text-right ${lap2 ? sectorClass(lap2.duration_sector_1, d2!.bestS1) : "text-muted-foreground/30"}`}>
                                {lap2 ? formatTime(lap2.duration_sector_1) : "—"}
                              </td>
                              <td className={`px-1 py-0.5 text-right ${lap2 ? sectorClass(lap2.duration_sector_2, d2!.bestS2) : "text-muted-foreground/30"}`}>
                                {lap2 ? formatTime(lap2.duration_sector_2) : "—"}
                              </td>
                              <td className={`px-1 py-0.5 text-right ${lap2 ? sectorClass(lap2.duration_sector_3, d2!.bestS3) : "text-muted-foreground/30"}`}>
                                {lap2 ? formatTime(lap2.duration_sector_3) : "—"}
                              </td>
                              <td className={`px-1 py-0.5 text-right ${lap2 ? sectorClass(lap2.lap_duration, d2!.bestLap) : "text-muted-foreground/30"}`}>
                                {lap2 ? formatTime(lap2.lap_duration) : "—"}
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
