import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { TelemetryPageClient } from "@/components/telemetry-page-client"

export default async function TelemetryPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()

  const [{ data: allRaces }, { data: drivers }] = await Promise.all([
    supabase
      .from("races")
      .select("id, round, race_name, country, city, race_date, results_fetched")
      .order("round"),
    supabase.from("drivers").select("*").order("team_name, surname"),
  ])

  // Find the latest completed race and fetch its results for default driver selection
  const now = new Date()
  const completedRaces = (allRaces || [])
    .filter((r) => new Date(r.race_date) < now)
    .sort((a, b) => b.round - a.round)
  const latestRace = completedRaces[0]

  let raceResults: Array<{ driver_id: string; position: number }> = []
  if (latestRace?.results_fetched) {
    const { data } = await supabase
      .from("race_results")
      .select("driver_id, position")
      .eq("race_id", latestRace.id)
      .order("position")
    raceResults = data || []
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Telemetry</h1>
        <p className="text-sm text-muted-foreground">
          Race telemetry data powered by OpenF1. Select a race and driver to explore lap times, positions, and strategy.
        </p>
      </div>

      <TelemetryPageClient
        races={allRaces || []}
        drivers={drivers || []}
        raceResults={raceResults}
      />
    </div>
  )
}
