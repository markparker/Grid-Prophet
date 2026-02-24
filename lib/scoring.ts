export interface PositionPrediction {
  driver_id: string
  predicted_position: number
}

export interface ActualResult {
  driver_id: string
  position: number
}

export interface ScoreBreakdown {
  exact: number
  close: number
  total: number
  details: Array<{
    driver_id: string
    predicted: number
    actual: number | null
    points: number
    type: "exact" | "close" | "miss" | "not_in_top_10"
  }>
}

export function scoreRacePrediction(
  predictions: PositionPrediction[],
  actualResults: ActualResult[]
): ScoreBreakdown {
  const resultMap = new Map<string, number>()
  actualResults.forEach((r) => resultMap.set(r.driver_id, r.position))

  let exact = 0
  let close = 0
  let total = 0
  const details: ScoreBreakdown["details"] = []

  for (const pred of predictions) {
    const actual = resultMap.get(pred.driver_id)
    if (actual === undefined || actual > 10) {
      details.push({
        driver_id: pred.driver_id,
        predicted: pred.predicted_position,
        actual: actual ?? null,
        points: 0,
        type: "not_in_top_10",
      })
      continue
    }

    const diff = Math.abs(pred.predicted_position - actual)
    if (diff === 0) {
      exact++
      total += 3
      details.push({
        driver_id: pred.driver_id,
        predicted: pred.predicted_position,
        actual,
        points: 3,
        type: "exact",
      })
    } else if (diff === 1) {
      close++
      total += 1
      details.push({
        driver_id: pred.driver_id,
        predicted: pred.predicted_position,
        actual,
        points: 1,
        type: "close",
      })
    } else {
      details.push({
        driver_id: pred.driver_id,
        predicted: pred.predicted_position,
        actual,
        points: 0,
        type: "miss",
      })
    }
  }

  return { exact, close, total, details }
}

export function scorePolePrediction(
  predicted: string | null,
  actualPole: string | null
): number {
  if (!predicted || !actualPole) return 0
  return predicted === actualPole ? 5 : 0
}

export function scoreWdcPrediction(
  predictions: PositionPrediction[],
  actualStandings: ActualResult[]
): ScoreBreakdown {
  const standingsMap = new Map<string, number>()
  actualStandings.forEach((s) => standingsMap.set(s.driver_id, s.position))

  let exact = 0
  let close = 0
  let total = 0
  const details: ScoreBreakdown["details"] = []

  for (const pred of predictions) {
    const actual = standingsMap.get(pred.driver_id)
    if (actual === undefined) {
      details.push({
        driver_id: pred.driver_id,
        predicted: pred.predicted_position,
        actual: null,
        points: 0,
        type: "not_in_top_10",
      })
      continue
    }

    const diff = Math.abs(pred.predicted_position - actual)
    if (diff === 0) {
      exact++
      total += 3
      details.push({
        driver_id: pred.driver_id,
        predicted: pred.predicted_position,
        actual,
        points: 3,
        type: "exact",
      })
    } else if (diff === 1) {
      close++
      total += 1
      details.push({
        driver_id: pred.driver_id,
        predicted: pred.predicted_position,
        actual,
        points: 1,
        type: "close",
      })
    } else {
      details.push({
        driver_id: pred.driver_id,
        predicted: pred.predicted_position,
        actual,
        points: 0,
        type: "miss",
      })
    }
  }

  return { exact, close, total, details }
}
