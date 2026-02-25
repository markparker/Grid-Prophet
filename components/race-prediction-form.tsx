"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Lock } from "lucide-react"

interface Driver {
  id: string
  name: string
  surname: string
  short_name: string
  number: number
  team_name: string
}

interface ExistingPrediction {
  pole_prediction: string | null
  race_prediction_positions: Array<{
    driver_id: string
    predicted_position: number
  }>
}

interface Props {
  raceId: string
  drivers: Driver[]
  existingPrediction: ExistingPrediction | null
  isLocked: boolean
}

const POSITION_LABELS = [
  "P1 - Winner",
  "P2 - Podium",
  "P3 - Podium",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
  "P10",
]

export function RacePredictionForm({
  raceId,
  drivers,
  existingPrediction,
  isLocked,
}: Props) {
  const existingPositions = existingPrediction?.race_prediction_positions || []
  const sortedExisting = [...existingPositions].sort(
    (a, b) => a.predicted_position - b.predicted_position
  )

  // Initialize 10 slots, each either filled from existing prediction or empty string
  const [positions, setPositions] = useState<string[]>(() => {
    if (sortedExisting.length === 10) {
      return sortedExisting.map((p) => p.driver_id)
    }
    return Array(10).fill("")
  })

  const [polePrediction, setPolePrediction] = useState<string>(
    existingPrediction?.pole_prediction || ""
  )
  const [saving, setSaving] = useState(false)

  const driverMap = new Map(drivers.map((d) => [d.id, d]))

  // Returns which drivers are available for a given slot (excluding those already picked in other slots)
  function getAvailableDrivers(slotIndex: number) {
    const usedIds = new Set(
      positions.filter((id, i) => id && i !== slotIndex)
    )
    return drivers.filter((d) => !usedIds.has(d.id))
  }

  function handlePositionChange(slotIndex: number, driverId: string) {
    setPositions((prev) => {
      const next = [...prev]
      next[slotIndex] = driverId
      return next
    })
  }

  function handleClearPosition(slotIndex: number) {
    setPositions((prev) => {
      const next = [...prev]
      next[slotIndex] = ""
      return next
    })
  }

  const filledCount = positions.filter(Boolean).length

  async function handleSubmit() {
    if (filledCount !== 10) {
      toast.error("You must select a driver for all 10 positions")
      return
    }
    if (!polePrediction) {
      toast.error("Please select a pole position prediction")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/predictions/race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raceId,
          polePrediction,
          positions: positions.map((driverId, i) => ({
            driver_id: driverId,
            position: i + 1,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to save prediction")
      } else {
        toast.success("Prediction saved!")
      }
    } catch {
      toast.error("Something went wrong")
    }
    setSaving(false)
  }

  if (isLocked && !existingPrediction) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-8">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Predictions are locked for this race.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pole Position */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pole Position Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={polePrediction}
            onValueChange={setPolePrediction}
            disabled={isLocked}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select pole sitter..." />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.short_name} - {d.name} {d.surname} ({d.team_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {polePrediction && (
            <p className="mt-2 text-xs text-muted-foreground">
              Selected: {driverMap.get(polePrediction)?.name}{" "}
              {driverMap.get(polePrediction)?.surname}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top 10 Prediction - Each position has its own Select */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Top 10 Finishing Order
            <span className="ml-2 font-normal text-sm text-muted-foreground">
              ({filledCount}/10)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {POSITION_LABELS.map((label, index) => {
            const selectedDriverId = positions[index]
            const selectedDriver = selectedDriverId
              ? driverMap.get(selectedDriverId)
              : null
            const available = getAvailableDrivers(index)

            return (
              <div key={index} className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-xs font-bold ${
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : index <= 2
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </span>

                <div className="flex-1">
                  <Select
                    value={selectedDriverId || ""}
                    onValueChange={(val) => handlePositionChange(index, val)}
                    disabled={isLocked}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={label}
                      >
                        {selectedDriver
                          ? `${selectedDriver.short_name} - ${selectedDriver.name} ${selectedDriver.surname}`
                          : label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {available.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.short_name} - {d.name} {d.surname} ({d.team_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDriverId && !isLocked && (
                  <button
                    onClick={() => handleClearPosition(index)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label={`Clear ${label}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}

          {/* Submit */}
          {!isLocked && (
            <Button
              onClick={handleSubmit}
              disabled={saving || filledCount !== 10 || !polePrediction}
              className="mt-2 w-full sm:w-auto"
            >
              {saving
                ? "Saving..."
                : existingPrediction
                ? "Update Prediction"
                : "Save Prediction"}
            </Button>
          )}

          {isLocked && existingPrediction && (
            <p className="mt-2 text-xs text-muted-foreground">
              Predictions are locked. Your prediction has been saved.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
