import type { OpenF1Lap, OpenF1Stint, OpenF1Position, OpenF1Interval, CarStatsSummary } from "@/lib/openf1"

// Fabricated preview data for a ~57-lap GP (classic 2-stop strategy)
// Used when no completed races exist so users can see what the telemetry feature looks like.

const SESSION_KEY = 0
const DRIVER_NUMBER = 4

export const PREVIEW_DRIVER = {
  name: "Sample Driver",
  shortName: "SAM",
  number: DRIVER_NUMBER,
} as const

export const PREVIEW_RACE = "Sample Grand Prix"
export const PREVIEW_TEAM_COLOR = "#FF8700" // McLaren orange

// --- Laps (57) ---

function buildLaps(): OpenF1Lap[] {
  const laps: OpenF1Lap[] = []
  const pitOutLaps = new Set([1, 19, 39])

  for (let lap = 1; lap <= 57; lap++) {
    const isPitOut = pitOutLaps.has(lap)

    // Tire degradation curve per stint
    let stintAge: number
    if (lap <= 18) stintAge = lap - 1
    else if (lap <= 38) stintAge = lap - 19
    else stintAge = lap - 39

    const degradation = stintAge * 0.04

    // Base sector times with slight variation per lap
    const seed = lap * 7 + 3
    const jitter = (offset: number) => ((seed * offset) % 100) / 100 - 0.5

    const s1 = isPitOut ? null : +(28.5 + degradation + jitter(13) * 0.8).toFixed(3)
    const s2 = isPitOut ? null : +(35.2 + degradation + jitter(37) * 1.0).toFixed(3)
    const s3 = isPitOut ? null : +(27.0 + degradation + jitter(59) * 0.6).toFixed(3)

    const lapDuration = isPitOut ? null : s1 !== null && s2 !== null && s3 !== null
      ? +(s1 + s2 + s3).toFixed(3)
      : null

    laps.push({
      driver_number: DRIVER_NUMBER,
      lap_number: lap,
      lap_duration: lapDuration,
      duration_sector_1: s1,
      duration_sector_2: s2,
      duration_sector_3: s3,
      i1_speed: isPitOut ? null : +(305 + jitter(17) * 8).toFixed(0) as unknown as number,
      i2_speed: isPitOut ? null : +(290 + jitter(23) * 6).toFixed(0) as unknown as number,
      st_speed: isPitOut ? null : +(320 + jitter(31) * 10).toFixed(0) as unknown as number,
      is_pit_out_lap: isPitOut,
      date_start: `2026-03-15T14:${String(lap).padStart(2, "0")}:00.000Z`,
      session_key: SESSION_KEY,
    })
  }

  return laps
}

// --- Stints (3) --- Medium -> Hard -> Soft

function buildStints(): OpenF1Stint[] {
  return [
    {
      driver_number: DRIVER_NUMBER,
      stint_number: 1,
      compound: "MEDIUM",
      lap_start: 1,
      lap_end: 18,
      tyre_age_at_start: 0,
      session_key: SESSION_KEY,
    },
    {
      driver_number: DRIVER_NUMBER,
      stint_number: 2,
      compound: "HARD",
      lap_start: 19,
      lap_end: 38,
      tyre_age_at_start: 0,
      session_key: SESSION_KEY,
    },
    {
      driver_number: DRIVER_NUMBER,
      stint_number: 3,
      compound: "SOFT",
      lap_start: 39,
      lap_end: 57,
      tyre_age_at_start: 0,
      session_key: SESSION_KEY,
    },
  ]
}

// --- Positions (80 sampled points) ---
// Start P5, move to P3 by lap 10, pit to P7, recover to P4

function buildPositions(): OpenF1Position[] {
  const positions: OpenF1Position[] = []
  const totalPoints = 80
  const lapDurationSec = 90 // ~1.5 min per lap

  for (let i = 0; i < totalPoints; i++) {
    const lapFraction = (i / totalPoints) * 57
    let pos: number

    if (lapFraction < 3) pos = 5
    else if (lapFraction < 10) pos = Math.round(5 - (lapFraction - 3) * (2 / 7)) // 5 -> 3
    else if (lapFraction < 18) pos = 3
    else if (lapFraction < 20) pos = 7 // pit stop drop
    else if (lapFraction < 30) pos = Math.round(7 - (lapFraction - 20) * (2 / 10)) // 7 -> 5
    else if (lapFraction < 38) pos = 5
    else if (lapFraction < 40) pos = 6 // second pit
    else if (lapFraction < 50) pos = Math.round(6 - (lapFraction - 40) * (2 / 10)) // 6 -> 4
    else pos = 4

    const secondsFromStart = (lapFraction / 57) * 57 * lapDurationSec
    const date = new Date(Date.UTC(2026, 2, 15, 14, 0, 0) + secondsFromStart * 1000)

    positions.push({
      driver_number: DRIVER_NUMBER,
      position: pos,
      date: date.toISOString(),
      session_key: SESSION_KEY,
    })
  }

  return positions
}

// --- Intervals ---
// Gap to leader matches position data: closer when P3, wider when P7

function buildIntervals(): OpenF1Interval[] {
  const intervals: OpenF1Interval[] = []
  const totalPoints = 80
  const lapDurationSec = 90

  for (let i = 0; i < totalPoints; i++) {
    const lapFraction = (i / totalPoints) * 57
    let gap: number

    if (lapFraction < 3) gap = 4.5
    else if (lapFraction < 10) gap = +(4.5 - (lapFraction - 3) * (2.5 / 7)).toFixed(1) as number
    else if (lapFraction < 18) gap = +(2.0 + Math.sin(lapFraction * 0.5) * 0.3).toFixed(1) as number
    else if (lapFraction < 22) gap = +(8.0 + (lapFraction - 18) * 1.5).toFixed(1) as number
    else if (lapFraction < 38) gap = +(14.0 - (lapFraction - 22) * (6 / 16)).toFixed(1) as number
    else if (lapFraction < 42) gap = +(10.0 + (lapFraction - 38) * 1.0).toFixed(1) as number
    else gap = +(14.0 - (lapFraction - 42) * (8 / 15)).toFixed(1) as number

    const secondsFromStart = (lapFraction / 57) * 57 * lapDurationSec
    const date = new Date(Date.UTC(2026, 2, 15, 14, 0, 0) + secondsFromStart * 1000)

    intervals.push({
      driver_number: DRIVER_NUMBER,
      gap_to_leader: gap,
      interval: +(gap * 0.3 + Math.random() * 0.5).toFixed(1) as number,
      date: date.toISOString(),
      session_key: SESSION_KEY,
    })
  }

  return intervals
}

// --- Car Stats ---

export const PREVIEW_CAR_STATS: CarStatsSummary = {
  topSpeed: 338,
  avgSpeed: 217,
  drsActivations: 42,
  totalLaps: 57,
  bestLapTime: 88.432,
  bestSector1: 28.112,
  bestSector2: 34.201,
  bestSector3: 25.991,
}

// --- Exported constants ---

export const PREVIEW_LAPS = buildLaps()
export const PREVIEW_STINTS = buildStints()
export const PREVIEW_POSITIONS = buildPositions()
export const PREVIEW_INTERVALS = buildIntervals()
