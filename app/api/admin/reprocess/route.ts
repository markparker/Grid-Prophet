import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { scoreRacePrediction, scorePolePrediction } from "@/lib/scoring"
import {
  fetchRaceResultsDetailed,
  fetchSeasonCalendar,
  resolveCalendarEntry,
} from "@/lib/f1-api"

const SEASON = 2026

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { raceId, round } = await request.json()
  if (!raceId || !round) {
    return NextResponse.json({ error: "Missing raceId or round" }, { status: 400 })
  }

  const supabase = await createClient()

  // Resolve the upstream round by race date. Our round numbers are not the
  // upstream's — reprocessing by round number previously overwrote races with
  // a different race's results when the upstream calendar shifted.
  const { data: race } = await supabase
    .from("races")
    .select("id, race_name, race_date")
    .eq("id", raceId)
    .single()

  if (!race) {
    return NextResponse.json({ error: "Race not found", raceId }, { status: 404 })
  }

  const calendar = await fetchSeasonCalendar(SEASON)
  if (!calendar.ok) {
    return NextResponse.json(
      { error: `Could not load upstream season calendar: ${calendar.detail}` },
      { status: 502 }
    )
  }

  const entry = resolveCalendarEntry(calendar.entries, race.race_date)
  if (!entry) {
    return NextResponse.json(
      {
        error: `"${race.race_name}" (${race.race_date}) is not in the upstream season calendar, so its results cannot be sourced from the F1 API.`,
        round,
      },
      { status: 404 }
    )
  }

  // Verifying the date guards against writing another race's results.
  const outcome = await fetchRaceResultsDetailed(SEASON, entry.round, race.race_date)
  if (!outcome.ok) {
    return NextResponse.json(
      {
        error: `No usable results from F1 API for this race: ${outcome.detail}`,
        round,
        upstreamRound: entry.round,
      },
      { status: outcome.reason === "empty" ? 404 : 502 }
    )
  }
  const raceResults = outcome.data

  // Get driver mapping
  const { data: drivers } = await supabase.from("drivers").select("id, short_name, surname")
  const driverMap = createDriverMap(drivers || [])

  // Delete existing race results for this race
  await supabase.from("race_results").delete().eq("race_id", raceId)

  // Insert fresh results
  for (const rr of raceResults) {
    const driverId = driverMap.get(rr.driverId.toLowerCase()) || rr.driverId
    await supabase.from("race_results").upsert(
      {
        race_id: raceId,
        driver_id: driverId,
        position: rr.position,
        points: rr.points,
      },
      { onConflict: "race_id,driver_id" }
    )
  }

  // Delete existing scores for this race
  await supabase.from("player_scores").delete().eq("race_id", raceId)

  // Re-score all predictions
  await scoreAllPredictions(supabase, raceId)

  // Mark as results fetched (in case it wasn't)
  await supabase.from("races").update({ results_fetched: true }).eq("id", raceId)

  return NextResponse.json({
    success: true,
    message: `Reprocessed "${race.race_name}" (our round ${round}, upstream round ${entry.round}) with ${raceResults.length} results`,
    results: raceResults.length
  })
}

function createDriverMap(
  drivers: Array<{ id: string; short_name: string; surname: string }>
): Map<string, string> {
  const map = new Map<string, string>()
  for (const d of drivers) {
    map.set(d.id, d.id)
    map.set(d.short_name.toLowerCase(), d.id)
    map.set(d.surname.toLowerCase(), d.id)
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
