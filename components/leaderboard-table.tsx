"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Medal } from "lucide-react"

interface LeaderboardEntry {
  playerId: string
  playerName: string
  racePoints: number
  polePoints: number
  wdcPoints: number
  totalPoints: number
  raceBreakdown: Array<{
    raceId: string
    round: number
    raceName: string
    racePoints: number
    polePoints: number
    total: number
  }>
  progression: Array<{
    round: number
    total: number
    name: string
  }>
}

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[]
  completedRaces: Array<{
    id: string
    round: number
    race_name: string
    country: string
  }>
  currentPlayerId: string
}

export function LeaderboardTable({
  leaderboard,
  completedRaces,
  currentPlayerId,
}: LeaderboardTableProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          <Medal className="h-4 w-4" />
          Full Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {/* Header */}
          <div className="mb-2 grid grid-cols-[2rem_1fr_4rem_4rem_4rem_4rem_2rem] items-center gap-2 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Race</span>
            <span className="text-right">Pole</span>
            <span className="text-right">WDC</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {leaderboard.map((player, i) => (
            <div key={player.playerId}>
              <button
                type="button"
                onClick={() =>
                  setExpandedPlayer(
                    expandedPlayer === player.playerId
                      ? null
                      : player.playerId
                  )
                }
                className={cn(
                  "grid w-full grid-cols-[2rem_1fr_4rem_4rem_4rem_4rem_2rem] items-center gap-2 rounded-md px-3 py-3 text-left transition-colors hover:bg-secondary/30",
                  player.playerId === currentPlayerId && "bg-primary/5",
                  expandedPlayer === player.playerId && "bg-secondary/20"
                )}
              >
                <span className="font-mono text-sm font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    player.playerId === currentPlayerId
                      ? "text-primary"
                      : "text-foreground"
                  )}
                >
                  {player.playerName}
                </span>
                <span className="text-right font-mono text-sm text-muted-foreground">
                  {player.racePoints}
                </span>
                <span className="text-right font-mono text-sm text-muted-foreground">
                  {player.polePoints}
                </span>
                <span className="text-right font-mono text-sm text-muted-foreground">
                  {player.wdcPoints}
                </span>
                <span className="text-right font-mono text-sm font-bold text-foreground">
                  {player.totalPoints}
                </span>
                <span className="flex justify-end">
                  {expandedPlayer === player.playerId ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
              </button>

              {/* Expanded per-race breakdown */}
              {expandedPlayer === player.playerId && (
                <div className="mb-2 ml-8 mr-3 rounded-md border border-border bg-background p-3">
                  {player.raceBreakdown.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground">
                      No race results yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="mb-1 grid grid-cols-[1fr_3rem_3rem_3rem] gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        <span>Race</span>
                        <span className="text-right">Race</span>
                        <span className="text-right">Pole</span>
                        <span className="text-right">Total</span>
                      </div>
                      {player.raceBreakdown.map((rb) => (
                        <div
                          key={rb.raceId}
                          className="grid grid-cols-[1fr_3rem_3rem_3rem] items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-secondary/30"
                        >
                          <span className="truncate text-foreground">
                            R{rb.round}{" "}
                            {rb.raceName.replace(" Grand Prix", "")}
                          </span>
                          <span className="text-right font-mono text-muted-foreground">
                            {rb.racePoints}
                          </span>
                          <span className="text-right font-mono text-muted-foreground">
                            {rb.polePoints}
                          </span>
                          <span
                            className={cn(
                              "text-right font-mono font-bold",
                              rb.total > 0 ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {rb.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {leaderboard.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No scores yet. Results will appear after races are synced.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
