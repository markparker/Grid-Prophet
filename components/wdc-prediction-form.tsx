"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { GripVertical, Trophy, Lock, TrendingUp, Minus, TrendingDown, Radio } from "lucide-react"
import { DriverBadge } from "@/components/driver-badge"

interface Driver {
  id: string
  name: string
  surname: string
  short_name: string
  number: number
  team_name: string
  team_id: string
}

interface ExistingPrediction {
  wdc_prediction_positions: Array<{
    driver_id: string
    predicted_position: number
  }>
}

interface Standing {
  driver_id: string
  points: number
  position: number
  source: "live" | "local"
}

interface Props {
  drivers: Driver[]
  existingPrediction: ExistingPrediction | null
  currentStandings: Standing[]
  isLocked: boolean
  hasLiveData: boolean
  lockDate: string
}

export function WdcPredictionForm({
  drivers,
  existingPrediction,
  currentStandings,
  isLocked,
  hasLiveData,
}: Props) {
  const driverMap = new Map(drivers.map((d) => [d.id, d]))

  const existingPositions = existingPrediction?.wdc_prediction_positions || []
  const sortedExisting = [...existingPositions].sort(
    (a, b) => a.predicted_position - b.predicted_position
  )

  const [order, setOrder] = useState<string[]>(() => {
    if (sortedExisting.length === drivers.length) {
      return sortedExisting.map((p) => p.driver_id)
    }
    if (hasLiveData && currentStandings.length > 0) {
      return currentStandings.map((s) => s.driver_id)
    }
    return drivers.map((d) => d.id)
  })

  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragNode = useRef<HTMLDivElement | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      if (isLocked) return
      setDragIndex(index)
      dragNode.current = e.currentTarget
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", String(index))
      setTimeout(() => {
        if (dragNode.current) dragNode.current.style.opacity = "0.4"
      }, 0)
    },
    [isLocked]
  )

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = "1"
    setDragIndex(null)
    setDragOverIndex(null)
    dragNode.current = null
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      if (dragIndex === null || dragIndex === index) return
      setDragOverIndex(index)
    },
    [dragIndex]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault()
      if (dragIndex === null || dragIndex === dropIndex) return
      setOrder((prev) => {
        const next = [...prev]
        const [removed] = next.splice(dragIndex, 1)
        next.splice(dropIndex, 0, removed)
        return next
      })
      setDragIndex(null)
      setDragOverIndex(null)
    },
    [dragIndex]
  )

  const handleMove = useCallback(
    (index: number, direction: "up" | "down") => {
      if (isLocked) return
      setOrder((prev) => {
        const next = [...prev]
        const target = direction === "up" ? index - 1 : index + 1
        if (target < 0 || target >= next.length) return prev
        ;[next[index], next[target]] = [next[target], next[index]]
        return next
      })
    },
    [isLocked]
  )

  const livePositionMap = new Map(currentStandings.map((s) => [s.driver_id, s.position]))
  const predictionPositionMap = new Map(order.map((id, i) => [id, i + 1]))

  async function handleSubmit() {
    if (isLocked) {
      toast.error("WDC predictions are locked — the season has started")
      return
    }
    if (order.length !== drivers.length) {
      toast.error(`All ${drivers.length} drivers must be included`)
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
      {/* Prediction panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" />
              Your Prediction
            </CardTitle>
            {isLocked ? (
              <Badge
                variant="secondary"
                className="gap-1 border-destructive/30 bg-destructive/10 text-destructive"
              >
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Drag to reorder
              </Badge>
            )}
          </div>
          <CardDescription>
            {isLocked
              ? existingPrediction
                ? "Your pre-season prediction is locked. Compare with the live standings."
                : "The season has started — predictions are locked and cannot be submitted."
              : "Drag drivers to set your predicted final championship order."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Show the driver list always — locked or not, prediction or no prediction */}
          <div className="flex flex-col gap-1">
            {order.map((driverId, index) => {
              const driver = driverMap.get(driverId)
              if (!driver) return null

              const isDragging = dragIndex === index
              const isDragOver = dragOverIndex === index && dragIndex !== index
              const livePos = livePositionMap.get(driverId)
              const predPos = index + 1
              const delta = livePos != null ? predPos - livePos : null

              return (
                <div
                  key={driverId}
                  draggable={!isLocked}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragLeave={() => setDragOverIndex(null)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2 py-1.5 transition-all select-none",
                    !isLocked && "cursor-grab active:cursor-grabbing",
                    isLocked && "opacity-90",
                    isDragging
                      ? "border-primary/40 bg-primary/5 opacity-40"
                      : isDragOver
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-border bg-secondary/30 hover:bg-secondary/50"
                  )}
                >
                  {!isLocked && (
                    <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                  )}
                  {isLocked && (
                    <Lock className="h-3 w-3 flex-shrink-0 text-muted-foreground/30" />
                  )}
                  <span
                    className={cn(
                      "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold",
                      index === 0
                        ? "bg-primary text-primary-foreground"
                        : index <= 2
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="flex flex-1 min-w-0">
                    <DriverBadge
                      teamId={driver.team_id}
                      shortName={driver.short_name}
                      firstName={driver.name}
                      lastName={driver.surname}
                      number={driver.number}
                      compact
                    />
                  </div>

                  {/* Live delta vs prediction */}
                  {isLocked && hasLiveData && delta !== null && (
                    <span
                      className={cn(
                        "flex flex-shrink-0 items-center gap-0.5 font-mono text-[10px]",
                        delta === 0
                          ? "text-muted-foreground"
                          : delta > 0
                          ? "text-destructive"
                          : "text-green-500"
                      )}
                      title={`Live position: P${livePos}`}
                    >
                      {delta === 0 ? (
                        <Minus className="h-3 w-3" />
                      ) : delta > 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {delta === 0 ? "=" : Math.abs(delta)}
                    </span>
                  )}

                  {/* Mobile up/down arrows */}
                  {!isLocked && (
                    <div className="flex flex-shrink-0 items-center gap-0.5 sm:hidden">
                      <button
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-20"
                        aria-label={`Move ${driver.surname} up`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 3L10 8H2L6 3Z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMove(index, "down")}
                        disabled={index === order.length - 1}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-20"
                        aria-label={`Move ${driver.surname} down`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 9L2 4H10L6 9Z" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Save button -- only shown when not locked */}
          {!isLocked && (
            <Button onClick={handleSubmit} disabled={saving} className="mt-4 w-full">
              {saving
                ? "Saving..."
                : existingPrediction
                ? "Update Prediction"
                : "Save Prediction"}
            </Button>
          )}

          {/* Locked notice when no prediction submitted */}
          {isLocked && !existingPrediction && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              No prediction was submitted before the season started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Live WDC Standings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4 text-primary" />
              Live WDC Standings
            </CardTitle>
            {hasLiveData && currentStandings[0]?.source === "live" && (
              <Badge
                variant="secondary"
                className="gap-1 border-green-500/30 bg-green-500/10 text-[10px] text-green-500"
              >
                Live
              </Badge>
            )}
          </div>
          <CardDescription>
            {hasLiveData
              ? "Official 2026 championship standings from F1 data."
              : "Standings will appear here once the season begins."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasLiveData ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Radio className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No race results yet.</p>
              <p className="text-xs text-muted-foreground">
                Standings update automatically after each race.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {currentStandings.map((standing) => {
                const driver = driverMap.get(standing.driver_id)
                if (!driver) return null

                const predictedPos = predictionPositionMap.get(standing.driver_id)
                const delta =
                  predictedPos != null ? predictedPos - standing.position : null

                return (
                  <div
                    key={standing.driver_id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary/30"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold",
                        standing.position === 1
                          ? "bg-primary text-primary-foreground"
                          : standing.position <= 3
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {standing.position}
                    </span>
                    <div className="flex flex-1 min-w-0">
                      <DriverBadge
                        teamId={driver.team_id}
                        shortName={driver.short_name}
                        firstName={driver.name}
                        lastName={driver.surname}
                        number={driver.number}
                        compact
                      />
                    </div>

                    {/* Your prediction delta vs live */}
                    {existingPrediction && delta !== null && (
                      <span
                        className={cn(
                          "flex flex-shrink-0 items-center gap-0.5 font-mono text-[10px]",
                          delta === 0
                            ? "text-muted-foreground"
                            : delta < 0
                            ? "text-destructive"
                            : "text-green-500"
                        )}
                        title={`You predicted P${predictedPos}`}
                      >
                        {delta === 0 ? (
                          <Minus className="h-3 w-3" />
                        ) : delta < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <TrendingUp className="h-3 w-3" />
                        )}
                        {delta === 0 ? "=" : Math.abs(delta)}
                      </span>
                    )}

                    <span className="w-8 flex-shrink-0 text-right font-mono text-xs font-bold tabular-nums">
                      {standing.points}
                    </span>
                  </div>
                )
              })}
              <p className="mt-2 text-right text-[10px] text-muted-foreground">
                {currentStandings[0]?.source === "live"
                  ? "Via F1 API"
                  : "Aggregated from race results"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
