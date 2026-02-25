import { cookies } from "next/headers"

export interface PlayerSession {
  playerId: string
  groupId: string
  playerName: string
  groupName: string
  avatarUrl?: string
  email?: string
  googleLinked?: boolean
}

const SESSION_COOKIE = "f1_session"

export async function getSession(): Promise<PlayerSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as PlayerSession
  } catch {
    return null
  }
}

export async function setSession(session: PlayerSession) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
