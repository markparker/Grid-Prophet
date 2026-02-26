"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flag, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

interface RaceBreakdownEntry {
  raceId: string
  round: number
  raceName: string
  country: string
  racePoints: number
  polePoints: number
  total: number
}

interface LeaderboardEntry {
  playerId: string
  playerName: string
  isMe: boolean
  raceBreakdown: RaceBreakdownEntry[]
}

interface CompletedRace {
  id: string
  round: number
  race_name: string
  country: string
}

interface Props {
  leaderboard: LeaderboardEntry[]
  completedRaces: CompletedRace[]
}

export function RaceLeaderboard({ leaderboard, completedRaces }: Props) {
  const defaultRace = completedRaces[completedRaces.length - 1]
  const [selectedRaceId, setSelectedRaceId] = useState<string>(
    defaultRace?.id ?? ""
  )

  if (completedRaces.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-4 w-4 text-primary" />
            Race Scoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No races scored yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const selectedRace = completedRaces.find((r) => r.id === selectedRaceId)

  // Build per-race standings sorted by points for the selected race
  const raceStandings = leaderboard
    .map((player) => {
      const rb = player.raceBreakdown.find((r) => r.raceId === selectedRaceId)
      return {
        playerId: player.playerId,
        playerName: player.playerName,
        isMe: player.isMe,
        racePoints: rb?.racePoints ?? 0,
        polePoints: rb?.polePoints ?? 0,
        total: rb?.total ?? 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-4 w-4 text-primary" />
            Race Scoring
          </CardTitle>
          <Select value={selectedRaceId} onValueChange={setSelectedRaceId}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue placeholder="Select a race" />
            </SelectTrigger>
            <SelectContent>
              {completedRaces.map((race) => (
                <SelectItem key={race.id} value={race.id} className="text-xs">
                  <span className="font-mono text-muted-foreground mr-1.5">
                    R{race.round}
                  </span>
                  {race.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedRace && (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedRace.race_name} &mdash; Round {selectedRace.round}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {/* Header row */}
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="w-8">#</span>
          <span className="flex-1">Player</span>
          <span className="w-16 text-right hidden sm:block">Race Pts</span>
          <span className="w-16 text-right hidden sm:block">Pole Pts</span>
          <span className="w-16 text-right font-bold">Total</span>
        </div>

        <div className="flex flex-col gap-1">
          {raceStandings.map((player, i) => (
            <div
              key={player.playerId}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2.5",
                player.isMe && "border border-primary/20 bg-primary/5",
                player.total === 0 && "opacity-60"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold",
                  i === 0 && player.total > 0
                    ? "bg-primary text-primary-foreground"
                    : i === 1 && player.total > 0
                    ? "bg-primary/30 text-primary"
                    : i === 2 && player.total > 0
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium">
                {player.playerName}
                {player.isMe && (
                  <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                )}
              </span>
              <span className="w-16 text-right font-mono text-xs hidden sm:block text-muted-foreground">
                {player.racePoints}
              </span>
              <span className="w-16 text-right font-mono text-xs hidden sm:block text-muted-foreground">
                {player.polePoints}
              </span>
              <span
                className={cn(
                  "w-16 text-right font-mono text-sm font-bold",
                  player.total > 0 ? "text-primary" : "text-muted-foreground"
                )}
              >
                {player.total}
              </span>
            </div>
          ))}
        </div>

        {raceStandings.every((p) => p.total === 0) && (
          <p className="pt-3 text-center text-xs text-muted-foreground">
            No predictions were scored for this race.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
