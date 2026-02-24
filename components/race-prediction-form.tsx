"use client"

import { useState, useCallback } from "react"
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
import { GripVertical, X, Lock } from "lucide-react"

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

  const [polePrediction, setPolePrediction] = useState<string>(
    existingPrediction?.pole_prediction || ""
  )
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(
    sortedExisting.length === 10
      ? sortedExisting.map((p) => p.driver_id)
      : []
  )
  const [saving, setSaving] = useState(false)

  const availableDrivers = drivers.filter(
    (d) => !selectedDrivers.includes(d.id)
  )

  const driverMap = new Map(drivers.map((d) => [d.id, d]))

  function addDriver(driverId: string) {
    if (selectedDrivers.length >= 10) return
    setSelectedDrivers((prev) => [...prev, driverId])
  }

  function removeDriver(driverId: string) {
    setSelectedDrivers((prev) => prev.filter((id) => id !== driverId))
  }

  const moveDriver = useCallback(
    (index: number, direction: "up" | "down") => {
      setSelectedDrivers((prev) => {
        const newList = [...prev]
        const targetIndex = direction === "up" ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= newList.length) return prev
        const temp = newList[index]
        newList[index] = newList[targetIndex]
        newList[targetIndex] = temp
        return newList
      })
    },
    []
  )

  async function handleSubmit() {
    if (selectedDrivers.length !== 10) {
      toast.error("You must select exactly 10 drivers for the top 10")
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
          positions: selectedDrivers.map((driverId, i) => ({
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

  const positionLabels = [
    "P1 - Winner",
    "P2",
    "P3",
    "P4",
    "P5",
    "P6",
    "P7",
    "P8",
    "P9",
    "P10",
  ]

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
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Select pole sitter..." />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {d.short_name}
                  </span>
                  {d.name} {d.surname}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {d.team_name}
                  </span>
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

      {/* Top 10 Prediction */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Top 10 Finishing Order
            <span className="ml-2 font-normal text-sm text-muted-foreground">
              ({selectedDrivers.length}/10)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Selected drivers list */}
          <div className="flex flex-col gap-1.5">
            {selectedDrivers.map((driverId, index) => {
              const driver = driverMap.get(driverId)
              if (!driver) return null
              return (
                <div
                  key={driverId}
                  className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                      index === 0
                        ? "bg-primary text-primary-foreground"
                        : index <= 2
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground w-8">
                    {driver.short_name}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {driver.name} {driver.surname}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {driver.team_name}
                  </span>
                  {!isLocked && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => moveDriver(index, "up")}
                        disabled={index === 0}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                        aria-label={`Move ${driver.surname} up`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 3L10 8H2L6 3Z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveDriver(index, "down")}
                        disabled={index === selectedDrivers.length - 1}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                        aria-label={`Move ${driver.surname} down`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 9L2 4H10L6 9Z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeDriver(driverId)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${driver.surname}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {selectedDrivers.length < 10 &&
              Array.from({ length: 10 - selectedDrivers.length }).map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                      {selectedDrivers.length + i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {positionLabels[selectedDrivers.length + i]}
                    </span>
                  </div>
                )
              )}
          </div>

          {/* Add driver selector */}
          {!isLocked && selectedDrivers.length < 10 && (
            <Select onValueChange={addDriver}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue
                  placeholder={`Add ${positionLabels[selectedDrivers.length]} driver...`}
                />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">
                      {d.short_name}
                    </span>
                    {d.name} {d.surname}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {d.team_name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Submit */}
          {!isLocked && (
            <Button
              onClick={handleSubmit}
              disabled={saving || selectedDrivers.length !== 10 || !polePrediction}
              className="w-full sm:w-auto"
            >
              {saving
                ? "Saving..."
                : existingPrediction
                ? "Update Prediction"
                : "Save Prediction"}
            </Button>
          )}

          {isLocked && existingPrediction && (
            <p className="text-xs text-muted-foreground">
              Predictions are locked. Your prediction has been saved.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
