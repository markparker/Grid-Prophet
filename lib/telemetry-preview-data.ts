import type { OpenF1Lap, OpenF1Stint, OpenF1Position, OpenF1Interval, CarStatsSummary } from "@/lib/openf1"

// Fabricated preview data for a ~57-lap GP (classic 2-stop strategy)
// Used when no completed races exist so users can see what the telemetry feature looks like.

const SESSION_KEY = 0
const DRIVER_NUMBER = 4
const DRIVER_NUMBER_2 = 1

export const PREVIEW_DRIVER = {
  name: "Sample Driver",
  shortName: "SAM",
  number: DRIVER_NUMBER,
} as const

export const PREVIEW_RACE = "Sample Grand Prix"
export const PREVIEW_TEAM_COLOR = "#FF8700" // McLaren orange

export const PREVIEW_DRIVER_2 = {
  name: "Rival Driver",
  shortName: "RIV",
  number: DRIVER_NUMBER_2,
} as const

export const PREVIEW_DRIVER_2_NUMBER = DRIVER_NUMBER_2
export const PREVIEW_TEAM_COLOR_2 = "#E8002D" // Ferrari red

// --- Laps builder ---

function buildLaps(opts: {
  driverNumber: number
  basePace: { s1: number; s2: number; s3: number }
  degradation: number
  pitOutLaps: number[]
  stintBoundaries: number[] // lap numbers where new stints start
}): OpenF1Lap[] {
  const laps: OpenF1Lap[] = []
  const pitOutSet = new Set(opts.pitOutLaps)

  for (let lap = 1; lap <= 57; lap++) {
    const isPitOut = pitOutSet.has(lap)

    // Calculate stint age from nearest boundary
    let stintAge = lap - 1
    for (const boundary of opts.stintBoundaries) {
      if (lap >= boundary) stintAge = lap - boundary
    }

    const degradation = stintAge * opts.degradation

    const seed = lap * 7 + 3
    const jitter = (offset: number) => ((seed * offset) % 100) / 100 - 0.5

    const s1 = isPitOut ? null : +(opts.basePace.s1 + degradation + jitter(13) * 0.8).toFixed(3)
    const s2 = isPitOut ? null : +(opts.basePace.s2 + degradation + jitter(37) * 1.0).toFixed(3)
    const s3 = isPitOut ? null : +(opts.basePace.s3 + degradation + jitter(59) * 0.6).toFixed(3)

    const lapDuration = isPitOut ? null : s1 !== null && s2 !== null && s3 !== null
      ? +(s1 + s2 + s3).toFixed(3)
      : null

    laps.push({
      driver_number: opts.driverNumber,
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

// --- Stints builder ---

function buildStints(
  driverNumber: number,
  stints: Array<{ compound: string; lapStart: number; lapEnd: number; tyreAge?: number }>
): OpenF1Stint[] {
  return stints.map((s, i) => ({
    driver_number: driverNumber,
    stint_number: i + 1,
    compound: s.compound,
    lap_start: s.lapStart,
    lap_end: s.lapEnd,
    tyre_age_at_start: s.tyreAge ?? 0,
    session_key: SESSION_KEY,
  }))
}

// --- Positions builder ---

function buildPositions(
  driverNumber: number,
  trajectory: Array<{ fromLap: number; toLap: number; position: number }>
): OpenF1Position[] {
  const positions: OpenF1Position[] = []
  const totalPoints = 80
  const lapDurationSec = 90

  for (let i = 0; i < totalPoints; i++) {
    const lapFraction = (i / totalPoints) * 57
    let pos = trajectory[trajectory.length - 1].position

    for (const segment of trajectory) {
      if (lapFraction >= segment.fromLap && lapFraction < segment.toLap) {
        pos = segment.position
        break
      }
    }

    const secondsFromStart = (lapFraction / 57) * 57 * lapDurationSec
    const date = new Date(Date.UTC(2026, 2, 15, 14, 0, 0) + secondsFromStart * 1000)

    positions.push({
      driver_number: driverNumber,
      position: pos,
      date: date.toISOString(),
      session_key: SESSION_KEY,
    })
  }

  return positions
}

// --- Intervals builder ---

function buildIntervals(
  driverNumber: number,
  gapProfile: Array<{ fromLap: number; toLap: number; gapStart: number; gapEnd: number }>
): OpenF1Interval[] {
  const intervals: OpenF1Interval[] = []
  const totalPoints = 80
  const lapDurationSec = 90

  for (let i = 0; i < totalPoints; i++) {
    const lapFraction = (i / totalPoints) * 57
    let gap = 5.0

    for (const segment of gapProfile) {
      if (lapFraction >= segment.fromLap && lapFraction < segment.toLap) {
        const progress = (lapFraction - segment.fromLap) / (segment.toLap - segment.fromLap)
        gap = segment.gapStart + (segment.gapEnd - segment.gapStart) * progress
        break
      }
    }

    const secondsFromStart = (lapFraction / 57) * 57 * lapDurationSec
    const date = new Date(Date.UTC(2026, 2, 15, 14, 0, 0) + secondsFromStart * 1000)

    intervals.push({
      driver_number: driverNumber,
      gap_to_leader: +gap.toFixed(1),
      interval: +(gap * 0.3 + Math.abs(Math.sin(i * 0.5)) * 0.5).toFixed(1),
      date: date.toISOString(),
      session_key: SESSION_KEY,
    })
  }

  return intervals
}

// --- Driver 1 Data ---

export const PREVIEW_LAPS = buildLaps({
  driverNumber: DRIVER_NUMBER,
  basePace: { s1: 28.5, s2: 35.2, s3: 27.0 },
  degradation: 0.04,
  pitOutLaps: [1, 19, 39],
  stintBoundaries: [1, 19, 39],
})

export const PREVIEW_STINTS = buildStints(DRIVER_NUMBER, [
  { compound: "MEDIUM", lapStart: 1, lapEnd: 18 },
  { compound: "HARD", lapStart: 19, lapEnd: 38 },
  { compound: "SOFT", lapStart: 39, lapEnd: 57 },
])

export const PREVIEW_POSITIONS = buildPositions(DRIVER_NUMBER, [
  { fromLap: 0, toLap: 3, position: 5 },
  { fromLap: 3, toLap: 10, position: 3 },
  { fromLap: 10, toLap: 18, position: 3 },
  { fromLap: 18, toLap: 20, position: 7 },
  { fromLap: 20, toLap: 30, position: 5 },
  { fromLap: 30, toLap: 38, position: 5 },
  { fromLap: 38, toLap: 40, position: 6 },
  { fromLap: 40, toLap: 57, position: 4 },
])

export const PREVIEW_INTERVALS = buildIntervals(DRIVER_NUMBER, [
  { fromLap: 0, toLap: 3, gapStart: 4.5, gapEnd: 4.5 },
  { fromLap: 3, toLap: 10, gapStart: 4.5, gapEnd: 2.0 },
  { fromLap: 10, toLap: 18, gapStart: 2.0, gapEnd: 2.3 },
  { fromLap: 18, toLap: 22, gapStart: 8.0, gapEnd: 14.0 },
  { fromLap: 22, toLap: 38, gapStart: 14.0, gapEnd: 8.0 },
  { fromLap: 38, toLap: 42, gapStart: 10.0, gapEnd: 14.0 },
  { fromLap: 42, toLap: 57, gapStart: 14.0, gapEnd: 6.0 },
])

export const PREVIEW_CAR_STATS: CarStatsSummary = {
  topSpeed: 338,
  avgSpeed: 217,
  totalLaps: 57,
  bestLapTime: 88.432,
  bestSector1: 28.112,
  bestSector2: 34.201,
  bestSector3: 25.991,
}

// --- Driver 2 Data (slightly faster base pace, more degradation, different strategy) ---

export const PREVIEW_LAPS_2 = buildLaps({
  driverNumber: DRIVER_NUMBER_2,
  basePace: { s1: 28.3, s2: 35.0, s3: 26.8 },
  degradation: 0.055,
  pitOutLaps: [1, 15, 35],
  stintBoundaries: [1, 15, 35],
})

export const PREVIEW_STINTS_2 = buildStints(DRIVER_NUMBER_2, [
  { compound: "SOFT", lapStart: 1, lapEnd: 14 },
  { compound: "HARD", lapStart: 15, lapEnd: 34 },
  { compound: "MEDIUM", lapStart: 35, lapEnd: 57 },
])

export const PREVIEW_POSITIONS_2 = buildPositions(DRIVER_NUMBER_2, [
  { fromLap: 0, toLap: 3, position: 3 },
  { fromLap: 3, toLap: 10, position: 2 },
  { fromLap: 10, toLap: 15, position: 2 },
  { fromLap: 15, toLap: 17, position: 6 },
  { fromLap: 17, toLap: 30, position: 4 },
  { fromLap: 30, toLap: 35, position: 4 },
  { fromLap: 35, toLap: 37, position: 7 },
  { fromLap: 37, toLap: 57, position: 6 },
])

export const PREVIEW_INTERVALS_2 = buildIntervals(DRIVER_NUMBER_2, [
  { fromLap: 0, toLap: 3, gapStart: 2.0, gapEnd: 2.0 },
  { fromLap: 3, toLap: 10, gapStart: 2.0, gapEnd: 1.0 },
  { fromLap: 10, toLap: 15, gapStart: 1.0, gapEnd: 1.2 },
  { fromLap: 15, toLap: 20, gapStart: 5.0, gapEnd: 10.0 },
  { fromLap: 20, toLap: 35, gapStart: 10.0, gapEnd: 5.0 },
  { fromLap: 35, toLap: 40, gapStart: 7.0, gapEnd: 12.0 },
  { fromLap: 40, toLap: 57, gapStart: 12.0, gapEnd: 8.0 },
])

export const PREVIEW_CAR_STATS_2: CarStatsSummary = {
  topSpeed: 341,
  avgSpeed: 215,
  totalLaps: 57,
  bestLapTime: 87.891,
  bestSector1: 27.942,
  bestSector2: 34.012,
  bestSector3: 25.837,
}
