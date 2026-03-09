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
import type { OpenF1Position, OpenF1Interval, OpenF1Lap } from "@/lib/openf1"

interface Props {
  positions: OpenF1Position[]
  intervals: OpenF1Interval[]
  laps?: OpenF1Lap[]
  isLoading: boolean
  error: unknown
  teamColor: string
  positions2?: OpenF1Position[]
  intervals2?: OpenF1Interval[]
  laps2?: OpenF1Lap[]
  teamColor2?: string
  driverLabel?: string
  driverLabel2?: string
}

function processPositions(positions: OpenF1Position[], intervals: OpenF1Interval[], laps?: OpenF1Lap[]) {
  if (positions.length === 0) {
    return { chartData: [] as Array<{ lap: number; position: number }>, startPos: null, endPos: null, posGained: 0, bestGap: null as number | null, bestInterval: null as number | null, totalLaps: 0 }
  }

  const sorted = [...positions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const raceStart = new Date(sorted[0].date).getTime()
  const raceEnd = new Date(sorted[sorted.length - 1].date).getTime()
  const raceDuration = raceEnd - raceStart

  // Build lap boundary timestamps from lap data if available
  const sortedLaps = laps
    ? [...laps].filter((l) => l.date_start).sort((a, b) => a.lap_number - b.lap_number)
    : []

  // Determine total laps from lap data or estimate from position count
  const totalLaps = sortedLaps.length > 0
    ? Math.max(...sortedLaps.map((l) => l.lap_number))
    : Math.max(Math.round(raceDuration / 90000), 1) // ~90s per lap estimate

  // Map each position data point to a lap number
  // Use lap start timestamps if available, otherwise interpolate linearly
  const lapBoundaries: Array<{ lap: number; startTime: number }> = []
  if (sortedLaps.length > 0) {
    for (const l of sortedLaps) {
      if (l.date_start) {
        lapBoundaries.push({ lap: l.lap_number, startTime: new Date(l.date_start).getTime() })
      }
    }
  }

  function getLapForTime(t: number): number {
    if (lapBoundaries.length > 0) {
      // Find the last lap whose start time is <= t
      let lap = 1
      for (const b of lapBoundaries) {
        if (t >= b.startTime) lap = b.lap
      }
      return lap
    }
    // Linear interpolation fallback
    if (raceDuration === 0) return 1
    return Math.max(1, Math.min(totalLaps, Math.ceil(((t - raceStart) / raceDuration) * totalLaps)))
  }

  // Group positions by lap, take the last position per lap (most accurate end-of-lap position)
  const positionByLap = new Map<number, number>()
  for (const p of sorted) {
    const t = new Date(p.date).getTime()
    const lap = getLapForTime(t)
    positionByLap.set(lap, p.position) // last write wins (sorted chronologically)
  }

  // Build chart data with lap numbers
  const chartData: Array<{ lap: number; position: number }> = []
  for (let lap = 1; lap <= totalLaps; lap++) {
    const pos = positionByLap.get(lap)
    if (pos !== undefined) {
      chartData.push({ lap, position: pos })
    } else if (chartData.length > 0) {
      // Carry forward last known position for laps with no data
      chartData.push({ lap, position: chartData[chartData.length - 1].position })
    }
  }

  const startPos = chartData.length > 0 ? chartData[0].position : sorted[0].position
  const endPos = chartData.length > 0 ? chartData[chartData.length - 1].position : sorted[sorted.length - 1].position
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

  return { chartData, startPos, endPos, posGained, bestGap, bestInterval, totalLaps }
}

export function PositionPanel({
  positions, intervals, laps, isLoading, error, teamColor,
  positions2, intervals2, laps2, teamColor2, driverLabel, driverLabel2,
}: Props) {
  const isComparing = positions2 && positions2.length > 0

  const d1 = useMemo(() => processPositions(positions, intervals, laps), [positions, intervals, laps])
  const d2 = useMemo(
    () => (isComparing ? processPositions(positions2, intervals2 ?? [], laps2) : null),
    [positions2, intervals2, laps2, isComparing]
  )

  // Merge chart data by lap number for correct alignment
  const mergedChartData = useMemo(() => {
    if (!isComparing || !d2) {
      return d1.chartData.map((d) => ({ lap: d.lap, pos1: d.position }))
    }

    // Build a map of lap → position for each driver
    const d1Map = new Map(d1.chartData.map((d) => [d.lap, d.position]))
    const d2Map = new Map(d2.chartData.map((d) => [d.lap, d.position]))
    const maxLap = Math.max(d1.totalLaps, d2.totalLaps)

    const merged = []
    for (let lap = 1; lap <= maxLap; lap++) {
      merged.push({
        lap,
        pos1: d1Map.get(lap) ?? null,
        pos2: d2Map.get(lap) ?? null,
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
                    dataKey="lap"
                    tick={{ fontSize: 9, fill: "oklch(0.60 0 0)" }}
                    axisLine={{ stroke: "oklch(0.27 0.005 260)" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    label={{ value: "Lap", position: "insideBottomRight", offset: -5, fontSize: 9, fill: "oklch(0.50 0 0)" }}
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
                    labelFormatter={(lap: number) => `Lap ${lap}`}
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
