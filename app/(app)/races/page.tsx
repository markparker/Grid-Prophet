import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { RaceCard } from "@/components/race-card"

export default async function RacesPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()

  // Fetch races and predictions in parallel
  const [{ data: races, error: racesError }, { data: predictions }] = await Promise.all([
    // Ordered by date, not by round: a rescheduled race keeps its original
    // round number, so ordering by round would list it in the wrong place
    // (the 2026 Bahrain GP moved from April to October).
    supabase
      .from("races")
      .select("*")
      .order("race_date", { ascending: true }),
    supabase
      .from("race_predictions")
      .select("race_id")
      .eq("player_id", session.playerId),
  ])

  // Debug: log any errors
  if (racesError) {
    console.log("[v0] Races query error:", racesError)
  }

  const predictedRaceIds = new Set(
    (predictions || []).map((p) => p.race_id)
  )

  const now = new Date()

  // Counted rather than hardcoded — races do get canceled mid-season.
  const scheduledCount = (races || []).filter((r) => r.status !== "canceled").length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          2026 Race Calendar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {scheduledCount} races across the season. Make your predictions before qualifying.
        </p>
      </div>

      {(!races || races.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No races found for this season.</p>
          <p className="text-sm text-muted-foreground mt-1">Check back soon for the race calendar.</p>
        </div>
      ) : (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {races.map((race) => {
          const raceDate = new Date(race.race_date)
          const qualyDate = race.qualifying_date
            ? new Date(race.qualifying_date)
            : raceDate
          const isPast = raceDate < now
          const isLocked = qualyDate < now
          const hasPrediction = predictedRaceIds.has(race.id)

          let status: "upcoming" | "locked" | "completed" | "results" | "canceled"
          if (race.status === "canceled") {
            status = "canceled"
          } else if (race.results_fetched) {
            status = "results"
          } else if (isPast) {
            status = "completed"
          } else if (isLocked) {
            status = "locked"
          } else {
            status = "upcoming"
          }

          return (
            <RaceCard
              key={race.id}
              race={race}
              status={status}
              hasPrediction={hasPrediction}
            />
          )
        })}
      </div>
      )}
    </div>
  )
}
