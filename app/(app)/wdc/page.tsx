import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { WdcPredictionForm } from "@/components/wdc-prediction-form"

export default async function WdcPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()

  // Get all drivers
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("team_name, surname")

  // Get existing WDC prediction
  const { data: prediction } = await supabase
    .from("wdc_predictions")
    .select("*, wdc_prediction_positions(*)")
    .eq("player_id", session.playerId)
    .single()

  // Get actual current WDC standings from race results
  const { data: raceResults } = await supabase
    .from("race_results")
    .select("driver_id, points")

  // Aggregate driver points
  const driverPointsMap = new Map<string, number>()
  ;(raceResults || []).forEach((r) => {
    const current = driverPointsMap.get(r.driver_id) || 0
    driverPointsMap.set(r.driver_id, current + Number(r.points || 0))
  })

  const currentStandings = (drivers || [])
    .map((d) => ({
      driver_id: d.id,
      points: driverPointsMap.get(d.id) || 0,
    }))
    .sort((a, b) => b.points - a.points)
    .map((s, i) => ({ ...s, position: i + 1 }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          World Drivers&apos; Championship Prediction
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Predict the final 2026 WDC standings. Drag drivers to reorder. You
          can update this at any time before the last race.
        </p>
      </div>

      <WdcPredictionForm
        drivers={drivers || []}
        existingPrediction={prediction}
        currentStandings={currentStandings}
      />
    </div>
  )
}
