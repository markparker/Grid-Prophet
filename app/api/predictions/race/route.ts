import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { raceId, polePrediction, positions } = body

  if (!raceId || !positions || !Array.isArray(positions) || positions.length !== 10) {
    return NextResponse.json({ error: 'Invalid prediction data. Must include 10 positions.' }, { status: 400 })
  }

  const supabase = await createClient()

  // Check if race predictions are still open (before qualifying)
  const { data: race } = await supabase
    .from('races')
    .select('qualifying_date')
    .eq('id', raceId)
    .single()

  if (race?.qualifying_date && new Date(race.qualifying_date) < new Date()) {
    return NextResponse.json({ error: 'Predictions are locked for this race' }, { status: 403 })
  }

  // Upsert the race prediction
  const { data: prediction, error: predError } = await supabase
    .from('race_predictions')
    .upsert(
      {
        player_id: session.playerId,
        race_id: raceId,
        pole_prediction: polePrediction || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id,race_id' }
    )
    .select()
    .single()

  if (predError || !prediction) {
    return NextResponse.json({ error: 'Failed to save prediction' }, { status: 500 })
  }

  // Delete old position predictions and insert new ones
  await supabase
    .from('race_prediction_positions')
    .delete()
    .eq('prediction_id', prediction.id)

  const positionRows = positions.map((p: { driverId: string; position: number }) => ({
    prediction_id: prediction.id,
    driver_id: p.driverId,
    predicted_position: p.position,
  }))

  const { error: posError } = await supabase
    .from('race_prediction_positions')
    .insert(positionRows)

  if (posError) {
    return NextResponse.json({ error: 'Failed to save position predictions' }, { status: 500 })
  }

  return NextResponse.json({ success: true, prediction })
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const raceId = searchParams.get('raceId')

  if (!raceId) {
    return NextResponse.json({ error: 'raceId is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: prediction } = await supabase
    .from('race_predictions')
    .select('*, race_prediction_positions(*)')
    .eq('player_id', session.playerId)
    .eq('race_id', raceId)
    .single()

  return NextResponse.json({ prediction })
}
