import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { WdcPredictionForm } from "@/components/wdc-prediction-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"

export default async function WdcPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()

  // Get all drivers
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("team_name", { ascending: true })

  // Get existing WDC prediction
  const { data: existingPrediction } = await supabase
    .from("wdc_predictions")
    .select("*, wdc_prediction_positions(*)")
    .eq("player_id", session.playerId)
    .single()

  // Get actual WDC standings from race_results (aggregated points)
  const { data: raceResults } = await supabase
    .from("race_results")
    .select("driver_id, points")

  // Aggregate points per driver
  const driverPoints = new Map<string, number>()
  raceResults?.forEach((r) => {
    driverPoints.set(
      r.driver_id,
      (driverPoints.get(r.driver_id) || 0) + Number(r.points)
    )
  })

  const actualStandings = (drivers || [])
    .map((d) => ({
      ...d,
      totalPoints: driverPoints.get(d.id) || 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)

  const hasResults = raceResults && raceResults.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          World Drivers{"'"} Championship
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Predict the final 2026 driver standings. You can update this anytime
          before the last race.
        </p>
      </div>

      {/* Current Actual Standings */}
      {hasResults && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              <Trophy className="h-4 w-4 text-f1-yellow" />
              Current WDC Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              {actualStandings.slice(0, 10).map((driver, i) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-xs font-bold text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {driver.name} {driver.surname}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {driver.team_name}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {driver.totalPoints}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      pts
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WDC Prediction Form */}
      <WdcPredictionForm
        drivers={drivers || []}
        existingPrediction={existingPrediction}
      />
    </div>
  )
}
