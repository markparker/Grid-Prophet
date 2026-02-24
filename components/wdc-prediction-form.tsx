"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, Trophy } from "lucide-react"

interface Driver {
  id: string
  name: string
  surname: string
  short_name: string
  number: number
  team_name: string
}

interface ExistingPrediction {
  wdc_prediction_positions: Array<{
    driver_id: string
    predicted_position: number
  }>
}

interface Props {
  drivers: Driver[]
  existingPrediction: ExistingPrediction | null
  currentStandings: Array<{
    driver_id: string
    points: number
    position: number
  }>
}

export function WdcPredictionForm({
  drivers,
  existingPrediction,
  currentStandings,
}: Props) {
  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const standingsMap = new Map(
    currentStandings.map((s) => [s.driver_id, s])
  )

  // Initialize order from existing prediction or default to current standings/driver order
  const existingPositions = existingPrediction?.wdc_prediction_positions || []
  const sortedExisting = [...existingPositions].sort(
    (a, b) => a.predicted_position - b.predicted_position
  )

  const [order, setOrder] = useState<string[]>(() => {
    if (sortedExisting.length === 22) {
      return sortedExisting.map((p) => p.driver_id)
    }
    if (currentStandings.length > 0 && currentStandings.some((s) => s.points > 0)) {
      return currentStandings.map((s) => s.driver_id)
    }
    return drivers.map((d) => d.id)
  })
  const [saving, setSaving] = useState(false)

  const moveDriver = useCallback(
    (index: number, direction: "up" | "down") => {
      setOrder((prev) => {
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
    if (order.length !== 22) {
      toast.error("All 22 drivers must be included")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/predictions/wdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: order.map((driverId, i) => ({
            driver_id: driverId,
            position: i + 1,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to save prediction")
      } else {
        toast.success("WDC prediction saved!")
      }
    } catch {
      toast.error("Something went wrong")
    }
    setSaving(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Prediction */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            Your Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            {order.map((driverId, index) => {
              const driver = driverMap.get(driverId)
              if (!driver) return null

              return (
                <div
                  key={driverId}
                  className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-2 py-1.5"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold",
                      index === 0
                        ? "bg-primary text-primary-foreground"
                        : index <= 2
                        ? "bg-primary/20 text-primary"
                        : index <= 9
                        ? "bg-muted text-muted-foreground"
                        : "bg-transparent text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground w-7">
                    {driver.short_name}
                  </span>
                  <span className="flex-1 text-xs font-medium truncate">
                    {driver.name} {driver.surname}
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block truncate max-w-20">
                    {driver.team_name}
                  </span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => moveDriver(index, "up")}
                      disabled={index === 0}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                      aria-label={`Move ${driver.surname} up`}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveDriver(index, "down")}
                      disabled={index === order.length - 1}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                      aria-label={`Move ${driver.surname} down`}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="mt-4 w-full"
          >
            {saving
              ? "Saving..."
              : existingPrediction
              ? "Update WDC Prediction"
              : "Save WDC Prediction"}
          </Button>
        </CardContent>
      </Card>

      {/* Current Standings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Current WDC Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStandings.every((s) => s.points === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No race results yet. Standings will update as the season
              progresses.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {currentStandings.map((standing) => {
                const driver = driverMap.get(standing.driver_id)
                if (!driver) return null
                return (
                  <div
                    key={standing.driver_id}
                    className="flex items-center gap-2 px-2 py-1.5"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold",
                        standing.position === 1
                          ? "bg-primary text-primary-foreground"
                          : standing.position <= 3
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {standing.position}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground w-7">
                      {driver.short_name}
                    </span>
                    <span className="flex-1 text-xs font-medium">
                      {driver.name} {driver.surname}
                    </span>
                    <span className="font-mono text-xs font-bold">
                      {standing.points}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
