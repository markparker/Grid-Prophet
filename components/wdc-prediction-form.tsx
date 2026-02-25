"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { GripVertical, Trophy } from "lucide-react"

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

  const existingPositions = existingPrediction?.wdc_prediction_positions || []
  const sortedExisting = [...existingPositions].sort(
    (a, b) => a.predicted_position - b.predicted_position
  )

  const [order, setOrder] = useState<string[]>(() => {
    if (sortedExisting.length === drivers.length) {
      return sortedExisting.map((p) => p.driver_id)
    }
    if (
      currentStandings.length > 0 &&
      currentStandings.some((s) => s.points > 0)
    ) {
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
      setDragIndex(index)
      dragNode.current = e.currentTarget
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", String(index))
      // Make the drag image slightly transparent
      setTimeout(() => {
        if (dragNode.current) {
          dragNode.current.style.opacity = "0.4"
        }
      }, 0)
    },
    []
  )

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) {
      dragNode.current.style.opacity = "1"
    }
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
        const newOrder = [...prev]
        const [removed] = newOrder.splice(dragIndex, 1)
        newOrder.splice(dropIndex, 0, removed)
        return newOrder
      })

      setDragIndex(null)
      setDragOverIndex(null)
    },
    [dragIndex]
  )

  // Touch drag support state
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null)

  const handleTouchMove = useCallback(
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
      {/* Prediction */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            Your Prediction
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Drag drivers to reorder, or use the arrows on mobile.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            {order.map((driverId, index) => {
              const driver = driverMap.get(driverId)
              if (!driver) return null

              const isDragging = dragIndex === index
              const isDragOver =
                dragOverIndex === index && dragIndex !== index
              const isTouchActive = touchDragIndex === index

              return (
                <div
                  key={driverId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragLeave={() => setDragOverIndex(null)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2 py-1.5 cursor-grab active:cursor-grabbing transition-all select-none",
                    isDragging
                      ? "border-primary/40 bg-primary/5 opacity-40"
                      : isDragOver
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : isTouchActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary/30 hover:bg-secondary/50"
                  )}
                >
                  <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
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

                  {/* Mobile arrow buttons -- visible only on small screens */}
                  <div className="flex items-center gap-0.5 flex-shrink-0 sm:hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTouchMove(index, "up")
                      }}
                      disabled={index === 0}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                      aria-label={`Move ${driver.surname} up`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path d="M6 3L10 8H2L6 3Z" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTouchMove(index, "down")
                      }}
                      disabled={index === order.length - 1}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                      aria-label={`Move ${driver.surname} down`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path d="M6 9L2 4H10L6 9Z" fill="currentColor" />
                      </svg>
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
          <CardTitle className="text-base">Current WDC Standings</CardTitle>
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
