import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchRaceResults, fetchQualifyingResults } from '@/lib/f1-api'
import { calculateRaceScore, calculatePoleScore } from '@/lib/scoring'

const SEASON = 2026

// Map F1 API driver IDs to our database IDs
function normalizeDriverId(apiDriverId: string): string {
  // The f1api.dev uses camelCase like "maxVerstappen" while we use snake_case
  return apiDriverId
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

export async function POST() {
  const supabase = await createClient()

  // Get all races that haven't had results fetched yet and whose race_date has passed
  const { data: pendingRaces } = await supabase
    .from('races')
    .select('*')
    .or('results_fetched.eq.false,qualifying_fetched.eq.false')
    .lte('race_date', new Date().toISOString().split('T')[0])
    .order('round', { ascending: true })

  if (!pendingRaces || pendingRaces.length === 0) {
    return NextResponse.json({ message: 'No races to sync', synced: 0 })
  }

  // Get all drivers for ID mapping
  const { data: drivers } = await supabase.from('drivers').select('id')
  const validDriverIds = new Set(drivers?.map((d) => d.id) || [])

  let syncedCount = 0

  for (const race of pendingRaces) {
    // Fetch qualifying results if not yet fetched
    if (!race.qualifying_fetched) {
      const qualyResults = await fetchQualifyingResults(SEASON, race.round)
      if (qualyResults && qualyResults.length > 0) {
        const rows = qualyResults
          .map((r) => {
            const driverId = normalizeDriverId(r.driverId || r.Driver?.driverId || '')
            if (!validDriverIds.has(driverId)) return null
            return {
              race_id: race.id,
              driver_id: driverId,
              grid_position: r.gridPosition,
            }
          })
          .filter(Boolean)

        if (rows.length > 0) {
          await supabase
            .from('qualifying_results')
            .upsert(rows as Array<{ race_id: string; driver_id: string; grid_position: number }>, {
              onConflict: 'race_id,driver_id',
            })

          await supabase
            .from('races')
            .update({ qualifying_fetched: true })
            .eq('id', race.id)

          // Score pole predictions
          const poleDriver = rows.find(
            (r) => r && r.grid_position === 1
          )
          if (poleDriver) {
            await scorePoleForRace(supabase, race.id, poleDriver.driver_id)
          }
        }
      }
    }

    // Fetch race results if not yet fetched
    if (!race.results_fetched) {
      const raceResults = await fetchRaceResults(SEASON, race.round)
      if (raceResults && raceResults.length > 0) {
        const rows = raceResults
          .map((r) => {
            const driverId = normalizeDriverId(r.driverId || r.Driver?.driverId || '')
            if (!validDriverIds.has(driverId)) return null
            return {
              race_id: race.id,
              driver_id: driverId,
              position: r.position,
              points: r.points,
            }
          })
          .filter(Boolean)

        if (rows.length > 0) {
          await supabase
            .from('race_results')
            .upsert(
              rows as Array<{
                race_id: string
                driver_id: string
                position: number
                points: number
              }>,
              { onConflict: 'race_id,driver_id' }
            )

          await supabase
            .from('races')
            .update({ results_fetched: true })
            .eq('id', race.id)

          // Score race predictions for all players in all groups
          await scoreRaceForAllPlayers(supabase, race.id)
          syncedCount++
        }
      }
    }
  }

  return NextResponse.json({ message: `Synced ${syncedCount} races`, synced: syncedCount })
}

async function scorePoleForRace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  raceId: string,
  poleDriverId: string
) {
  // Get all predictions for this race
  const { data: predictions } = await supabase
    .from('race_predictions')
    .select('player_id, pole_prediction')
    .eq('race_id', raceId)

  if (!predictions) return

  for (const pred of predictions) {
    const points = calculatePoleScore(pred.pole_prediction, poleDriverId)
    await supabase.from('player_scores').upsert(
      {
        player_id: pred.player_id,
        race_id: raceId,
        score_type: 'pole',
        points,
        breakdown: { predicted: pred.pole_prediction, actual: poleDriverId },
      },
      { onConflict: 'player_id,race_id,score_type' }
    )
  }
}

async function scoreRaceForAllPlayers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  raceId: string
) {
  // Get actual results (top 10)
  const { data: actualResults } = await supabase
    .from('race_results')
    .select('driver_id, position')
    .eq('race_id', raceId)
    .lte('position', 10)
    .order('position', { ascending: true })

  if (!actualResults || actualResults.length === 0) return

  // Get all predictions for this race
  const { data: predictions } = await supabase
    .from('race_predictions')
    .select('player_id, id')
    .eq('race_id', raceId)

  if (!predictions) return

  for (const pred of predictions) {
    const { data: positions } = await supabase
      .from('race_prediction_positions')
      .select('driver_id, predicted_position')
      .eq('prediction_id', pred.id)

    if (!positions) continue

    const { points, breakdown } = calculateRaceScore(positions, actualResults)

    await supabase.from('player_scores').upsert(
      {
        player_id: pred.player_id,
        race_id: raceId,
        score_type: 'race',
        points,
        breakdown,
      },
      { onConflict: 'player_id,race_id,score_type' }
    )
  }
}
