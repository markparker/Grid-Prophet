import { cookies } from "next/headers"
import { createHmac, timingSafeEqual } from "node:crypto"

export interface PlayerSession {
  playerId: string
  groupId: string
  playerName: string
  groupName: string
  avatarUrl?: string
  email?: string
  googleLinked?: boolean
  isAdmin?: boolean
}

const SESSION_COOKIE = "f1_league_session"
const LEGACY_SESSION_COOKIE = "f1_session"

/**
 * Sessions are a signed cookie: "<base64url(json)>.<hmac>".
 *
 * They used to be bare JSON, which the server parsed and trusted. Anyone could
 * set the cookie by hand and become any player — or set isAdmin and reach the
 * admin pages and /api/admin/*. httpOnly stops scripts reading a cookie; it
 * does nothing to stop someone writing one. Nothing else stood behind it
 * either: the Clerk middleware only covers /login, /join and /auth/*, and the
 * server's Supabase client uses the service role key, so RLS is bypassed.
 *
 * An unsigned cookie is now rejected, so sessions issued before this change
 * are not accepted and those players sign in again.
 */

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. Sessions cannot be signed or verified without it."
    )
  }
  return secret
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url")
}

/** Constant-time compare, so a wrong signature leaks nothing through timing. */
function signaturesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export async function getSession(): Promise<PlayerSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null

  // Split on the last dot: the payload is base64url and never contains one.
  const separator = raw.lastIndexOf(".")
  if (separator <= 0 || separator === raw.length - 1) return null

  const payload = raw.slice(0, separator)
  const signature = raw.slice(separator + 1)

  let expected: string
  try {
    expected = signPayload(payload)
  } catch (error) {
    // Fail closed rather than throwing on every authenticated request. Signing
    // in surfaces the misconfiguration loudly, because setSession rethrows.
    console.error("[session] cannot verify session:", error)
    return null
  }

  if (!signaturesMatch(signature, expected)) return null

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PlayerSession
  } catch {
    return null
  }
}

export async function setSession(session: PlayerSession) {
  const cookieStore = await cookies()
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url")

  cookieStore.set(SESSION_COOKIE, `${payload}.${signPayload(payload)}`, {
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
  // Also drop the pre-Clerk cookie, which is no longer read but may linger.
  cookieStore.delete(LEGACY_SESSION_COOKIE)
}
