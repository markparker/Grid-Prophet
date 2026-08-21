const BASE_URL = "https://f1api.dev/api"

interface F1ApiResponse {
  driverId?: string
  driver?: { driverId?: string }
  position?: number | string
  points?: number | string
  gridPosition?: number | string
}

interface F1RaceResult {
  driverId: string
  position: number
  points: number
}

interface F1QualifyingResult {
  driverId: string
  gridPosition: number
}

/**
 * Result of an upstream fetch. Distinguishes the failure modes the old
 * `T[] | null` return type collapsed into a single silent `null`.
 *
 * "mismatch" guards against the upstream renumbering its calendar: the round
 * we asked for returned a different race than the one we expected.
 */
export type F1Fetch<T> =
  | { ok: true; data: T[]; meta: F1RaceMeta }
  | { ok: false; reason: "http"; status: number; detail: string }
  | { ok: false; reason: "network"; detail: string }
  | { ok: false; reason: "empty"; detail: string }
  | { ok: false; reason: "mismatch"; detail: string }

export interface F1RaceMeta {
  round: number
  date: string | null
  raceName: string | null
}

export interface F1CalendarEntry {
  round: number
  raceId: string | null
  raceName: string | null
  /** Scheduled date of the race itself (not practice/qualifying). */
  date: string | null
}

async function fetchJson(
  url: string
): Promise<
  { ok: true; data: unknown } | { ok: false; result: Extract<F1Fetch<never>, { ok: false }> }
> {
  let res: Response
  try {
    res = await fetch(url, { cache: "no-store" })
  } catch (err) {
    return {
      ok: false,
      result: {
        ok: false,
        reason: "network",
        detail: err instanceof Error ? err.message : String(err),
      },
    }
  }

  if (!res.ok) {
    // Include a short body preview — upstream error payloads usually explain why.
    const body = await res.text().catch(() => "")
    return {
      ok: false,
      result: {
        ok: false,
        reason: "http",
        status: res.status,
        detail: `${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`,
      },
    }
  }

  try {
    return { ok: true, data: await res.json() }
  } catch (err) {
    return {
      ok: false,
      result: {
        ok: false,
        reason: "network",
        detail: `invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
      },
    }
  }
}

/** Describes the top-level keys of an unexpected payload, to make shape drift diagnosable. */
function describeShape(data: unknown): string {
  if (data === null || typeof data !== "object") return `payload was ${typeof data}`
  const top = Object.keys(data as Record<string, unknown>)
  const races = (data as { races?: unknown }).races
  let racesDesc = ""
  if (Array.isArray(races)) {
    racesDesc = `; races=array(${races.length})`
  } else if (races && typeof races === "object") {
    racesDesc = `; races keys=[${Object.keys(races as Record<string, unknown>).join(",")}]`
  }
  return `top-level keys=[${top.join(",")}]${racesDesc}`
}

function readRaceMeta(payload: unknown, requestedRound: number): F1RaceMeta {
  const races = (payload as { races?: Record<string, unknown> })?.races
  const obj = races && !Array.isArray(races) ? races : undefined
  return {
    round: requestedRound,
    date: typeof obj?.date === "string" ? obj.date : null,
    raceName: typeof obj?.raceName === "string" ? obj.raceName : null,
  }
}

/**
 * The upstream's own calendar for a season, keyed by its round numbers.
 *
 * These round numbers are the upstream's, and they do NOT necessarily match
 * ours — the feed has been observed to add or drop races mid-season, which
 * shifts every later round. Always resolve a race by identity (date) rather
 * than assuming our round number addresses the same race upstream.
 */
export async function fetchSeasonCalendar(
  season: number
): Promise<
  { ok: true; entries: F1CalendarEntry[] } | Extract<F1Fetch<never>, { ok: false }>
> {
  const fetched = await fetchJson(`${BASE_URL}/${season}`)
  if (!fetched.ok) return fetched.result

  const races = (fetched.data as { races?: unknown })?.races
  if (!Array.isArray(races) || races.length === 0) {
    return {
      ok: false,
      reason: "empty",
      detail: `no races in season calendar (${describeShape(fetched.data)})`,
    }
  }

  const entries = races.map((r) => {
    const entry = r as {
      round?: number | string
      raceId?: string
      raceName?: string
      schedule?: { race?: { date?: string } }
    }
    return {
      round: Number(entry.round),
      raceId: entry.raceId ?? null,
      raceName: entry.raceName ?? null,
      date: entry.schedule?.race?.date ?? null,
    }
  })

  return { ok: true, entries }
}

/**
 * How far our recorded race date may differ from the upstream's and still be
 * the same race. The two feeds disagree by a day on races that straddle
 * midnight UTC (Las Vegas, Azerbaijan). Consecutive races are at least 7 days
 * apart, so this window can only ever match one entry.
 */
export const MAX_DATE_DRIFT_DAYS = 3

function daysApart(a: string, b: string): number | null {
  const ms = Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)
  if (Number.isNaN(ms)) return null
  return Math.abs(ms) / 86_400_000
}

/**
 * Finds the upstream calendar entry for one of our races, matching on date
 * rather than round number. Returns null when the upstream calendar has no
 * corresponding race at all, which is a real condition: the feed's 2026
 * calendar omits two races that we list.
 */
export function resolveCalendarEntry(
  entries: F1CalendarEntry[],
  raceDate: string | null
): F1CalendarEntry | null {
  if (!raceDate) return null

  let best: F1CalendarEntry | null = null
  let bestDrift = Number.POSITIVE_INFINITY
  for (const entry of entries) {
    if (!entry.date) continue
    const drift = daysApart(entry.date, raceDate)
    if (drift === null || drift > MAX_DATE_DRIFT_DAYS) continue
    if (drift < bestDrift) {
      best = entry
      bestDrift = drift
    }
  }
  return best
}

/**
 * Rejects a payload describing a different race than the one requested.
 * Without this check a renumbered upstream calendar silently writes one
 * race's results onto another race.
 */
function checkIdentity(meta: F1RaceMeta, expectDate: string | undefined): string | null {
  if (!expectDate || !meta.date) return null
  const drift = daysApart(meta.date, expectDate)
  if (drift !== null && drift <= MAX_DATE_DRIFT_DAYS) return null
  return `upstream round ${meta.round} is "${meta.raceName ?? "unknown"}" dated ${meta.date}, but ${expectDate} was expected — the upstream calendar has shifted`
}

export async function fetchRaceResultsDetailed(
  season: number,
  round: number,
  expectDate?: string
): Promise<F1Fetch<F1RaceResult>> {
  const fetched = await fetchJson(`${BASE_URL}/${season}/${round}/race`)
  if (!fetched.ok) return fetched.result

  const meta = readRaceMeta(fetched.data, round)
  const mismatch = checkIdentity(meta, expectDate)
  if (mismatch) return { ok: false, reason: "mismatch", detail: mismatch }

  const data = fetched.data as { races?: { results?: unknown }; results?: unknown }
  const results = data?.races?.results ?? data?.results ?? []
  if (!Array.isArray(results) || results.length === 0) {
    return {
      ok: false,
      reason: "empty",
      detail: `no race results in payload (${describeShape(fetched.data)})`,
    }
  }

  return {
    ok: true,
    meta,
    data: (results as F1ApiResponse[]).map((r) => ({
      driverId: r.driverId || r.driver?.driverId || "",
      position: Number(r.position),
      points: Number(r.points || 0),
    })),
  }
}

export async function fetchQualifyingResultsDetailed(
  season: number,
  round: number,
  expectDate?: string
): Promise<F1Fetch<F1QualifyingResult>> {
  const fetched = await fetchJson(`${BASE_URL}/${season}/${round}/qualy`)
  if (!fetched.ok) return fetched.result

  const meta = readRaceMeta(fetched.data, round)
  // The qualifying payload is dated to the race weekend's race day, so the
  // same identity check applies.
  const mismatch = checkIdentity(meta, expectDate)
  if (mismatch) return { ok: false, reason: "mismatch", detail: mismatch }

  const data = fetched.data as {
    races?: { qualyResults?: unknown; qualifyingResults?: unknown }
    qualifyingResults?: unknown
  }
  const results =
    data?.races?.qualyResults ?? data?.races?.qualifyingResults ?? data?.qualifyingResults ?? []
  if (!Array.isArray(results) || results.length === 0) {
    return {
      ok: false,
      reason: "empty",
      detail: `no qualifying results in payload (${describeShape(fetched.data)})`,
    }
  }

  return {
    ok: true,
    meta,
    data: (results as F1ApiResponse[]).map((r) => ({
      driverId: r.driverId || r.driver?.driverId || "",
      gridPosition: Number(r.position || r.gridPosition || 0),
    })),
  }
}

export async function fetchDriverStandings(
  season: number
): Promise<Array<{ driverId: string; position: number; points: number }> | null> {
  const fetched = await fetchJson(`${BASE_URL}/${season}/drivers-championship`)
  if (!fetched.ok) return null

  const data = fetched.data as {
    drivers_championship?: unknown
    standingsLists?: Array<{ driverStandings?: unknown }>
  }
  const standings = data?.drivers_championship ?? data?.standingsLists?.[0]?.driverStandings ?? []
  if (!Array.isArray(standings) || standings.length === 0) return null
  return (standings as F1ApiResponse[]).map((s) => ({
    driverId: s.driverId || s.driver?.driverId || "",
    position: Number(s.position),
    points: Number(s.points || 0),
  }))
}
