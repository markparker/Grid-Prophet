import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchRaceResults, fetchQualifyingResults } from "@/lib/f1-api"
import {
  scoreRacePrediction,
  scorePolePrediction,
} from "@/lib/scoring"

export async function POST() {
  const supabase = await createClient()

  // Get all races that have passed but don't have results yet
  const today = new Date().toISOString().split("T")[0]
  const { data: pendingRaces } = await supabase
    .from("races")
    .select("*")
    .lte("race_date", today)
    .eq("results_fetched", false)
    .order("round", { ascending: true })

  if (!pendingRaces || pendingRaces.length === 0) {
    return NextResponse.json({ message: "No pending races to sync", synced: 0 })
  }

  let synced = 0

  for (const race of pendingRaces) {
    // Fetch qualifying results
    if (!race.qualifying_fetched) {
      const qualyResults = await fetchQualifyingResults(2026, race.round)
      if (qualyResults && qualyResults.length > 0) {
        // Map F1 API driver IDs to our driver IDs
        const { data: drivers } = await supabase.from("drivers").select("id, short_name, surname")
        const driverMap = createDriverMap(drivers || [])

        for (const qr of qualyResults) {
          const driverId = driverMap.get(qr.driverId.toLowerCase()) || qr.driverId
          await supabase
            .from("qualifying_results")
            .upsert(
              {
                race_id: race.id,
                driver_id: driverId,
                grid_position: qr.gridPosition,
              },
              { onConflict: "race_id,driver_id" }
            )
        }
        await supabase
          .from("races")
          .update({ qualifying_fetched: true })
          .eq("id", race.id)
      }
    }

    // Fetch race results
    const raceResults = await fetchRaceResults(2026, race.round)
    if (raceResults && raceResults.length > 0) {
      const { data: drivers } = await supabase.from("drivers").select("id, short_name, surname")
      const driverMap = createDriverMap(drivers || [])

      for (const rr of raceResults) {
        const driverId = driverMap.get(rr.driverId.toLowerCase()) || rr.driverId
        await supabase
          .from("race_results")
          .upsert(
            {
              race_id: race.id,
              driver_id: driverId,
              position: rr.position,
              points: rr.points,
            },
            { onConflict: "race_id,driver_id" }
          )
      }

      await supabase
        .from("races")
        .update({ results_fetched: true })
        .eq("id", race.id)

      // Now score all predictions for this race
      await scoreAllPredictions(supabase, race.id)
      synced++
    }
  }

  return NextResponse.json({ message: `Synced ${synced} race(s)`, synced })
}

function createDriverMap(
  drivers: Array<{ id: string; short_name: string; surname: string }>
): Map<string, string> {
  const map = new Map<string, string>()
  for (const d of drivers) {
    map.set(d.id, d.id)
    map.set(d.short_name.toLowerCase(), d.id)
    map.set(d.surname.toLowerCase(), d.id)
    // Also map common f1api formats like "max_verstappen"
    const nameKey = d.id.replace(/_/g, "").toLowerCase()
    map.set(nameKey, d.id)
  }
  return map
}

async function scoreAllPredictions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  raceId: string
) {
  // Get all race results
  const { data: results } = await supabase
    .from("race_results")
    .select("driver_id, position")
    .eq("race_id", raceId)
    .order("position")

  // Get qualifying results for pole
  const { data: qualyResults } = await supabase
    .from("qualifying_results")
    .select("driver_id, grid_position")
    .eq("race_id", raceId)
    .order("grid_position")

  if (!results || results.length === 0) return

  const pole = qualyResults?.[0]?.driver_id || null

  // Get all predictions for this race
  const { data: predictions } = await supabase
    .from("race_predictions")
    .select("*, race_prediction_positions(*)")
    .eq("race_id", raceId)

  if (!predictions) return

  for (const pred of predictions) {
    const positions = pred.race_prediction_positions || []
    const raceScore = scoreRacePrediction(
      positions.map((p: { driver_id: string; predicted_position: number }) => ({
        driver_id: p.driver_id,
        predicted_position: p.predicted_position,
      })),
      results.map((r: { driver_id: string; position: number }) => ({
        driver_id: r.driver_id,
        position: r.position,
      }))
    )

    const poleScore = scorePolePrediction(pred.pole_prediction, pole)

    // Upsert race score
    await supabase.from("player_scores").upsert(
      {
        player_id: pred.player_id,
        race_id: raceId,
        score_type: "race",
        points: raceScore.total,
        breakdown: raceScore,
      },
      { onConflict: "player_id,race_id,score_type" }
    )

    // Upsert pole score
    await supabase.from("player_scores").upsert(
      {
        player_id: pred.player_id,
        race_id: raceId,
        score_type: "pole",
        points: poleScore,
        breakdown: { correct: poleScore > 0, predicted: pred.pole_prediction, actual: pole },
      },
      { onConflict: "player_id,race_id,score_type" }
    )
  }
}
