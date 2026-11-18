const BASE_URL = "https://api.openf1.org/v1"

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
 * Result of an upstream fetch. Distinguishes the failure modes a bare
 * `T[] | null` collapsed into a single silent null.
 *
 * "mismatch" guards against addressing the wrong session: the resolved
 * session's date must match the race we asked for.
 */
export type F1Fetch<T> =
  | { ok: true; data: T[]; meta: F1RaceMeta }
  | { ok: false; reason: "http"; status: number; detail: string }
  | { ok: false; reason: "network"; detail: string }
  | { ok: false; reason: "empty"; detail: string }
  | { ok: false; reason: "mismatch"; detail: string }

export interface F1RaceMeta {
  sessionKey: number
  date: string | null
  raceName: string | null
}

export interface F1CalendarEntry {
  /** OpenF1 session_key of the race. This is the handle for everything else. */
  raceSessionKey: number
  /** Qualifying session for the same meeting, when OpenF1 has one. */
  qualifyingSessionKey: number | null
  meetingKey: number
  raceName: string | null
  raceId: string | null
  /** Date of the race session, YYYY-MM-DD. */
  date: string | null
  /** Start of qualifying as an ISO instant. Predictions lock on this. */
  qualifyingStart: string | null
  cancelled: boolean
}

/** Championship points are only awarded for a Race, never a Sprint or Qualifying. */
interface OpenF1SessionRow {
  session_key: number
  meeting_key: number
  session_name: string
  session_type: string
  date_start: string
  country_name?: string
  circuit_short_name?: string
  is_cancelled?: boolean
}

interface OpenF1ResultRow {
  position: number | null
  driver_number: number
  points?: number | null
  dnf?: boolean
  dns?: boolean
  dsq?: boolean
  number_of_laps?: number | null
}

interface OpenF1DriverRow {
  driver_number: number
  name_acronym?: string
  full_name?: string
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

/**
 * The season calendar, built from OpenF1's session list.
 *
 * OpenF1 has no concept of a championship round, and ours would not match it
 * anyway, so races are addressed by session_key and matched to our rows by
 * date. One request covers the whole year.
 */
export async function fetchSeasonCalendar(
  season: number
): Promise<{ ok: true; entries: F1CalendarEntry[] } | Extract<F1Fetch<never>, { ok: false }>> {
  const fetched = await fetchJson(`${BASE_URL}/sessions?year=${season}`)
  if (!fetched.ok) return fetched.result

  const rows = fetched.data
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, reason: "empty", detail: `no sessions returned for ${season}` }
  }

  const sessions = rows as OpenF1SessionRow[]
  const byMeeting = new Map<number, { race?: OpenF1SessionRow; qualifying?: OpenF1SessionRow }>()

  for (const s of sessions) {
    if (s.session_type !== "Race" && s.session_name !== "Qualifying") continue
    const slot = byMeeting.get(s.meeting_key) ?? {}
    // session_type "Race" also covers the Sprint, which awards different points
    // and is not what we score, so match the main race by name.
    if (s.session_name === "Race") slot.race = s
    if (s.session_name === "Qualifying") slot.qualifying = s
    byMeeting.set(s.meeting_key, slot)
  }

  const entries: F1CalendarEntry[] = []
  for (const [meetingKey, slot] of byMeeting) {
    if (!slot.race) continue
    entries.push({
      raceSessionKey: slot.race.session_key,
      qualifyingSessionKey: slot.qualifying?.session_key ?? null,
      meetingKey,
      raceName: slot.race.country_name ?? slot.race.circuit_short_name ?? null,
      raceId: slot.race.circuit_short_name ?? null,
      date: slot.race.date_start ? slot.race.date_start.slice(0, 10) : null,
      qualifyingStart: slot.qualifying?.date_start
        ? new Date(slot.qualifying.date_start).toISOString()
        : null,
      cancelled: slot.race.is_cancelled === true,
    })
  }

  if (entries.length === 0) {
    return { ok: false, reason: "empty", detail: `no race sessions in the ${season} calendar` }
  }

  entries.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
  return { ok: true, entries }
}

/**
 * How far our recorded race date may differ from the upstream's and still be
 * the same race. Sessions that straddle midnight UTC shift by a day; races are
 * at least a week apart, so this window can only match one entry.
 */
export const MAX_DATE_DRIFT_DAYS = 3

function daysApart(a: string, b: string): number | null {
  const ms = Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)
  if (Number.isNaN(ms)) return null
  return Math.abs(ms) / 86_400_000
}

/** Finds the calendar entry for one of our races, matching on date. */
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
 * Maps OpenF1 driver numbers to the three-letter acronym for that session.
 *
 * Results are keyed by car number, which is not a stable identifier: a wrong
 * number in our drivers table would quietly attribute a result to the wrong
 * person. Returning the acronym instead means the sync's existing driver map
 * (which already indexes short_name) resolves it, and an unknown acronym fails
 * loudly on the foreign key rather than landing on someone else.
 */
async function fetchDriverAcronyms(
  sessionKey: number
): Promise<{ ok: true; byNumber: Map<number, string> } | Extract<F1Fetch<never>, { ok: false }>> {
  const fetched = await fetchJson(`${BASE_URL}/drivers?session_key=${sessionKey}`)
  if (!fetched.ok) return fetched.result

  const rows = fetched.data
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, reason: "empty", detail: `no drivers listed for session ${sessionKey}` }
  }

  const byNumber = new Map<number, string>()
  for (const d of rows as OpenF1DriverRow[]) {
    const acronym = d.name_acronym?.trim()
    if (d.driver_number != null && acronym) byNumber.set(d.driver_number, acronym)
  }

  if (byNumber.size === 0) {
    return {
      ok: false,
      reason: "empty",
      detail: `session ${sessionKey} listed drivers but none had an acronym`,
    }
  }
  return { ok: true, byNumber }
}

function checkDate(entry: F1CalendarEntry, expectDate: string | undefined): string | null {
  if (!expectDate || !entry.date) return null
  const drift = daysApart(entry.date, expectDate)
  if (drift !== null && drift <= MAX_DATE_DRIFT_DAYS) return null
  return `session ${entry.raceSessionKey} is dated ${entry.date}, but ${expectDate} was expected`
}

export async function fetchRaceResultsDetailed(
  entry: F1CalendarEntry,
  expectDate?: string
): Promise<F1Fetch<F1RaceResult>> {
  const mismatch = checkDate(entry, expectDate)
  if (mismatch) return { ok: false, reason: "mismatch", detail: mismatch }

  const meta: F1RaceMeta = {
    sessionKey: entry.raceSessionKey,
    date: entry.date,
    raceName: entry.raceName,
  }

  const drivers = await fetchDriverAcronyms(entry.raceSessionKey)
  if (!drivers.ok) return drivers

  const fetched = await fetchJson(`${BASE_URL}/session_result?session_key=${entry.raceSessionKey}`)
  if (!fetched.ok) return fetched.result

  const rows = fetched.data
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      ok: false,
      reason: "empty",
      detail: `no classification yet for session ${entry.raceSessionKey}`,
    }
  }

  const results = rows as OpenF1ResultRow[]

  // OpenF1 leaves position null for anyone not classified (retired, not
  // started, disqualified). race_results.position is NOT NULL and the
  // leaderboard orders by it, so they are placed after the classified
  // finishers, most laps completed first. Scoring ignores anything outside the
  // top ten, so this only affects how the results table reads.
  const classified = results
    .filter((r) => r.position != null)
    .sort((a, b) => (a.position as number) - (b.position as number))
  const unclassified = results
    .filter((r) => r.position == null)
    .sort((a, b) => (b.number_of_laps ?? 0) - (a.number_of_laps ?? 0))

  const data: F1RaceResult[] = []
  let nextPosition = classified.length
  for (const row of [...classified, ...unclassified]) {
    const acronym = drivers.byNumber.get(row.driver_number)
    if (!acronym) {
      return {
        ok: false,
        reason: "empty",
        detail: `car #${row.driver_number} finished but is not in the driver list for session ${entry.raceSessionKey}`,
      }
    }
    const position = row.position != null ? Number(row.position) : ++nextPosition
    data.push({ driverId: acronym, position, points: Number(row.points ?? 0) })
  }

  return { ok: true, data, meta }
}

export async function fetchQualifyingResultsDetailed(
  entry: F1CalendarEntry,
  expectDate?: string
): Promise<F1Fetch<F1QualifyingResult>> {
  const mismatch = checkDate(entry, expectDate)
  if (mismatch) return { ok: false, reason: "mismatch", detail: mismatch }

  if (entry.qualifyingSessionKey == null) {
    return {
      ok: false,
      reason: "empty",
      detail: `no qualifying session recorded for the meeting on ${entry.date}`,
    }
  }

  const sessionKey = entry.qualifyingSessionKey
  const meta: F1RaceMeta = { sessionKey, date: entry.date, raceName: entry.raceName }

  const drivers = await fetchDriverAcronyms(sessionKey)
  if (!drivers.ok) return drivers

  const fetched = await fetchJson(`${BASE_URL}/session_result?session_key=${sessionKey}`)
  if (!fetched.ok) return fetched.result

  const rows = fetched.data
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, reason: "empty", detail: `no qualifying classification for ${sessionKey}` }
  }

  // Grid penalties are applied after qualifying and OpenF1 has no starting_grid
  // for these sessions, so this is the qualifying order, not the grid as it
  // formed up. Pole is read from it, which is what the pole prediction scores.
  const data: F1QualifyingResult[] = []
  for (const row of rows as OpenF1ResultRow[]) {
    if (row.position == null) continue
    const acronym = drivers.byNumber.get(row.driver_number)
    if (!acronym) continue
    data.push({ driverId: acronym, gridPosition: Number(row.position) })
  }

  if (data.length === 0) {
    return { ok: false, reason: "empty", detail: `qualifying session ${sessionKey} had no positions` }
  }

  data.sort((a, b) => a.gridPosition - b.gridPosition)
  return { ok: true, data, meta }
}

/**
 * OpenF1 publishes timing, not championship tables: it has no standings
 * endpoint, and summing points across every race session of the year would be
 * one request per round on a page load.
 *
 * Returning null is deliberate. The WDC page already prefers live standings
 * and falls back to totalling points from our own race_results, so it now
 * always takes that path — which is also the more honest number, since it
 * reflects exactly the results the league has been scored on.
 */
export async function fetchDriverStandings(
  _season: number
): Promise<Array<{ driverId: string; position: number; points: number }> | null> {
  return null
}
