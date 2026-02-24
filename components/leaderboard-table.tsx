"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Medal } from "lucide-react"

interface LeaderboardEntry {
  playerId: string
  playerName: string
  isMe: boolean
  racePoints: number
  polePoints: number
  wdcPoints: number
  totalPoints: number
  raceBreakdown: Array<{
    raceId: string
    round: number
    raceName: string
    country: string
    racePoints: number
    polePoints: number
    total: number
  }>
}

interface Props {
  leaderboard: LeaderboardEntry[]
  completedRaces: Array<{
    id: string
    round: number
    race_name: string
    country: string
  }>
}

export function LeaderboardTable({ leaderboard, completedRaces }: Props) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Medal className="h-4 w-4 text-primary" />
          Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No players in your group yet.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="w-8">#</span>
              <span className="flex-1">Player</span>
              <span className="w-14 text-right hidden sm:block">Race</span>
              <span className="w-14 text-right hidden sm:block">Pole</span>
              <span className="w-14 text-right hidden sm:block">WDC</span>
              <span className="w-16 text-right font-bold">Total</span>
              <span className="w-6" />
            </div>

            {leaderboard.map((player, i) => {
              const isExpanded = expandedPlayer === player.playerId

              return (
                <div key={player.playerId}>
                  <button
                    onClick={() =>
                      setExpandedPlayer(isExpanded ? null : player.playerId)
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary/50",
                      player.isMe && "border border-primary/20 bg-primary/5",
                      isExpanded && "bg-secondary/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold",
                        i === 0
                          ? "bg-primary text-primary-foreground"
                          : i === 1
                          ? "bg-primary/30 text-primary"
                          : i === 2
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium">
                      {player.playerName}
                      {player.isMe && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </span>
                    <span className="w-14 text-right font-mono text-xs hidden sm:block">
                      {player.racePoints}
                    </span>
                    <span className="w-14 text-right font-mono text-xs hidden sm:block">
                      {player.polePoints}
                    </span>
                    <span className="w-14 text-right font-mono text-xs hidden sm:block">
                      {player.wdcPoints}
                    </span>
                    <span className="w-16 text-right font-mono text-sm font-bold text-primary">
                      {player.totalPoints}
                    </span>
                    <span className="w-6 flex-shrink-0">
                      {completedRaces.length > 0 &&
                        (isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ))}
                    </span>
                  </button>

                  {/* Expanded breakdown */}
                  {isExpanded && player.raceBreakdown.length > 0 && (
                    <div className="mb-2 ml-8 mt-1 rounded-md border border-border bg-secondary/20 p-2">
                      <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        <span className="w-8">Rd</span>
                        <span className="flex-1">Race</span>
                        <span className="w-10 text-right">Race</span>
                        <span className="w-10 text-right">Pole</span>
                        <span className="w-10 text-right">Total</span>
                      </div>
                      {player.raceBreakdown.map((rb) => (
                        <div
                          key={rb.raceId}
                          className="flex items-center gap-2 px-2 py-1 text-xs"
                        >
                          <span className="w-8 font-mono text-muted-foreground">
                            {rb.round}
                          </span>
                          <span className="flex-1 truncate text-muted-foreground">
                            {rb.country}
                          </span>
                          <span className="w-10 text-right font-mono">
                            {rb.racePoints}
                          </span>
                          <span className="w-10 text-right font-mono">
                            {rb.polePoints}
                          </span>
                          <span className="w-10 text-right font-mono font-bold">
                            {rb.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
