import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { LeaderboardTable } from "@/components/leaderboard-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Medal, TrendingUp, Target, Trophy } from "lucide-react"

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()

  // Get all group players
  const { data: players } = await supabase
    .from("players")
    .select("id, name")
    .eq("group_id", session.groupId)

  const playerIds = (players || []).map((p) => p.id)

  // Get all scores
  const { data: scores } = await supabase
    .from("player_scores")
    .select("*")
    .in("player_id", playerIds)

  // Get races with results
  const { data: completedRaces } = await supabase
    .from("races")
    .select("id, round, race_name, country")
    .eq("results_fetched", true)
    .order("round", { ascending: true })

  // Build leaderboard data
  const leaderboard = (players || []).map((player) => {
    const playerScores = (scores || []).filter(
      (s) => s.player_id === player.id
    )

    const racePoints = playerScores
      .filter((s) => s.score_type === "race")
      .reduce((sum, s) => sum + s.points, 0)

    const polePoints = playerScores
      .filter((s) => s.score_type === "pole")
      .reduce((sum, s) => sum + s.points, 0)

    const wdcPoints = playerScores
      .filter((s) => s.score_type === "wdc")
      .reduce((sum, s) => sum + s.points, 0)

    // Per-race breakdown
    const raceBreakdown = (completedRaces || []).map((race) => {
      const raceScore =
        playerScores.find(
          (s) => s.race_id === race.id && s.score_type === "race"
        )?.points || 0
      const poleScore =
        playerScores.find(
          (s) => s.race_id === race.id && s.score_type === "pole"
        )?.points || 0
      return {
        raceId: race.id,
        round: race.round,
        raceName: race.race_name,
        racePoints: raceScore,
        polePoints: poleScore,
        total: raceScore + poleScore,
      }
    })

    // Running total for chart data
    let runningTotal = 0
    const progression = raceBreakdown.map((rb) => {
      runningTotal += rb.total
      return { round: rb.round, total: runningTotal, name: rb.raceName }
    })

    return {
      playerId: player.id,
      playerName: player.name,
      racePoints,
      polePoints,
      wdcPoints,
      totalPoints: racePoints + polePoints + wdcPoints,
      raceBreakdown,
      progression,
    }
  })

  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full standings for your prediction league across all races.
        </p>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {leaderboard.slice(0, 3).map((player, i) => (
            <Card
              key={player.playerId}
              className={
                i === 0
                  ? "border-f1-yellow/20 bg-f1-yellow/5"
                  : "border-border bg-card"
              }
            >
              <CardContent className="flex flex-col items-center gap-2 p-6">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-mono text-lg font-bold ${
                    i === 0
                      ? "bg-f1-yellow/20 text-f1-yellow"
                      : i === 1
                        ? "bg-zinc-300/15 text-zinc-300"
                        : "bg-amber-700/15 text-amber-600"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    player.playerId === session.playerId
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {player.playerName}
                </span>
                <span className="font-mono text-2xl font-bold text-foreground">
                  {player.totalPoints}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {player.racePoints} race
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {player.polePoints} pole
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Table */}
      <LeaderboardTable
        leaderboard={leaderboard}
        completedRaces={completedRaces || []}
        currentPlayerId={session.playerId}
      />
    </div>
  )
}
