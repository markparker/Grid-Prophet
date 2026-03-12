"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Zap, AlertCircle } from "lucide-react"
import type { LapEnergy } from "@/hooks/use-telemetry"

interface Props {
  energy: LapEnergy[]
  isLoading: boolean
  error: unknown
  teamColor: string
  energy2?: LapEnergy[]
  teamColor2?: string
  driverLabel?: string
  driverLabel2?: string
}

export function EnergyPanel({
  energy, isLoading, error, teamColor,
  energy2, teamColor2, driverLabel, driverLabel2,
}: Props) {
  const isComparing = energy2 && energy2.length > 0

  const { chartData, summaryStats1, summaryStats2 } = useMemo(() => {
    const d1Map = new Map<number, LapEnergy>()
    for (const e of energy) d1Map.set(e.lap, e)

    const d2Map = new Map<number, LapEnergy>()
    if (isComparing) {
      for (const e of energy2) d2Map.set(e.lap, e)
    }

    const allLaps = new Set([...d1Map.keys(), ...(isComparing ? d2Map.keys() : [])])
    const sortedLaps = Array.from(allLaps).sort((a, b) => a - b)

    const chartData = sortedLaps.map((lap) => {
      const e1 = d1Map.get(lap)
      const e2 = d2Map.get(lap)
      return {
        lap,
        boost1: e1?.deployPct ?? null,
        harvest1: e1?.harvestPct ?? null,
        ...(isComparing ? {
          boost2: e2?.deployPct ?? null,
          harvest2: e2?.harvestPct ?? null,
        } : {}),
      }
    })

    function calcSummary(data: LapEnergy[]) {
      if (data.length === 0) return null
      const avgBoost = Math.round(data.reduce((s, d) => s + d.deployPct, 0) / data.length)
      const avgHarvest = Math.round(data.reduce((s, d) => s + d.harvestPct, 0) / data.length)
      const totalActivations = data.reduce((s, d) => s + d.drsActivations, 0)
      const maxBoost = Math.max(...data.map((d) => d.deployPct))
      return { avgBoost, avgHarvest, totalActivations, maxBoost }
    }

    return {
      chartData,
      summaryStats1: calcSummary(energy),
      summaryStats2: isComparing ? calcSummary(energy2) : null,
    }
  }, [energy, energy2, isComparing])

  if (error) {
    return (
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <AlertCircle className="h-6 w-6 text-destructive/60" />
          <p className="text-xs text-muted-foreground">Unable to load energy data.</p>
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
          <Zap className="h-4 w-4" style={{ color: teamColor }} />
          Battery & Energy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No energy data available.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Boost vs Harvest area chart */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                Battery Boost % vs Energy Harvest % (Braking Recovery)
              </span>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
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
                      width={30}
                      domain={[0, 100]}
                      tickFormatter={(v: number) => `${v}%`}
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
                          boost1: `${isComparing ? d1Label + " " : ""}Boost`,
                          harvest1: `${isComparing ? d1Label + " " : ""}Harvest`,
                          boost2: `${d2Label} Boost`,
                          harvest2: `${d2Label} Harvest`,
                        }
                        return [`${value}%`, labels[name] ?? name]
                      }}
                      labelFormatter={(label) => `Lap ${label}`}
                    />
                    <Legend
                      verticalAlign="top"
                      height={20}
                      formatter={(value: string) => {
                        const labels: Record<string, string> = {
                          boost1: `${isComparing ? d1Label + " " : ""}Boost`,
                          harvest1: `${isComparing ? d1Label + " " : ""}Harvest`,
                          boost2: `${d2Label} Boost`,
                          harvest2: `${d2Label} Harvest`,
                        }
                        return labels[value] ?? value
                      }}
                      wrapperStyle={{ fontSize: "9px" }}
                    />
                    {/* Driver 1 boost */}
                    <Area
                      type="monotone"
                      dataKey="boost1"
                      stroke={teamColor}
                      fill={teamColor}
                      fillOpacity={0.15}
                      strokeWidth={1.5}
                      connectNulls
                      style={{ filter: `drop-shadow(0 0 4px ${teamColor}40)` }}
                    />
                    {/* Driver 1 harvest */}
                    <Area
                      type="monotone"
                      dataKey="harvest1"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.1}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      connectNulls
                    />
                    {/* Driver 2 */}
                    {isComparing && (
                      <>
                        <Area
                          type="monotone"
                          dataKey="boost2"
                          stroke={teamColor2}
                          fill={teamColor2}
                          fillOpacity={0.1}
                          strokeWidth={1.5}
                          connectNulls
                          style={{ filter: `drop-shadow(0 0 4px ${teamColor2}40)` }}
                        />
                        <Area
                          type="monotone"
                          dataKey="harvest2"
                          stroke="#4ade80"
                          fill="#4ade80"
                          fillOpacity={0.05}
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                          connectNulls
                        />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary stats */}
            <div className="flex flex-col gap-2">
              {summaryStats1 && (
                <EnergySummaryRow
                  stats={summaryStats1}
                  teamColor={teamColor}
                  label={isComparing ? driverLabel : undefined}
                />
              )}
              {isComparing && summaryStats2 && (
                <EnergySummaryRow
                  stats={summaryStats2}
                  teamColor={teamColor2 ?? "#888888"}
                  label={driverLabel2}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EnergySummaryRow({
  stats,
  teamColor,
  label,
}: {
  stats: { avgBoost: number; maxBoost: number; avgHarvest: number; totalActivations: number }
  teamColor: string
  label?: string
}) {
  const items = [
    { label: "Avg Boost", value: `${stats.avgBoost}%` },
    { label: "Max Boost", value: `${stats.maxBoost}%` },
    { label: "Avg Harvest", value: `${stats.avgHarvest}%` },
    { label: "Boost Activations", value: `${stats.totalActivations}` },
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
