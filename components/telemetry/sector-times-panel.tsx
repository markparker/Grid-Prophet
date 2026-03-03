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
} from "recharts"
import { Timer, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OpenF1Lap } from "@/lib/openf1"

interface Props {
  laps: OpenF1Lap[]
  isLoading: boolean
  error: unknown
  teamColor: string
}

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined || seconds <= 0) return "—"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) return `${mins}:${secs.toFixed(3).padStart(6, "0")}`
  return secs.toFixed(3)
}

export function SectorTimesPanel({ laps, isLoading, error, teamColor }: Props) {
  // Calculate personal bests for color coding
  const { raceLaps, bestS1, bestS2, bestS3, bestLap, chartData } = useMemo(() => {
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

    const chartData = raceLaps
      .filter((l) => l.lap_duration && l.lap_duration > 0)
      .map((l) => ({
        lap: l.lap_number,
        time: l.lap_duration,
      }))

    return { raceLaps, bestS1, bestS2, bestS3, bestLap, chartData }
  }, [laps])

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
        ) : raceLaps.length === 0 ? (
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
                      formatter={(value: number) => [formatTime(value), "Lap Time"]}
                      labelFormatter={(label) => `Lap ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="time"
                      stroke={teamColor}
                      strokeWidth={1.5}
                      dot={false}
                      style={{ filter: `drop-shadow(0 0 4px ${teamColor}40)` }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Lap times table */}
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border/30 text-muted-foreground">
                    <th className="px-1 py-1 text-left font-medium">Lap</th>
                    <th className="px-1 py-1 text-right font-medium">S1</th>
                    <th className="px-1 py-1 text-right font-medium">S2</th>
                    <th className="px-1 py-1 text-right font-medium">S3</th>
                    <th className="px-1 py-1 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {raceLaps.map((lap) => (
                    <tr key={lap.lap_number} className="border-b border-border/10">
                      <td className="px-1 py-0.5 text-muted-foreground">{lap.lap_number}</td>
                      <td className={`px-1 py-0.5 text-right ${sectorClass(lap.duration_sector_1, bestS1)}`}>
                        {formatTime(lap.duration_sector_1)}
                      </td>
                      <td className={`px-1 py-0.5 text-right ${sectorClass(lap.duration_sector_2, bestS2)}`}>
                        {formatTime(lap.duration_sector_2)}
                      </td>
                      <td className={`px-1 py-0.5 text-right ${sectorClass(lap.duration_sector_3, bestS3)}`}>
                        {formatTime(lap.duration_sector_3)}
                      </td>
                      <td className={`px-1 py-0.5 text-right ${sectorClass(lap.lap_duration, bestLap)}`}>
                        {formatTime(lap.lap_duration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
