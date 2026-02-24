import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { RacePredictionForm } from "@/components/race-prediction-form"
import { ResultComparison } from "@/components/result-comparison"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Calendar as CalendarIcon, Zap, Lock } from "lucide-react"
import { Countdown } from "@/components/countdown"

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ round: string }>
}) {
  const { round } = await params
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()
  const roundNum = parseInt(round, 10)

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
    .order("team_name", { ascending: true })

  // Get player's existing prediction
  const { data: existingPrediction } = await supabase
    .from("race_predictions")
    .select("*, race_prediction_positions(*)")
    .eq("player_id", session.playerId)
    .eq("race_id", race.id)
    .single()

  // Check if predictions are locked
  const qualyDate = race.qualifying_date
    ? new Date(race.qualifying_date)
    : new Date(race.race_date)
  const isLocked = qualyDate < new Date()

  // Get results if available
  let raceResults = null
  let qualyResults = null
  if (race.results_fetched) {
    const { data: rr } = await supabase
      .from("race_results")
      .select("*, drivers(*)")
      .eq("race_id", race.id)
      .order("position", { ascending: true })
    raceResults = rr
  }
  if (race.qualifying_fetched) {
    const { data: qr } = await supabase
      .from("qualifying_results")
      .select("*, drivers(*)")
      .eq("race_id", race.id)
      .order("grid_position", { ascending: true })
    qualyResults = qr
  }

  // Get group predictions + scores for this race
  const { data: groupPlayers } = await supabase
    .from("players")
    .select("id, name")
    .eq("group_id", session.groupId)

  const { data: groupScores } = await supabase
    .from("player_scores")
    .select("*")
    .eq("race_id", race.id)
    .in("player_id", (groupPlayers || []).map((p) => p.id))

  const raceDate = new Date(race.race_date)

  return (
    <div className="flex flex-col gap-6">
      {/* Race Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-medium text-primary">
                Round {race.round}
              </span>
              {race.is_sprint && (
                <span className="flex items-center gap-1 rounded-full bg-f1-yellow/10 px-2.5 py-0.5 text-xs font-bold text-f1-yellow">
                  <Zap className="h-3 w-3" />
                  Sprint Weekend
                </span>
              )}
              {isLocked && !race.results_fetched && (
                <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {race.race_name}
            </h1>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {race.city}, {race.country}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {raceDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown if upcoming */}
        {!isLocked && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center gap-2 p-4 sm:flex-row sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Predictions lock at qualifying
                </p>
                <p className="text-xs text-muted-foreground">
                  {qualyDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  at{" "}
                  {qualyDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Countdown targetDate={qualyDate.toISOString()} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Comparison (if results available) */}
      {race.results_fetched && raceResults && (
        <ResultComparison
          raceResults={raceResults}
          qualyResults={qualyResults}
          prediction={existingPrediction}
          groupPlayers={groupPlayers || []}
          groupScores={groupScores || []}
          currentPlayerId={session.playerId}
          drivers={drivers || []}
        />
      )}

      {/* Prediction Form (if not locked, or show existing) */}
      {!race.results_fetched && (
        <RacePredictionForm
          raceId={race.id}
          drivers={drivers || []}
          existingPrediction={existingPrediction}
          isLocked={isLocked}
        />
      )}
    </div>
  )
}
