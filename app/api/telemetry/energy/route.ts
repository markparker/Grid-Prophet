import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchCarData, fetchLaps } from "@/lib/openf1"
import { cacheGet, cacheSet } from "@/lib/openf1-cache"
import { parseDriverParams } from "@/lib/telemetry-route"

export interface LapEnergy {
  lap: number
  deployPct: number       // % of samples where battery boost is active
  harvestPct: number      // % of samples under braking (energy recovery)
  avgThrottle: number     // average throttle %
  avgBrake: number        // average brake %
  avgSpeed: number        // average speed for the lap
  drsActivations: number  // count of boost mode activations (legacy field name from OpenF1)
}

function aggregateEnergy(
  carData: Array<{ speed: number; throttle: number; brake: number; drs: number; date: string }>,
  laps: Array<{ lap_number: number; date_start: string; is_pit_out_lap: boolean }>
): LapEnergy[] {
  if (!laps.length || !carData.length) return []

  const sortedLaps = laps
    .filter((l) => !l.is_pit_out_lap && l.lap_number > 0)
    .sort((a, b) => a.lap_number - b.lap_number)

  const sortedCarData = [...carData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const result: LapEnergy[] = []

  for (let i = 0; i < sortedLaps.length; i++) {
    const lap = sortedLaps[i]
    const lapStart = new Date(lap.date_start).getTime()
    const lapEnd = i < sortedLaps.length - 1
      ? new Date(sortedLaps[i + 1].date_start).getTime()
      : lapStart + 120_000 // assume max 2 min for last lap

    const samples = sortedCarData.filter((d) => {
      const t = new Date(d.date).getTime()
      return t >= lapStart && t < lapEnd
    })

    if (samples.length === 0) continue

    let drsActive = 0
    let braking = 0
    let throttleSum = 0
    let brakeSum = 0
    let speedSum = 0
    let drsActivations = 0
    let prevDrs = 0

    for (const s of samples) {
      // DRS values >= 10 generally mean DRS/active aero is enabled
      if (s.drs >= 10) drsActive++
      if (s.brake > 0) braking++
      throttleSum += s.throttle
      brakeSum += s.brake
      speedSum += s.speed
      // Count transitions from inactive to active
      if (s.drs >= 10 && prevDrs < 10) drsActivations++
      prevDrs = s.drs
    }

    result.push({
      lap: lap.lap_number,
      deployPct: Math.round((drsActive / samples.length) * 100),
      harvestPct: Math.round((braking / samples.length) * 100),
      avgThrottle: Math.round(throttleSum / samples.length),
      avgBrake: Math.round(brakeSum / samples.length),
      avgSpeed: Math.round(speedSum / samples.length),
      drsActivations,
    })
  }

  return result
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const params = parseDriverParams(request)
  if (params instanceof NextResponse) return params
  const { sessionKey, driverNumber } = params

  const cacheKey = `openf1:energy:${sessionKey}:${driverNumber}`
  const cached = cacheGet<LapEnergy[]>(cacheKey)
  if (cached) {
    return NextResponse.json({ energy: cached })
  }

  const [carData, laps] = await Promise.all([
    fetchCarData(sessionKey, driverNumber),
    fetchLaps(sessionKey, driverNumber),
  ])

  if (!carData || !laps) {
    return NextResponse.json({ energy: [] })
  }

  const energy = aggregateEnergy(carData, laps)
  cacheSet(cacheKey, energy)
  return NextResponse.json({ energy })
}
