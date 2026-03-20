import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { RaceCard } from "@/components/race-card"

export default async function RacesPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()

  const { data: races } = await supabase
    .from("races")
    .select("*")
    .order("round", { ascending: true })

  // Get all race predictions for this player
  const { data: predictions } = await supabase
    .from("race_predictions")
    .select("race_id")
    .eq("player_id", session.playerId)

  const predictedRaceIds = new Set(
    (predictions || []).map((p) => p.race_id)
  )

  const now = new Date()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          2026 Race Calendar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          24 races across the season. Make your predictions before qualifying.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(races || []).map((race) => {
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
    </div>
  )
}
