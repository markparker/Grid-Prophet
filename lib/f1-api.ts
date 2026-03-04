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

export async function fetchRaceResults(
  season: number,
  round: number
): Promise<F1RaceResult[] | null> {
  try {
    const res = await fetch(`${BASE_URL}/${season}/${round}/race`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const results = data?.races?.results || data?.results || []
    if (!Array.isArray(results) || results.length === 0) return null
    return results.map((r: F1ApiResponse) => ({
      driverId: r.driverId || r.driver?.driverId || "",
      position: Number(r.position),
      points: Number(r.points || 0),
    }))
  } catch {
    return null
  }
}

export async function fetchQualifyingResults(
  season: number,
  round: number
): Promise<F1QualifyingResult[] | null> {
  try {
    const res = await fetch(`${BASE_URL}/${season}/${round}/qualy`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const results =
      data?.races?.qualifyingResults || data?.qualifyingResults || []
    if (!Array.isArray(results) || results.length === 0) return null
    return results.map((r: F1ApiResponse) => ({
      driverId: r.driverId || r.driver?.driverId || "",
      gridPosition: Number(r.position || r.gridPosition || 0),
    }))
  } catch {
    return null
  }
}

export async function fetchDriverStandings(
  season: number
): Promise<Array<{ driverId: string; position: number; points: number }> | null> {
  try {
    const res = await fetch(`${BASE_URL}/${season}/drivers-championship`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const standings =
      data?.drivers_championship || data?.standingsLists?.[0]?.driverStandings || []
    if (!Array.isArray(standings) || standings.length === 0) return null
    return standings.map((s: F1ApiResponse) => ({
      driverId: s.driverId || s.driver?.driverId || "",
      position: Number(s.position),
      points: Number(s.points || 0),
    }))
  } catch {
    return null
  }
}
