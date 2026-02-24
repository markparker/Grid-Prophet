import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { positions } = body

  if (!positions || !Array.isArray(positions) || positions.length !== 22) {
    return NextResponse.json({ error: 'Must predict all 22 drivers' }, { status: 400 })
  }

  const supabase = await createClient()

  // Upsert WDC prediction
  const { data: prediction, error: predError } = await supabase
    .from('wdc_predictions')
    .upsert(
      {
        player_id: session.playerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id' }
    )
    .select()
    .single()

  if (predError || !prediction) {
    return NextResponse.json({ error: 'Failed to save WDC prediction' }, { status: 500 })
  }

  // Delete old and insert new
  await supabase
    .from('wdc_prediction_positions')
    .delete()
    .eq('prediction_id', prediction.id)

  const positionRows = positions.map((p: { driverId: string; position: number }) => ({
    prediction_id: prediction.id,
    driver_id: p.driverId,
    predicted_position: p.position,
  }))

  const { error: posError } = await supabase
    .from('wdc_prediction_positions')
    .insert(positionRows)

  if (posError) {
    return NextResponse.json({ error: 'Failed to save position predictions' }, { status: 500 })
  }

  return NextResponse.json({ success: true, prediction })
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: prediction } = await supabase
    .from('wdc_predictions')
    .select('*, wdc_prediction_positions(*)')
    .eq('player_id', session.playerId)
    .single()

  return NextResponse.json({ prediction })
}
