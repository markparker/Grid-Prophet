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
  ReferenceArea,
  Legend,
} from "recharts"
import { Timer, AlertCircle } from "lucide-react"
import type { OpenF1Lap, OpenF1RaceControl } from "@/lib/openf1"

interface RaceEvent {
  lapStart: number
  lapEnd: number | null // null = single-lap event or still ongoing
  type: "safety_car" | "vsc" | "red_flag" | "incident"
  message: string
}

interface Props {
  laps: OpenF1Lap[]
  isLoading: boolean
  error: unknown
  teamColor: string
  laps2?: OpenF1Lap[]
  teamColor2?: string
  driverLabel?: string
  driverLabel2?: string
  raceControl?: OpenF1RaceControl[]
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
    .filter((l) => l.lap_number > 0)
    .sort((a, b) => a.lap_number - b.lap_number)

  let bestS1 = Infinity
  let bestS2 = Infinity
  let bestS3 = Infinity
  let bestLap = Infinity

  for (const lap of raceLaps) {
    // Only consider non-pit-out laps for best times
    if (lap.is_pit_out_lap) continue
    if (lap.duration_sector_1 && lap.duration_sector_1 < bestS1) bestS1 = lap.duration_sector_1
    if (lap.duration_sector_2 && lap.duration_sector_2 < bestS2) bestS2 = lap.duration_sector_2
    if (lap.duration_sector_3 && lap.duration_sector_3 < bestS3) bestS3 = lap.duration_sector_3
    if (lap.lap_duration && lap.lap_duration < bestLap) bestLap = lap.lap_duration
  }

  const maxLap = raceLaps.length > 0
    ? Math.max(...raceLaps.map((l) => l.lap_number))
    : 0

  return { raceLaps, bestS1, bestS2, bestS3, bestLap, maxLap }
}

function isEndMessage(msg: string): boolean {
  return (
    msg.includes("ENDING") ||
    msg.includes("CLEAR") ||
    msg.includes("DISABLED") ||
    msg.includes("OFF") ||
    msg.includes("RESUMED") ||
    msg.includes("GREEN LIGHT")
  )
}

function extractRaceEvents(raceControl: OpenF1RaceControl[]): RaceEvent[] {
  const events: RaceEvent[] = []
  // Track open events by type so we can pair with their ending message
  const openEvents = new Map<RaceEvent["type"], RaceEvent>()

  // Sort by date to ensure chronological order
  const sorted = [...raceControl].sort((a, b) => a.date.localeCompare(b.date))

  for (const rc of sorted) {
    if (!rc.lap_number) continue
    const msg = rc.message.toUpperCase()
    const cat = rc.category.toUpperCase()

    // Skip chequered flag
    if (msg.includes("CHEQUERED")) continue

    // Determine event type
    let type: RaceEvent["type"] | null = null

    // Check VSC before SC since "VIRTUAL SAFETY CAR" contains "SAFETY CAR"
    if (msg.includes("VIRTUAL SAFETY CAR") || msg.includes("VSC")) {
      type = "vsc"
    } else if (cat === "SAFETYCAR" || msg.includes("SAFETY CAR DEPLOYED") || msg.includes("SAFETY CAR")) {
      type = "safety_car"
    } else if (msg.includes("RED FLAG") && rc.flag === "RED") {
      type = "red_flag"
    } else if (
      cat === "FLAG" &&
      (rc.flag === "YELLOW" || rc.flag === "DOUBLE YELLOW") &&
      rc.scope === "Track"
    ) {
      type = "incident"
    }

    if (!type) continue

    if (isEndMessage(msg)) {
      // Close the matching open event with this lap as the end
      const open = openEvents.get(type)
      if (open && rc.lap_number > open.lapStart) {
        open.lapEnd = rc.lap_number
      }
      openEvents.delete(type)
    } else {
      // If there's already an open event of this type, close it first
      if (openEvents.has(type)) {
        openEvents.delete(type)
      }
      const event: RaceEvent = {
        lapStart: rc.lap_number,
        lapEnd: null,
        type,
        message: rc.message,
      }
      events.push(event)
      openEvents.set(type, event)
    }
  }

  return events
}

export function SectorTimesPanel({
  laps, isLoading, error, teamColor,
  laps2, teamColor2, driverLabel, driverLabel2,
  raceControl,
}: Props) {
  const isComparing = laps2 && laps2.length > 0

  const d1 = useMemo(() => processLaps(laps), [laps])
  const d2 = useMemo(() => (isComparing ? processLaps(laps2) : null), [laps2, isComparing])

  const raceEvents = useMemo(
    () => (raceControl ? extractRaceEvents(raceControl) : []),
    [raceControl]
  )

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
                    {/* Safety car / incident markers */}
                    {raceEvents.map((evt, i) => {
                      const color =
                        evt.type === "red_flag" ? "#ef4444" :
                        evt.type === "safety_car" ? "#f59e0b" :
                        evt.type === "vsc" ? "#f59e0b" :
                        "#eab308"
                      const label =
                        evt.type === "safety_car" ? "SC" :
                        evt.type === "vsc" ? "VSC" :
                        evt.type === "red_flag" ? "RED" : "!"
                      const isDashed = evt.type === "vsc" || evt.type === "incident"

                      return [
                        // Start line
                        <ReferenceLine
                          key={`line-${evt.lapStart}-${evt.type}-${i}`}
                          x={evt.lapStart}
                          stroke={color}
                          strokeDasharray={isDashed ? "4 2" : undefined}
                          strokeWidth={1}
                          strokeOpacity={0.7}
                          label={{
                            value: label,
                            position: "top",
                            fontSize: 8,
                            fill: color,
                          }}
                        />,
                        // Shaded area for multi-lap events
                        evt.lapEnd && evt.lapEnd > evt.lapStart ? (
                          <ReferenceArea
                            key={`area-${evt.lapStart}-${evt.type}-${i}`}
                            x1={evt.lapStart}
                            x2={evt.lapEnd}
                            fill={color}
                            fillOpacity={0.08}
                            strokeOpacity={0}
                          />
                        ) : null,
                      ]
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Race event legend */}
            {raceEvents.length > 0 && (
              <div className="flex flex-wrap gap-3 text-[9px] text-muted-foreground">
                {raceEvents.some((e) => e.type === "safety_car") && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Safety Car
                  </span>
                )}
                {raceEvents.some((e) => e.type === "vsc") && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full border border-amber-500 bg-transparent" /> VSC
                  </span>
                )}
                {raceEvents.some((e) => e.type === "red_flag") && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Red Flag
                  </span>
                )}
                {raceEvents.some((e) => e.type === "incident") && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" /> Incident
                  </span>
                )}
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

                    // Always show all laps from 1 to max across both drivers
                    const maxLap = Math.max(d1.maxLap, d2?.maxLap ?? 0)
                    const sorted = Array.from({ length: maxLap }, (_, i) => i + 1)

                    const d1Map = new Map<number, OpenF1Lap>()
                    for (const l of d1.raceLaps) d1Map.set(l.lap_number, l)

                    const eventLaps = new Map<number, RaceEvent["type"]>()
                    for (const evt of raceEvents) {
                      const end = evt.lapEnd ?? evt.lapStart
                      for (let l = evt.lapStart; l <= end; l++) {
                        if (!eventLaps.has(l) || evt.type === "red_flag" || evt.type === "safety_car") {
                          eventLaps.set(l, evt.type)
                        }
                      }
                    }

                    return sorted.map((lapNum) => {
                      const lap1 = d1Map.get(lapNum)
                      const lap2 = d2Map.get(lapNum)
                      const evtType = eventLaps.get(lapNum)

                      return (
                        <tr key={lapNum} className={`border-b border-border/10 ${evtType ? "bg-amber-500/5" : ""}`}>
                          <td className="px-1 py-0.5 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {lapNum}
                              {evtType === "safety_car" && <span className="text-amber-500" title="Safety Car">&#9873;</span>}
                              {evtType === "vsc" && <span className="text-amber-500/70" title="Virtual Safety Car">&#9873;</span>}
                              {evtType === "red_flag" && <span className="text-red-500" title="Red Flag">&#9873;</span>}
                              {evtType === "incident" && <span className="text-yellow-500" title="Incident">!</span>}
                            </span>
                          </td>
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
