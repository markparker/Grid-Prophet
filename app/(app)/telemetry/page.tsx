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
      .select("id, round, race_name, country, race_date, results_fetched")
      .order("round"),
    supabase.from("drivers").select("*").order("team_name, surname"),
  ])

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
      />
    </div>
  )
}
