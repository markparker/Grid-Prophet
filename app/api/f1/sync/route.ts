import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  fetchRaceResultsDetailed,
  fetchQualifyingResultsDetailed,
  fetchSeasonCalendar,
  resolveCalendarEntry,
  type F1Fetch,
} from "@/lib/f1-api"
import {
  scoreRacePrediction,
  scorePolePrediction,
} from "@/lib/scoring"

const SEASON = 2026

/** Short human-readable explanation of why an upstream fetch produced no usable data. */
function describeFailure(outcome: Extract<F1Fetch<unknown>, { ok: false }>): string {
  switch (outcome.reason) {
    case "http":
      return `upstream HTTP ${outcome.status} — ${outcome.detail}`
    case "network":
      return `upstream unreachable — ${outcome.detail}`
    case "empty":
      return `upstream returned no data — ${outcome.detail}`
    case "mismatch":
      return `wrong race returned — ${outcome.detail}`
  }
}

const NOT_IN_CALENDAR =
  "not present in the upstream season calendar — this race is missing from the feed, so results cannot be sourced from it"

/**
 * Dry-run probe. Reports exactly what the upstream F1 API returns for every
 * race that is due a sync, without writing anything. Use this to tell
 * "results aren't published yet" apart from "the feed is broken".
 */
export async function GET() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data: pendingRaces } = await supabase
    .from("races")
    .select("*")
    .lte("race_date", today)
    .eq("results_fetched", false)
    .order("round", { ascending: true })

  const calendar = await fetchSeasonCalendar(SEASON)
  if (!calendar.ok) {
    return NextResponse.json(
      { season: SEASON, today, error: `calendar unavailable: ${describeFailure(calendar)}` },
      { status: 502 }
    )
  }

  const probes = []
  for (const race of pendingRaces || []) {
    const entry = resolveCalendarEntry(calendar.entries, race.race_date)
    if (!entry) {
      probes.push({
        round: race.round,
        name: race.race_name,
        raceDate: race.race_date,
        upstreamRound: null,
        problem: NOT_IN_CALENDAR,
      })
      continue
    }

    const [raceOutcome, qualyOutcome] = await Promise.all([
      fetchRaceResultsDetailed(SEASON, entry.round, race.race_date),
      fetchQualifyingResultsDetailed(SEASON, entry.round, race.race_date),
    ])
    probes.push({
      round: race.round,
      name: race.race_name,
      raceDate: race.race_date,
      upstreamRound: entry.round,
      race: raceOutcome.ok
        ? { ok: true, count: raceOutcome.data.length }
        : { ok: false, problem: describeFailure(raceOutcome) },
      qualifying: qualyOutcome.ok
        ? { ok: true, count: qualyOutcome.data.length }
        : { ok: false, problem: describeFailure(qualyOutcome) },
    })
  }

  return NextResponse.json({
    season: SEASON,
    today,
    upstreamRaces: calendar.entries.length,
    pending: probes.length,
    probes,
  })
}

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
    return NextResponse.json({ 
      message: "No pending races to sync", 
      synced: 0,
      checked: [],
      today
    })
  }

  const calendar = await fetchSeasonCalendar(SEASON)
  if (!calendar.ok) {
    return NextResponse.json(
      {
        message: `Could not load the upstream season calendar: ${describeFailure(calendar)}`,
        synced: 0,
        checked: [],
        today,
      },
      { status: 502 }
    )
  }

  let synced = 0
  const checked: Array<{
    round: number
    name: string
    upstreamRound: number | null
    qualyFetched: boolean
    resultsFetched: boolean
    apiHasResults: boolean
    problem?: string
  }> = []

  for (const race of pendingRaces) {
    let qualyFetchedThisRun = false
    let apiHasResults = false
    let problem: string | undefined

    // Our round numbers do not address the same races upstream — resolve by date.
    const entry = resolveCalendarEntry(calendar.entries, race.race_date)
    if (!entry) {
      checked.push({
        round: race.round,
        name: race.race_name,
        upstreamRound: null,
        qualyFetched: race.qualifying_fetched,
        resultsFetched: false,
        apiHasResults: false,
        problem: NOT_IN_CALENDAR,
      })
      continue
    }

    // Fetch qualifying results
    if (!race.qualifying_fetched) {
      const qualyOutcome = await fetchQualifyingResultsDetailed(
        SEASON,
        entry.round,
        race.race_date
      )
      const qualyResults = qualyOutcome.ok ? qualyOutcome.data : null
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
        qualyFetchedThisRun = true
      }
    }

    // Fetch race results
    const raceOutcome = await fetchRaceResultsDetailed(SEASON, entry.round, race.race_date)
    const raceResults = raceOutcome.ok ? raceOutcome.data : null
    apiHasResults = !!(raceResults && raceResults.length > 0)
    if (!raceOutcome.ok) problem = describeFailure(raceOutcome)

    if (apiHasResults && raceResults) {
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

    checked.push({
      round: race.round,
      name: race.race_name,
      upstreamRound: entry.round,
      qualyFetched: race.qualifying_fetched || qualyFetchedThisRun,
      resultsFetched: apiHasResults,
      apiHasResults,
      ...(problem ? { problem } : {}),
    })
  }

  const failures = checked.filter((c) => c.problem)
  let message: string
  if (synced > 0) {
    message = `Synced ${synced} race(s)`
  } else if (failures.length > 0) {
    // Surface the actual upstream reason instead of always blaming timing.
    message = `Could not sync ${failures.length} race(s). ${failures
      .map((f) => `Round ${f.round} (${f.name}): ${f.problem}`)
      .join(" | ")}`
  } else {
    message = `Checked ${checked.length} race(s) but F1 API has no results yet. Results typically appear 1-2 hours after race ends.`
  }

  return NextResponse.json({ message, synced, checked, today })
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
