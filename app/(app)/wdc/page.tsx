import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { WdcPredictionForm } from "@/components/wdc-prediction-form"
import { WdcCountdown } from "@/components/wdc-countdown"
import { fetchDriverStandings } from "@/lib/f1-api"

// WDC predictions lock when qualifying for the first race begins
const WDC_LOCK_DATE = "2026-03-07T05:00:00Z" // Australian GP qualifying

export default async function WdcPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()
  const isLocked = new Date() >= new Date(WDC_LOCK_DATE)

  // Fetch drivers, existing prediction, and live standings in parallel
  const [{ data: drivers }, { data: prediction }, liveStandings] = await Promise.all([
    supabase.from("drivers").select("*").order("team_name, surname"),
    supabase
      .from("wdc_predictions")
      .select("*, wdc_prediction_positions(*)")
      .eq("player_id", session.playerId)
      .single(),
    fetchDriverStandings(2026),
  ])

  // Build current standings: prefer live API data, fall back to our own race_results
  let currentStandings: Array<{ driver_id: string; points: number; position: number; source: "live" | "local" }> = []

  if (liveStandings && liveStandings.length > 0) {
    currentStandings = liveStandings.map((s, i) => ({
      driver_id: s.driverId,
      points: s.points,
      position: s.position || i + 1,
      source: "live" as const,
    }))
  } else {
    const { data: raceResults } = await supabase
      .from("race_results")
      .select("driver_id, points")

    const pointsMap = new Map<string, number>()
    ;(raceResults || []).forEach((r) => {
      pointsMap.set(r.driver_id, (pointsMap.get(r.driver_id) || 0) + Number(r.points || 0))
    })

    currentStandings = (drivers || [])
      .map((d) => ({
        driver_id: d.id,
        points: pointsMap.get(d.id) || 0,
        position: 0,
        source: "local" as const,
      }))
      .sort((a, b) => b.points - a.points)
      .map((s, i) => ({ ...s, position: i + 1 }))
  }

  const hasLiveData = currentStandings.length > 0 && currentStandings.some((s) => s.points > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          World Drivers&apos; Championship
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLocked
            ? "The season has started. View live standings and see how your prediction compares."
            : "Predict the final 2026 WDC standings before qualifying begins for the Australian GP."}
        </p>
      </div>

      {/* Countdown -- only show if not yet locked */}
      {!isLocked && <WdcCountdown lockDate={WDC_LOCK_DATE} />}

      <WdcPredictionForm
        drivers={drivers || []}
        existingPrediction={prediction}
        currentStandings={currentStandings}
        isLocked={isLocked}
        hasLiveData={hasLiveData}
        lockDate={WDC_LOCK_DATE}
      />
    </div>
  )
}
