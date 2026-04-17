import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { LeaderboardTable } from "@/components/leaderboard-table"
import { PointsChart } from "@/components/points-chart"
import { RaceLeaderboard } from "@/components/race-leaderboard"

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()

  // Fetch all data in parallel
  const [{ data: players }, { data: scores }, { data: races }] = await Promise.all([
    supabase
      .from("players")
      .select("id, name")
      .eq("group_id", session.groupId),
    supabase
      .from("player_scores")
      .select("player_id, race_id, score_type, points"),
    supabase
      .from("races")
      .select("id, round, race_name, country, results_fetched")
      .order("round"),
  ])

  const completedRaces = (races || []).filter((r) => r.results_fetched)

  // Build leaderboard data
  const leaderboard = (players || []).map((player) => {
    const playerScores = (scores || []).filter(
      (s) => s.player_id === player.id
    )
    const racePoints = playerScores
      .filter((s) => s.score_type === "race")
      .reduce((sum, s) => sum + (s.points || 0), 0)
    const polePoints = playerScores
      .filter((s) => s.score_type === "pole")
      .reduce((sum, s) => sum + (s.points || 0), 0)
    const wdcPoints = playerScores
      .filter((s) => s.score_type === "wdc")
      .reduce((sum, s) => sum + (s.points || 0), 0)

    // Per-race breakdown
    const raceBreakdown = completedRaces.map((race) => {
      const rScore = playerScores.find(
        (s) => s.race_id === race.id && s.score_type === "race"
      )
      const pScore = playerScores.find(
        (s) => s.race_id === race.id && s.score_type === "pole"
      )
      return {
        raceId: race.id,
        round: race.round,
        raceName: race.race_name,
        country: race.country,
        racePoints: rScore?.points || 0,
        polePoints: pScore?.points || 0,
        total: (rScore?.points || 0) + (pScore?.points || 0),
      }
    })

    // Cumulative points over time for chart
    let cumulative = 0
    const progression = raceBreakdown.map((rb) => {
      cumulative += rb.total
      return {
        round: rb.round,
        country: rb.country,
        total: cumulative,
      }
    })

    return {
      playerId: player.id,
      playerName: player.name,
      isMe: player.id === session.playerId,
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
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full standings for your league.{" "}
          {completedRaces.length > 0
            ? `Scored through ${completedRaces.length} race(s).`
            : "No races scored yet."}
        </p>
      </div>

      {completedRaces.length > 0 && leaderboard.some((p) => p.progression.length > 0) && (
        <PointsChart leaderboard={leaderboard} />
      )}

      <LeaderboardTable
        leaderboard={leaderboard}
        completedRaces={completedRaces}
      />

      <RaceLeaderboard
        leaderboard={leaderboard}
        completedRaces={completedRaces}
      />
    </div>
  )
}
