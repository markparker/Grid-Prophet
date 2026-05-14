import { describe, it, expect } from "vitest"
import {
  scoreRacePrediction,
  scorePolePrediction,
  scoreWdcPrediction,
  type PositionPrediction,
  type ActualResult,
} from "@/lib/scoring"

// Helpers
const pred = (driver_id: string, predicted_position: number): PositionPrediction => ({
  driver_id,
  predicted_position,
})
const actual = (driver_id: string, position: number): ActualResult => ({
  driver_id,
  position,
})

describe("scorePolePrediction", () => {
  it("returns 5 for a correct prediction", () => {
    expect(scorePolePrediction("max_verstappen", "max_verstappen")).toBe(5)
  })

  it("returns 0 for an incorrect prediction", () => {
    expect(scorePolePrediction("max_verstappen", "lewis_hamilton")).toBe(0)
  })

  it("returns 0 when predicted is null", () => {
    expect(scorePolePrediction(null, "max_verstappen")).toBe(0)
  })

  it("returns 0 when actual is null", () => {
    expect(scorePolePrediction("max_verstappen", null)).toBe(0)
  })

  it("returns 0 when both are null", () => {
    expect(scorePolePrediction(null, null)).toBe(0)
  })
})

describe("scoreRacePrediction", () => {
  it("awards 3 points for an exact position match", () => {
    const result = scoreRacePrediction(
      [pred("driver_a", 1)],
      [actual("driver_a", 1)]
    )
    expect(result.total).toBe(3)
    expect(result.exact).toBe(1)
    expect(result.close).toBe(0)
    expect(result.details[0].type).toBe("exact")
  })

  it("awards 1 point when off by one position", () => {
    const result = scoreRacePrediction(
      [pred("driver_a", 2)],
      [actual("driver_a", 3)]
    )
    expect(result.total).toBe(1)
    expect(result.close).toBe(1)
    expect(result.details[0].type).toBe("close")
  })

  it("awards 0 points when off by more than one position", () => {
    const result = scoreRacePrediction(
      [pred("driver_a", 1)],
      [actual("driver_a", 5)]
    )
    expect(result.total).toBe(0)
    expect(result.details[0].type).toBe("miss")
  })

  it("excludes drivers who finished outside top 10 (DNFs, P11+)", () => {
    const result = scoreRacePrediction(
      [pred("driver_a", 1)],
      [actual("driver_a", 11)]
    )
    expect(result.total).toBe(0)
    expect(result.details[0].type).toBe("not_in_top_10")
  })

  it("excludes drivers with no result entry (not classified)", () => {
    const result = scoreRacePrediction(
      [pred("driver_a", 1)],
      [] // no results
    )
    expect(result.total).toBe(0)
    expect(result.details[0].type).toBe("not_in_top_10")
    expect(result.details[0].actual).toBeNull()
  })

  it("scores a full top-10 prediction correctly", () => {
    const predictions = Array.from({ length: 10 }, (_, i) =>
      pred(`driver_${i + 1}`, i + 1)
    )
    const actuals = Array.from({ length: 10 }, (_, i) =>
      actual(`driver_${i + 1}`, i + 1)
    )
    const result = scoreRacePrediction(predictions, actuals)
    expect(result.exact).toBe(10)
    expect(result.total).toBe(30)
  })

  it("handles an empty predictions array", () => {
    const result = scoreRacePrediction([], [actual("driver_a", 1)])
    expect(result.total).toBe(0)
    expect(result.details).toHaveLength(0)
  })

  it("scores a mix of exact, close, and miss", () => {
    // driver_a: predicted 1, actual 1 → exact (3pts)
    // driver_b: predicted 3, actual 4 → close (1pt)
    // driver_c: predicted 5, actual 9 → miss (0pts)
    const result = scoreRacePrediction(
      [pred("driver_a", 1), pred("driver_b", 3), pred("driver_c", 5)],
      [actual("driver_a", 1), actual("driver_b", 4), actual("driver_c", 9)]
    )
    expect(result.exact).toBe(1)
    expect(result.close).toBe(1)
    expect(result.total).toBe(4)
  })

  it("is not fooled by off-by-one in both directions", () => {
    const lower = scoreRacePrediction(
      [pred("driver_a", 2)],
      [actual("driver_a", 1)]
    )
    const upper = scoreRacePrediction(
      [pred("driver_a", 1)],
      [actual("driver_a", 2)]
    )
    expect(lower.total).toBe(1)
    expect(upper.total).toBe(1)
  })

  it("scores exactly position 10 as valid (boundary)", () => {
    const result = scoreRacePrediction(
      [pred("driver_a", 10)],
      [actual("driver_a", 10)]
    )
    expect(result.total).toBe(3)
    expect(result.details[0].type).toBe("exact")
  })
})

describe("scoreWdcPrediction", () => {
  it("awards points for exact position match", () => {
    const result = scoreWdcPrediction(
      [pred("driver_a", 1)],
      [actual("driver_a", 1)]
    )
    expect(result.total).toBe(3)
  })

  it("awards 1 point for off-by-one", () => {
    const result = scoreWdcPrediction(
      [pred("driver_a", 2)],
      [actual("driver_a", 3)]
    )
    expect(result.total).toBe(1)
  })

  it("includes drivers outside top 10 (unlike race scoring)", () => {
    // A driver finishing P15 in WDC standings should still be scored
    const result = scoreWdcPrediction(
      [pred("driver_a", 15)],
      [actual("driver_a", 15)]
    )
    expect(result.total).toBe(3)
    expect(result.details[0].type).toBe("exact")
  })

  it("does not exclude drivers finishing outside position 10", () => {
    // Predicting P12 and actual is P12 → should score (WDC covers full grid)
    const result = scoreWdcPrediction(
      [pred("driver_a", 12)],
      [actual("driver_a", 12)]
    )
    expect(result.total).toBe(3)
  })

  it("scores a full 20-driver WDC prediction", () => {
    const predictions = Array.from({ length: 20 }, (_, i) =>
      pred(`driver_${i + 1}`, i + 1)
    )
    const actuals = Array.from({ length: 20 }, (_, i) =>
      actual(`driver_${i + 1}`, i + 1)
    )
    const result = scoreWdcPrediction(predictions, actuals)
    expect(result.exact).toBe(20)
    expect(result.total).toBe(60)
  })
})
