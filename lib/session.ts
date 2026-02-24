import { cookies } from 'next/headers'

export interface PlayerSession {
  playerId: string
  groupId: string
  playerName: string
  groupName: string
}

const COOKIE_NAME = 'f1_session'

export async function getSession(): Promise<PlayerSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAME)
  if (!sessionCookie?.value) return null
  try {
    return JSON.parse(sessionCookie.value) as PlayerSession
  } catch {
    return null
  }
}

export async function setSession(session: PlayerSession) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
