import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const raceId = searchParams.get("raceId")

  const supabase = await createClient()

  // Get all players in the group
  const { data: players } = await supabase
    .from("players")
    .select("id, name")
    .eq("group_id", session.groupId)

  if (!players) {
    return NextResponse.json({ leaderboard: [] })
  }

  // Get scores
  let query = supabase.from("player_scores").select("*")
  if (raceId) {
    query = query.eq("race_id", raceId)
  }

  const { data: scores } = await query

  // Aggregate scores per player
  const playerScores = players.map((player) => {
    const playerRaceScores = (scores || []).filter(
      (s) => s.player_id === player.id
    )
    const racePoints = playerRaceScores
      .filter((s) => s.score_type === "race")
      .reduce((sum, s) => sum + s.points, 0)
    const polePoints = playerRaceScores
      .filter((s) => s.score_type === "pole")
      .reduce((sum, s) => sum + s.points, 0)
    const wdcPoints = playerRaceScores
      .filter((s) => s.score_type === "wdc")
      .reduce((sum, s) => sum + s.points, 0)

    return {
      playerId: player.id,
      playerName: player.name,
      racePoints,
      polePoints,
      wdcPoints,
      totalPoints: racePoints + polePoints + wdcPoints,
      scores: playerRaceScores,
    }
  })

  playerScores.sort((a, b) => b.totalPoints - a.totalPoints)

  return NextResponse.json({ leaderboard: playerScores })
}
