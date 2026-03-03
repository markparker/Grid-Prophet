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
  ReferenceLine,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, AlertCircle, MapPin } from "lucide-react"
import type { OpenF1Position, OpenF1Interval } from "@/lib/openf1"

interface Props {
  positions: OpenF1Position[]
  intervals: OpenF1Interval[]
  isLoading: boolean
  error: unknown
  teamColor: string
}

export function PositionPanel({ positions, intervals, isLoading, error, teamColor }: Props) {
  const { chartData, startPos, endPos, posGained, bestGap } = useMemo(() => {
    if (positions.length === 0) {
      return { chartData: [], startPos: null, endPos: null, posGained: 0, bestGap: null }
    }

    // Deduplicate positions by taking the last position update per approximate "lap"
    // Group by time intervals to approximate per-lap position
    const sorted = [...positions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Sample at regular intervals to avoid overcrowding
    const first = new Date(sorted[0].date).getTime()
    const last = new Date(sorted[sorted.length - 1].date).getTime()
    const totalDuration = last - first
    const targetPoints = Math.min(sorted.length, 80) // cap at 80 points for chart
    const interval = totalDuration / targetPoints

    const chartData: Array<{ index: number; position: number }> = []
    let nextTime = first

    for (const p of sorted) {
      const t = new Date(p.date).getTime()
      if (t >= nextTime) {
        chartData.push({ index: chartData.length + 1, position: p.position })
        nextTime = t + interval
      }
    }

    // Ensure we include the last position
    const lastPos = sorted[sorted.length - 1]
    if (chartData.length === 0 || chartData[chartData.length - 1].position !== lastPos.position) {
      chartData.push({ index: chartData.length + 1, position: lastPos.position })
    }

    const startPos = sorted[0].position
    const endPos = lastPos.position
    const posGained = startPos - endPos

    // Best gap to leader from intervals
    let bestGap: number | null = null
    for (const iv of intervals) {
      if (typeof iv.gap_to_leader === "number" && iv.gap_to_leader > 0) {
        if (bestGap === null || iv.gap_to_leader < bestGap) {
          bestGap = iv.gap_to_leader
        }
      }
    }
    // If driver was leader at some point, gap = 0
    if (intervals.some((iv) => iv.gap_to_leader === null || iv.gap_to_leader === 0)) {
      bestGap = 0
    }

    return { chartData, startPos, endPos, posGained, bestGap }
  }, [positions, intervals])

  if (error) {
    return (
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <AlertCircle className="h-6 w-6 text-destructive/60" />
          <p className="text-xs text-muted-foreground">Unable to load position data.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4" style={{ color: teamColor }} />
          Race Position
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-40 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No position data available.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Position chart */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="index"
                    tick={false}
                    axisLine={{ stroke: "oklch(0.27 0.005 260)" }}
                  />
                  <YAxis
                    reversed
                    domain={[1, 20]}
                    tick={{ fontSize: 9, fill: "oklch(0.60 0 0)" }}
                    axisLine={{ stroke: "oklch(0.27 0.005 260)" }}
                    tickLine={false}
                    width={25}
                    ticks={[1, 5, 10, 15, 20]}
                    label={{ value: "Position", angle: -90, position: "insideLeft", offset: 10, fontSize: 9, fill: "oklch(0.50 0 0)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.17 0.005 260)",
                      border: "1px solid oklch(0.27 0.005 260)",
                      borderRadius: "6px",
                      fontSize: "11px",
                      color: "oklch(0.96 0 0)",
                    }}
                    formatter={(value: number) => [`P${value}`, "Position"]}
                    labelFormatter={() => ""}
                  />
                  <ReferenceLine
                    y={10}
                    stroke="oklch(0.27 0.005 260)"
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="stepAfter"
                    dataKey="position"
                    stroke={teamColor}
                    strokeWidth={2}
                    dot={false}
                    style={{ filter: `drop-shadow(0 0 4px ${teamColor}40)` }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col rounded-md border border-border/20 bg-secondary/20 px-2.5 py-1.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Start</span>
                <span className="font-mono text-sm font-bold">P{startPos}</span>
              </div>
              <div className="flex flex-col rounded-md border border-border/20 bg-secondary/20 px-2.5 py-1.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Finish</span>
                <span className="font-mono text-sm font-bold">P{endPos}</span>
              </div>
              <div className="flex flex-col rounded-md border border-border/20 bg-secondary/20 px-2.5 py-1.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Gained</span>
                <span className="flex items-center gap-1 font-mono text-sm font-bold">
                  {posGained > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : posGained < 0 ? (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                  {posGained > 0 ? `+${posGained}` : posGained === 0 ? "0" : posGained}
                </span>
              </div>
              {bestGap !== null && (
                <div className="flex flex-col rounded-md border border-border/20 bg-secondary/20 px-2.5 py-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Best Gap</span>
                  <span className="font-mono text-sm font-bold">
                    {bestGap === 0 ? "LEADER" : `+${bestGap.toFixed(1)}s`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
