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
  Legend,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, AlertCircle, MapPin } from "lucide-react"
import type { OpenF1Position, OpenF1Interval } from "@/lib/openf1"

interface Props {
  positions: OpenF1Position[]
  intervals: OpenF1Interval[]
  isLoading: boolean
  error: unknown
  teamColor: string
  positions2?: OpenF1Position[]
  intervals2?: OpenF1Interval[]
  teamColor2?: string
  driverLabel?: string
  driverLabel2?: string
}

function processPositions(positions: OpenF1Position[], intervals: OpenF1Interval[]) {
  if (positions.length === 0) {
    return { chartData: [] as Array<{ index: number; position: number }>, startPos: null, endPos: null, posGained: 0, bestGap: null as number | null, bestInterval: null as number | null }
  }

  const sorted = [...positions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const first = new Date(sorted[0].date).getTime()
  const last = new Date(sorted[sorted.length - 1].date).getTime()
  const totalDuration = last - first
  const targetPoints = Math.min(sorted.length, 80)
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

  const lastPos = sorted[sorted.length - 1]
  if (chartData.length === 0 || chartData[chartData.length - 1].position !== lastPos.position) {
    chartData.push({ index: chartData.length + 1, position: lastPos.position })
  }

  const startPos = sorted[0].position
  const endPos = lastPos.position
  const posGained = startPos - endPos

  // Best gap to leader
  let bestGap: number | null = null
  for (const iv of intervals) {
    if (typeof iv.gap_to_leader === "number" && iv.gap_to_leader > 0) {
      if (bestGap === null || iv.gap_to_leader < bestGap) bestGap = iv.gap_to_leader
    }
  }
  if (intervals.some((iv) => iv.gap_to_leader === null || iv.gap_to_leader === 0)) {
    bestGap = 0
  }

  // Best interval (gap to car ahead)
  let bestInterval: number | null = null
  for (const iv of intervals) {
    if (typeof iv.interval === "number" && iv.interval > 0) {
      if (bestInterval === null || iv.interval < bestInterval) bestInterval = iv.interval
    }
  }

  return { chartData, startPos, endPos, posGained, bestGap, bestInterval }
}

export function PositionPanel({
  positions, intervals, isLoading, error, teamColor,
  positions2, intervals2, teamColor2, driverLabel, driverLabel2,
}: Props) {
  const isComparing = positions2 && positions2.length > 0

  const d1 = useMemo(() => processPositions(positions, intervals), [positions, intervals])
  const d2 = useMemo(
    () => (isComparing ? processPositions(positions2, intervals2 ?? []) : null),
    [positions2, intervals2, isComparing]
  )

  // Merge chart data for comparison
  const mergedChartData = useMemo(() => {
    if (!isComparing || !d2) {
      return d1.chartData.map((d) => ({ index: d.index, pos1: d.position }))
    }

    const maxLen = Math.max(d1.chartData.length, d2.chartData.length)
    const merged = []
    for (let i = 0; i < maxLen; i++) {
      merged.push({
        index: i + 1,
        pos1: d1.chartData[i]?.position ?? null,
        pos2: d2.chartData[i]?.position ?? null,
      })
    }
    return merged
  }, [d1, d2, isComparing])

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

  function StatBox({ label, children, color }: { label: string; children: React.ReactNode; color?: string }) {
    return (
      <div className="flex flex-col rounded-md border border-border/20 bg-secondary/20 px-2.5 py-1.5"
        style={color ? { borderLeftColor: color, borderLeftWidth: "2px" } : undefined}>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {children}
      </div>
    )
  }

  function GainedValue({ gained }: { gained: number }) {
    return (
      <span className="flex items-center gap-1 font-mono text-sm font-bold">
        {gained > 0 ? (
          <TrendingUp className="h-3 w-3 text-green-400" />
        ) : gained < 0 ? (
          <TrendingDown className="h-3 w-3 text-destructive" />
        ) : (
          <Minus className="h-3 w-3 text-muted-foreground" />
        )}
        {gained > 0 ? `+${gained}` : gained === 0 ? "0" : gained}
      </span>
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
        ) : d1.chartData.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No position data available.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Position chart */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mergedChartData}>
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
                    formatter={(value: number, name: string) => {
                      const label = name === "pos1"
                        ? (driverLabel ?? "Driver 1")
                        : (driverLabel2 ?? "Driver 2")
                      return [`P${value}`, label]
                    }}
                    labelFormatter={() => ""}
                  />
                  {isComparing && (
                    <Legend
                      verticalAlign="top"
                      height={20}
                      formatter={(value: string) =>
                        value === "pos1" ? (driverLabel ?? "Driver 1") : (driverLabel2 ?? "Driver 2")
                      }
                    />
                  )}
                  <ReferenceLine
                    y={10}
                    stroke="oklch(0.27 0.005 260)"
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="stepAfter"
                    dataKey="pos1"
                    stroke={teamColor}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    style={{ filter: `drop-shadow(0 0 4px ${teamColor}40)` }}
                  />
                  {isComparing && (
                    <Line
                      type="stepAfter"
                      dataKey="pos2"
                      stroke={teamColor2}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                      style={{ filter: `drop-shadow(0 0 4px ${teamColor2}40)` }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Stats rows */}
            {!isComparing ? (
              // Single driver stats
              <div className="flex flex-wrap gap-3">
                <StatBox label="Start"><span className="font-mono text-sm font-bold">P{d1.startPos}</span></StatBox>
                <StatBox label="Finish"><span className="font-mono text-sm font-bold">P{d1.endPos}</span></StatBox>
                <StatBox label="Gained"><GainedValue gained={d1.posGained} /></StatBox>
                {d1.bestGap !== null && (
                  <StatBox label="Best Gap to Leader">
                    <span className="font-mono text-sm font-bold">
                      {d1.bestGap === 0 ? "LEADER" : `+${d1.bestGap.toFixed(1)}s`}
                    </span>
                  </StatBox>
                )}
                {d1.bestInterval !== null && (
                  <StatBox label="Best Gap Ahead">
                    <span className="font-mono text-sm font-bold">{d1.bestInterval.toFixed(1)}s</span>
                  </StatBox>
                )}
              </div>
            ) : (
              // Comparison stats — side by side
              <div className="flex flex-col gap-2">
                {/* Driver 1 stats */}
                <div className="flex items-center gap-2">
                  <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: teamColor }} />
                  {driverLabel && (
                    <span className="w-10 shrink-0 text-[9px] font-bold uppercase" style={{ color: teamColor }}>{driverLabel}</span>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <StatBox label="Start"><span className="font-mono text-xs font-bold">P{d1.startPos}</span></StatBox>
                    <StatBox label="Finish"><span className="font-mono text-xs font-bold">P{d1.endPos}</span></StatBox>
                    <StatBox label="Gained"><GainedValue gained={d1.posGained} /></StatBox>
                    {d1.bestInterval !== null && (
                      <StatBox label="Gap Ahead">
                        <span className="font-mono text-xs font-bold">{d1.bestInterval.toFixed(1)}s</span>
                      </StatBox>
                    )}
                  </div>
                </div>

                {/* Driver 2 stats */}
                {d2 && (
                  <div className="flex items-center gap-2">
                    <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: teamColor2 }} />
                    {driverLabel2 && (
                      <span className="w-10 shrink-0 text-[9px] font-bold uppercase" style={{ color: teamColor2 }}>{driverLabel2}</span>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <StatBox label="Start"><span className="font-mono text-xs font-bold">P{d2.startPos}</span></StatBox>
                      <StatBox label="Finish"><span className="font-mono text-xs font-bold">P{d2.endPos}</span></StatBox>
                      <StatBox label="Gained"><GainedValue gained={d2.posGained} /></StatBox>
                      {d2.bestInterval !== null && (
                        <StatBox label="Gap Ahead">
                          <span className="font-mono text-xs font-bold">{d2.bestInterval.toFixed(1)}s</span>
                        </StatBox>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
