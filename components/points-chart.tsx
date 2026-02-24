"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp } from "lucide-react"

const COLORS = [
  "oklch(0.63 0.25 25)",     // F1 red
  "oklch(0.70 0.15 160)",    // teal
  "oklch(0.65 0.20 250)",    // blue
  "oklch(0.75 0.15 80)",     // yellow
  "oklch(0.60 0.20 300)",    // purple
  "oklch(0.70 0.18 120)",    // green
  "oklch(0.65 0.15 30)",     // orange
  "oklch(0.55 0.15 200)",    // dark blue
]

interface Props {
  leaderboard: Array<{
    playerId: string
    playerName: string
    progression: Array<{
      round: number
      country: string
      total: number
    }>
  }>
}

export function PointsChart({ leaderboard }: Props) {
  // Build chart data: each round is a data point, each player is a line
  const playersWithData = leaderboard.filter(
    (p) => p.progression.length > 0
  )

  if (playersWithData.length === 0) return null

  const rounds = playersWithData[0].progression.map((p) => p.round)
  const chartData = rounds.map((round) => {
    const point: Record<string, unknown> = {
      round,
      country:
        playersWithData[0].progression.find((p) => p.round === round)
          ?.country || "",
    }
    playersWithData.forEach((player) => {
      const prog = player.progression.find((p) => p.round === round)
      point[player.playerName] = prog?.total || 0
    })
    return point
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Points Progression
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="country"
                tick={{ fontSize: 10, fill: "oklch(0.60 0 0)" }}
                axisLine={{ stroke: "oklch(0.27 0.005 260)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "oklch(0.60 0 0)" }}
                axisLine={{ stroke: "oklch(0.27 0.005 260)" }}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.17 0.005 260)",
                  border: "1px solid oklch(0.27 0.005 260)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "oklch(0.96 0 0)",
                }}
              />
              {playersWithData.map((player, i) => (
                <Line
                  key={player.playerId}
                  type="monotone"
                  dataKey={player.playerName}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {playersWithData.map((player, i) => (
            <div key={player.playerId} className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground">
                {player.playerName}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
