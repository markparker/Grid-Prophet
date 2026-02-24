import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { RacePredictionForm } from "@/components/race-prediction-form"
import { ResultComparison } from "@/components/result-comparison"
import { Countdown } from "@/components/countdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ round: string }>
}) {
  const { round } = await params
  const session = await getSession()
  if (!session) redirect("/")

  const roundNum = parseInt(round, 10)
  const supabase = await createClient()

  // Get race
  const { data: race } = await supabase
    .from("races")
    .select("*")
    .eq("round", roundNum)
    .single()

  if (!race) notFound()

  // Get all drivers
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("team_name, surname")

  // Get existing prediction
  const { data: prediction } = await supabase
    .from("race_predictions")
    .select("*, race_prediction_positions(*)")
    .eq("player_id", session.playerId)
    .eq("race_id", race.id)
    .single()

  // Get race results if available
  const { data: raceResults } = await supabase
    .from("race_results")
    .select("*")
    .eq("race_id", race.id)
    .order("position")

  // Get qualifying results
  const { data: qualyResults } = await supabase
    .from("qualifying_results")
    .select("*")
    .eq("race_id", race.id)
    .order("grid_position")

  // Get all group predictions (if results are in)
  let groupPredictions: Array<{
    playerName: string
    playerId: string
    polePrediction: string | null
    positions: Array<{ driver_id: string; predicted_position: number }>
    score: number
    poleScore: number
  }> = []

  if (race.results_fetched) {
    const { data: players } = await supabase
      .from("players")
      .select("id, name")
      .eq("group_id", session.groupId)

    const { data: allPredictions } = await supabase
      .from("race_predictions")
      .select("*, race_prediction_positions(*)")
      .eq("race_id", race.id)

    const { data: allScores } = await supabase
      .from("player_scores")
      .select("*")
      .eq("race_id", race.id)

    groupPredictions = (players || [])
      .map((player) => {
        const pred = (allPredictions || []).find(
          (p) => p.player_id === player.id
        )
        const raceScore = (allScores || []).find(
          (s) => s.player_id === player.id && s.score_type === "race"
        )
        const poleScore = (allScores || []).find(
          (s) => s.player_id === player.id && s.score_type === "pole"
        )
        return {
          playerName: player.name,
          playerId: player.id,
          polePrediction: pred?.pole_prediction || null,
          positions: (pred?.race_prediction_positions || []).map(
            (p: { driver_id: string; predicted_position: number }) => ({
              driver_id: p.driver_id,
              predicted_position: p.predicted_position,
            })
          ),
          score: raceScore?.points || 0,
          poleScore: poleScore?.points || 0,
        }
      })
      .filter((p) => p.positions.length > 0)
      .sort(
        (a, b) =>
          b.score + b.poleScore - (a.score + a.poleScore)
      )
  }

  const now = new Date()
  const qualyDate = race.qualifying_date
    ? new Date(race.qualifying_date)
    : new Date(race.race_date)
  const isLocked = qualyDate < now
  const hasResults = race.results_fetched && raceResults && raceResults.length > 0

  const driverMap = new Map(
    (drivers || []).map((d) => [d.id, d])
  )

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/races"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        All Races
      </Link>

      {/* Race Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            ROUND {race.round}
          </Badge>
          {race.is_sprint && (
            <Badge className="bg-f1-yellow/10 text-f1-yellow border-f1-yellow/20">
              SPRINT WEEKEND
            </Badge>
          )}
          {hasResults && (
            <Badge className="bg-f1-green/10 text-f1-green border-f1-green/20">
              RESULTS IN
            </Badge>
          )}
          {!isLocked && !hasResults && (
            <Badge className="bg-f1-green/10 text-f1-green border-f1-green/20">
              PREDICTIONS OPEN
            </Badge>
          )}
          {isLocked && !hasResults && (
            <Badge className="bg-f1-yellow/10 text-f1-yellow border-f1-yellow/20">
              LOCKED
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {race.race_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {race.city}, {race.country} &middot;{" "}
          {new Date(race.race_date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        {!isLocked && (
          <div className="pt-1">
            <Countdown
              targetDate={race.qualifying_date || race.race_date}
              label="Predictions lock in"
            />
          </div>
        )}
      </div>

      {/* Results View */}
      {hasResults && (
        <ResultComparison
          raceResults={raceResults}
          qualyResults={qualyResults || []}
          driverMap={driverMap}
          groupPredictions={groupPredictions}
          currentPlayerId={session.playerId}
        />
      )}

      {/* Prediction Form (if not locked or showing existing) */}
      {!hasResults && (
        <RacePredictionForm
          raceId={race.id}
          drivers={drivers || []}
          existingPrediction={prediction}
          isLocked={isLocked}
        />
      )}
    </div>
  )
}
