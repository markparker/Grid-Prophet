/**
 * Scoring System:
 * - Race prediction (top 10): 3 pts exact, 1 pt within 1 position
 * - Pole prediction: 5 pts correct
 * - WDC prediction: 3 pts exact, 1 pt within 1 position (per driver)
 */

interface PredictionPosition {
  driver_id: string
  predicted_position: number
}

interface ActualResult {
  driver_id: string
  position: number
}

export interface ScoreBreakdown {
  exactMatches: number
  nearMatches: number
  driverScores: Array<{
    driverId: string
    predicted: number
    actual: number
    points: number
    type: 'exact' | 'near' | 'miss'
  }>
}

export function calculateRaceScore(
  predictions: PredictionPosition[],
  actualResults: ActualResult[]
): { points: number; breakdown: ScoreBreakdown } {
  const actualMap = new Map<string, number>()
  actualResults.forEach((r) => actualMap.set(r.driver_id, r.position))

  let totalPoints = 0
  let exactMatches = 0
  let nearMatches = 0
  const driverScores: ScoreBreakdown['driverScores'] = []

  for (const pred of predictions) {
    const actualPos = actualMap.get(pred.driver_id)
    if (actualPos === undefined) {
      driverScores.push({
        driverId: pred.driver_id,
        predicted: pred.predicted_position,
        actual: -1,
        points: 0,
        type: 'miss',
      })
      continue
    }

    const diff = Math.abs(pred.predicted_position - actualPos)
    let points = 0
    let type: 'exact' | 'near' | 'miss' = 'miss'

    if (diff === 0) {
      points = 3
      type = 'exact'
      exactMatches++
    } else if (diff === 1) {
      points = 1
      type = 'near'
      nearMatches++
    }

    totalPoints += points
    driverScores.push({
      driverId: pred.driver_id,
      predicted: pred.predicted_position,
      actual: actualPos,
      points,
      type,
    })
  }

  return {
    points: totalPoints,
    breakdown: { exactMatches, nearMatches, driverScores },
  }
}

export function calculatePoleScore(
  predictedDriverId: string | null,
  actualPoleDriverId: string | null
): number {
  if (!predictedDriverId || !actualPoleDriverId) return 0
  return predictedDriverId === actualPoleDriverId ? 5 : 0
}

export function calculateWdcScore(
  predictions: PredictionPosition[],
  actualStandings: ActualResult[]
): { points: number; breakdown: ScoreBreakdown } {
  return calculateRaceScore(predictions, actualStandings)
}
