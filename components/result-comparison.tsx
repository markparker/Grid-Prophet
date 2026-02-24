import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowRight, Trophy } from "lucide-react"

interface Driver {
  id: string
  name: string
  surname: string
  short_name: string
  team_name: string
  team_id: string
}

interface ResultComparisonProps {
  raceResults: Array<{
    driver_id: string
    position: number
    points: number
    drivers: Driver
  }>
  qualyResults: Array<{
    driver_id: string
    grid_position: number
    drivers: Driver
  }> | null
  prediction: {
    pole_prediction: string | null
    race_prediction_positions: Array<{
      driver_id: string
      predicted_position: number
    }>
  } | null
  groupPlayers: Array<{ id: string; name: string }>
  groupScores: Array<{
    player_id: string
    score_type: string
    points: number
    breakdown: unknown
  }>
  currentPlayerId: string
  drivers: Driver[]
}

const teamColors: Record<string, string> = {
  red_bull: "bg-blue-600/20 text-blue-400",
  ferrari: "bg-red-600/20 text-red-400",
  mclaren: "bg-orange-500/20 text-orange-400",
  mercedes: "bg-teal-500/20 text-teal-400",
  aston_martin: "bg-green-600/20 text-green-400",
  alpine: "bg-pink-500/20 text-pink-400",
  haas: "bg-gray-400/20 text-gray-300",
  racing_bulls: "bg-indigo-500/20 text-indigo-400",
  williams: "bg-sky-500/20 text-sky-400",
  audi: "bg-zinc-400/20 text-zinc-300",
  cadillac: "bg-yellow-500/20 text-yellow-400",
}

export function ResultComparison({
  raceResults,
  qualyResults,
  prediction,
  groupPlayers,
  groupScores,
  currentPlayerId,
}: ResultComparisonProps) {
  const top10Results = raceResults.filter((r) => r.position <= 10)
  const poleDriver = qualyResults?.find((q) => q.grid_position === 1)

  // Build prediction map
  const predMap = new Map<number, string>()
  prediction?.race_prediction_positions?.forEach((pp) => {
    predMap.set(pp.predicted_position, pp.driver_id)
  })

  // Reverse map: driver -> predicted position
  const driverPredMap = new Map<string, number>()
  prediction?.race_prediction_positions?.forEach((pp) => {
    driverPredMap.set(pp.driver_id, pp.predicted_position)
  })

  // Group scores for this race
  const playerScoreMap = new Map<
    string,
    { race: number; pole: number; total: number }
  >()
  groupScores.forEach((s) => {
    const existing = playerScoreMap.get(s.player_id) || {
      race: 0,
      pole: 0,
      total: 0,
    }
    if (s.score_type === "race") existing.race = s.points
    if (s.score_type === "pole") existing.pole = s.points
    existing.total = existing.race + existing.pole
    playerScoreMap.set(s.player_id, existing)
  })

  const sortedPlayers = [...groupPlayers].sort((a, b) => {
    const aScore = playerScoreMap.get(a.id)?.total || 0
    const bScore = playerScoreMap.get(b.id)?.total || 0
    return bScore - aScore
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Pole Position Result */}
      {poleDriver && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              <Trophy className="h-4 w-4 text-f1-yellow" />
              Pole Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Actual</span>
                <span
                  className={cn(
                    "rounded px-2 py-1 font-mono text-sm font-bold",
                    teamColors[poleDriver.drivers.team_id] || "bg-secondary text-foreground"
                  )}
                >
                  {poleDriver.drivers.short_name}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  Your pick
                </span>
                {prediction?.pole_prediction ? (
                  <span
                    className={cn(
                      "rounded px-2 py-1 font-mono text-sm font-bold",
                      prediction.pole_prediction === poleDriver.driver_id
                        ? "bg-f1-green/20 text-f1-green ring-1 ring-f1-green/30"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {prediction.pole_prediction === poleDriver.driver_id
                      ? poleDriver.drivers.short_name
                      : prediction.pole_prediction
                          .split("_")
                          .map((w) => w[0]?.toUpperCase())
                          .join("")
                          .slice(0, 3)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No prediction
                  </span>
                )}
              </div>
              {prediction?.pole_prediction === poleDriver.driver_id && (
                <span className="ml-auto rounded-full bg-f1-green/10 px-3 py-1 text-xs font-bold text-f1-green">
                  +5 pts
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Race Results vs Prediction */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Race Results vs Your Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            {/* Header */}
            <div className="mb-1 grid grid-cols-[2.5rem_1fr_4rem_3.5rem] items-center gap-3 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <span>Pos</span>
              <span>Driver</span>
              <span className="text-center">Pred</span>
              <span className="text-right">Pts</span>
            </div>

            {top10Results.map((result) => {
              const predictedPos = driverPredMap.get(result.driver_id)
              const diff =
                predictedPos !== undefined
                  ? Math.abs(predictedPos - result.position)
                  : null
              let scoreType: "exact" | "near" | "miss" = "miss"
              let pts = 0
              if (diff === 0) {
                scoreType = "exact"
                pts = 3
              } else if (diff === 1) {
                scoreType = "near"
                pts = 1
              }

              return (
                <div
                  key={result.driver_id}
                  className={cn(
                    "grid grid-cols-[2.5rem_1fr_4rem_3.5rem] items-center gap-3 rounded-md px-3 py-2",
                    scoreType === "exact" && "bg-f1-green/5 ring-1 ring-f1-green/20",
                    scoreType === "near" && "bg-f1-yellow/5 ring-1 ring-f1-yellow/20"
                  )}
                >
                  <span className="font-mono text-sm font-bold text-foreground">
                    P{result.position}
                  </span>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                        teamColors[result.drivers.team_id] ||
                          "bg-secondary text-foreground"
                      )}
                    >
                      {result.drivers.short_name}
                    </span>
                    <span className="truncate text-sm text-foreground">
                      {result.drivers.surname}
                    </span>
                  </div>
                  <span className="text-center font-mono text-xs text-muted-foreground">
                    {predictedPos !== undefined ? `P${predictedPos}` : "-"}
                  </span>
                  <span
                    className={cn(
                      "text-right font-mono text-sm font-bold",
                      scoreType === "exact" && "text-f1-green",
                      scoreType === "near" && "text-f1-yellow",
                      scoreType === "miss" && "text-muted-foreground"
                    )}
                  >
                    {predictedPos !== undefined
                      ? pts > 0
                        ? `+${pts}`
                        : "0"
                      : "-"}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Group Scores for this Race */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Group Scores - This Race
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            {sortedPlayers.map((player, i) => {
              const scores = playerScoreMap.get(player.id)
              return (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2",
                    player.id === currentPlayerId && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        player.id === currentPlayerId
                          ? "text-primary"
                          : "text-foreground"
                      )}
                    >
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {scores && scores.pole > 0 && (
                      <span className="text-xs text-f1-yellow">
                        Pole +{scores.pole}
                      </span>
                    )}
                    <span className="font-mono text-sm font-bold text-foreground">
                      {scores?.total || 0}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        pts
                      </span>
                    </span>
                  </div>
                </div>
              )
            })}
            {sortedPlayers.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No scores available for this race yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
