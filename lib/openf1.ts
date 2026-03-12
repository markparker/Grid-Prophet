const BASE_URL = "https://api.openf1.org/v1"

// --- Type definitions ---

export interface OpenF1Session {
  session_key: number
  session_name: string
  session_type: string
  date_start: string
  date_end: string
  meeting_key: number
  circuit_key: number
  circuit_short_name: string
  country_name: string
  country_key: number
  country_code: string
  location: string
  year: number
}

export interface OpenF1Lap {
  driver_number: number
  lap_number: number
  lap_duration: number | null
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
  i1_speed: number | null
  i2_speed: number | null
  st_speed: number | null
  is_pit_out_lap: boolean
  date_start: string
  session_key: number
}

export interface OpenF1Stint {
  driver_number: number
  stint_number: number
  compound: string // "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET"
  lap_start: number
  lap_end: number
  tyre_age_at_start: number
  session_key: number
}

export interface OpenF1Position {
  driver_number: number
  position: number
  date: string
  session_key: number
}

export interface OpenF1Interval {
  driver_number: number
  gap_to_leader: number | string | null
  interval: number | string | null
  date: string
  session_key: number
}

export interface OpenF1CarData {
  driver_number: number
  speed: number
  throttle: number
  brake: number
  rpm: number
  n_gear: number
  drs: number
  date: string
  session_key: number
}

export interface OpenF1Driver {
  driver_number: number
  full_name: string
  first_name: string
  last_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  headshot_url: string | null
  session_key: number
}

export interface OpenF1RaceControl {
  category: string
  date: string
  driver_number: number | null
  flag: string | null
  lap_number: number | null
  message: string
  scope: string | null
  sector: number | null
  session_key: number
}

// --- Summary types (server-aggregated) ---

export interface CarStatsSummary {
  topSpeed: number
  avgSpeed: number
  totalLaps: number
  bestLapTime: number | null
  bestSector1: number | null
  bestSector2: number | null
  bestSector3: number | null
}

// --- Fetch helpers ---

async function fetchOpenF1<T>(path: string, params?: Record<string, string | number>): Promise<T[] | null> {
  try {
    const url = new URL(`${BASE_URL}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
    }
    const res = await fetch(url.toString())
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data)) return null
    return data as T[]
  } catch {
    return null
  }
}

// --- Public API ---

export async function fetchSessions(
  year: number,
  sessionType?: string
): Promise<OpenF1Session[] | null> {
  const params: Record<string, string | number> = { year }
  if (sessionType) params.session_type = sessionType
  return fetchOpenF1<OpenF1Session>("/sessions", params)
}

export async function fetchLaps(
  sessionKey: number,
  driverNumber: number
): Promise<OpenF1Lap[] | null> {
  return fetchOpenF1<OpenF1Lap>("/laps", {
    session_key: sessionKey,
    driver_number: driverNumber,
  })
}

export async function fetchStints(
  sessionKey: number,
  driverNumber: number
): Promise<OpenF1Stint[] | null> {
  return fetchOpenF1<OpenF1Stint>("/stints", {
    session_key: sessionKey,
    driver_number: driverNumber,
  })
}

export async function fetchPositions(
  sessionKey: number,
  driverNumber: number
): Promise<OpenF1Position[] | null> {
  return fetchOpenF1<OpenF1Position>("/position", {
    session_key: sessionKey,
    driver_number: driverNumber,
  })
}

export async function fetchIntervals(
  sessionKey: number,
  driverNumber: number
): Promise<OpenF1Interval[] | null> {
  return fetchOpenF1<OpenF1Interval>("/intervals", {
    session_key: sessionKey,
    driver_number: driverNumber,
  })
}

export async function fetchCarData(
  sessionKey: number,
  driverNumber: number
): Promise<OpenF1CarData[] | null> {
  return fetchOpenF1<OpenF1CarData>("/car_data", {
    session_key: sessionKey,
    driver_number: driverNumber,
  })
}

export async function fetchDrivers(
  sessionKey: number
): Promise<OpenF1Driver[] | null> {
  return fetchOpenF1<OpenF1Driver>("/drivers", {
    session_key: sessionKey,
  })
}

export async function fetchRaceControl(
  sessionKey: number
): Promise<OpenF1RaceControl[] | null> {
  return fetchOpenF1<OpenF1RaceControl>("/race_control", {
    session_key: sessionKey,
  })
}

// --- Server-side aggregation ---

export function aggregateCarStats(
  carData: OpenF1CarData[],
  laps: OpenF1Lap[] | null
): CarStatsSummary {
  if (carData.length === 0) {
    return {
      topSpeed: 0,
      avgSpeed: 0,
      totalLaps: laps?.length ?? 0,
      bestLapTime: null,
      bestSector1: null,
      bestSector2: null,
      bestSector3: null,
    }
  }

  let topSpeed = 0
  let speedSum = 0

  for (const d of carData) {
    if (d.speed > topSpeed) topSpeed = d.speed
    speedSum += d.speed
  }

  const avgSpeed = Math.round(speedSum / carData.length)

  // Extract best times from laps data
  let bestLapTime: number | null = null
  let bestSector1: number | null = null
  let bestSector2: number | null = null
  let bestSector3: number | null = null

  if (laps) {
    for (const lap of laps) {
      if (lap.is_pit_out_lap) continue
      if (lap.lap_duration && (bestLapTime === null || lap.lap_duration < bestLapTime)) {
        bestLapTime = lap.lap_duration
      }
      if (lap.duration_sector_1 && (bestSector1 === null || lap.duration_sector_1 < bestSector1)) {
        bestSector1 = lap.duration_sector_1
      }
      if (lap.duration_sector_2 && (bestSector2 === null || lap.duration_sector_2 < bestSector2)) {
        bestSector2 = lap.duration_sector_2
      }
      if (lap.duration_sector_3 && (bestSector3 === null || lap.duration_sector_3 < bestSector3)) {
        bestSector3 = lap.duration_sector_3
      }
    }
  }

  return {
    topSpeed,
    avgSpeed,
    totalLaps: laps?.filter((l) => !l.is_pit_out_lap).length ?? 0,
    bestLapTime,
    bestSector1,
    bestSector2,
    bestSector3,
  }
}
