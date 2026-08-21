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
 * Result of an upstream fetch. Distinguishes the three outcomes the old
 * `T[] | null` return type collapsed into a single silent `null`:
 * transport/HTTP failure, a valid response with no results yet, and success.
 */
export type F1Fetch<T> =
  | { ok: true; data: T[] }
  | { ok: false; reason: "http"; status: number; detail: string }
  | { ok: false; reason: "network"; detail: string }
  | { ok: false; reason: "empty"; detail: string }

async function fetchJson(
  url: string
): Promise<{ ok: true; data: unknown } | { ok: false; result: F1Fetch<never> }> {
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

export async function fetchRaceResultsDetailed(
  season: number,
  round: number
): Promise<F1Fetch<F1RaceResult>> {
  const fetched = await fetchJson(`${BASE_URL}/${season}/${round}/race`)
  if (!fetched.ok) return fetched.result

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
    data: (results as F1ApiResponse[]).map((r) => ({
      driverId: r.driverId || r.driver?.driverId || "",
      position: Number(r.position),
      points: Number(r.points || 0),
    })),
  }
}

export async function fetchQualifyingResultsDetailed(
  season: number,
  round: number
): Promise<F1Fetch<F1QualifyingResult>> {
  const fetched = await fetchJson(`${BASE_URL}/${season}/${round}/qualy`)
  if (!fetched.ok) return fetched.result

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
    data: (results as F1ApiResponse[]).map((r) => ({
      driverId: r.driverId || r.driver?.driverId || "",
      gridPosition: Number(r.position || r.gridPosition || 0),
    })),
  }
}

export async function fetchRaceResults(
  season: number,
  round: number
): Promise<F1RaceResult[] | null> {
  const outcome = await fetchRaceResultsDetailed(season, round)
  return outcome.ok ? outcome.data : null
}

export async function fetchQualifyingResults(
  season: number,
  round: number
): Promise<F1QualifyingResult[] | null> {
  const outcome = await fetchQualifyingResultsDetailed(season, round)
  return outcome.ok ? outcome.data : null
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
