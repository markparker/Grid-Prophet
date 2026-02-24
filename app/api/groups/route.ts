import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setSession } from '@/lib/session'

// POST - Create a new group or join an existing one
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, playerName, groupName, inviteCode } = body

  if (!playerName || typeof playerName !== 'string' || playerName.trim().length < 1) {
    return NextResponse.json({ error: 'Player name is required' }, { status: 400 })
  }

  const supabase = await createClient()

  if (action === 'create') {
    if (!groupName || typeof groupName !== 'string' || groupName.trim().length < 1) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Generate a random 6-char invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: groupName.trim(), invite_code: code })
      .select()
      .single()

    if (groupError) {
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }

    // Create the player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({ group_id: group.id, name: playerName.trim() })
      .select()
      .single()

    if (playerError) {
      return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
    }

    await setSession({
      playerId: player.id,
      groupId: group.id,
      playerName: player.name,
      groupName: group.name,
    })

    return NextResponse.json({ group, player, inviteCode: code })
  }

  if (action === 'join') {
    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select()
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    // Check if player name already exists in this group
    const { data: existingPlayer } = await supabase
      .from('players')
      .select()
      .eq('group_id', group.id)
      .eq('name', playerName.trim())
      .single()

    if (existingPlayer) {
      // Log them in as the existing player
      await setSession({
        playerId: existingPlayer.id,
        groupId: group.id,
        playerName: existingPlayer.name,
        groupName: group.name,
      })
      return NextResponse.json({ group, player: existingPlayer })
    }

    // Create new player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({ group_id: group.id, name: playerName.trim() })
      .select()
      .single()

    if (playerError) {
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
    }

    await setSession({
      playerId: player.id,
      groupId: group.id,
      playerName: player.name,
      groupName: group.name,
    })

    return NextResponse.json({ group, player })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
