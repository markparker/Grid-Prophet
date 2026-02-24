const BASE_URL = 'https://f1api.dev/api'

interface F1RaceResult {
  driverId: string
  position: number
  points: number
  Driver: {
    driverId: string
    name: string
    surname: string
    nameAcronym: string
    driverNumber: number
  }
}

interface F1QualifyingResult {
  driverId: string
  gridPosition: number
  Driver: {
    driverId: string
    name: string
    surname: string
    nameAcronym: string
    driverNumber: number
  }
}

export async function fetchRaceResults(season: number, round: number): Promise<F1RaceResult[] | null> {
  try {
    const res = await fetch(`${BASE_URL}/${season}/${round}/race`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    // The API returns an object with a races property containing results
    const races = data?.races?.results || data?.results || data
    if (Array.isArray(races)) {
      return races.map((r: Record<string, unknown>) => ({
        driverId: (r.driverId || (r.Driver as Record<string, unknown>)?.driverId || '') as string,
        position: Number(r.position || r.gridPosition || 0),
        points: Number(r.points || 0),
        Driver: r.Driver as F1RaceResult['Driver'],
      }))
    }
    return null
  } catch {
    return null
  }
}

export async function fetchQualifyingResults(season: number, round: number): Promise<F1QualifyingResult[] | null> {
  try {
    const res = await fetch(`${BASE_URL}/${season}/${round}/qualy`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const results = data?.races?.qualifyingResults || data?.qualifyingResults || data
    if (Array.isArray(results)) {
      return results.map((r: Record<string, unknown>) => ({
        driverId: (r.driverId || (r.Driver as Record<string, unknown>)?.driverId || '') as string,
        gridPosition: Number(r.position || r.gridPosition || 0),
        Driver: r.Driver as F1QualifyingResult['Driver'],
      }))
    }
    return null
  } catch {
    return null
  }
}

export async function fetchDriverStandings(season: number): Promise<Array<{
  driverId: string
  position: number
  points: number
  wins: number
}> | null> {
  try {
    const res = await fetch(`${BASE_URL}/${season}/drivers-championship`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const standings = data?.drivers_championship || data
    if (Array.isArray(standings)) {
      return standings.map((s: Record<string, unknown>) => ({
        driverId: (s.driverId || (s.Driver as Record<string, unknown>)?.driverId || '') as string,
        position: Number(s.position || 0),
        points: Number(s.points || 0),
        wins: Number(s.wins || 0),
      }))
    }
    return null
  } catch {
    return null
  }
}
