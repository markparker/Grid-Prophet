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
import { Loader2, GripVertical, X, Plus, Save, Lock, Trophy, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

interface Driver {
  id: string
  name: string
  surname: string
  short_name: string
  number: number
  team_id: string
  team_name: string
}

interface ExistingPrediction {
  id: string
  pole_prediction: string | null
  race_prediction_positions: Array<{
    driver_id: string
    predicted_position: number
  }>
}

interface RacePredictionFormProps {
  raceId: string
  drivers: Driver[]
  existingPrediction: ExistingPrediction | null
  isLocked: boolean
}

const teamColors: Record<string, string> = {
  red_bull: "bg-blue-600/20 text-blue-400",
  ferrari: "bg-red-600/20 text-red-400",
  mclaren: "bg-orange-500/20 text-orange-400",
  mercedes: "bg-teal-500/20 text-teal-400",
  aston_martin: "bg-green-600/20 text-green-400",
  alpine: "bg-pink-500/20 text-pink-400",
  haas: "bg-gray-400/20 text-gray-300",
  racing_bulls: "bg-indigo-500/20 text-indigo-400",
  williams: "bg-sky-500/20 text-sky-400",
  audi: "bg-zinc-400/20 text-zinc-300",
  cadillac: "bg-yellow-500/20 text-yellow-400",
}

export function RacePredictionForm({
  raceId,
  drivers,
  existingPrediction,
  isLocked,
}: RacePredictionFormProps) {
  const [saving, setSaving] = useState(false)
  const [polePrediction, setPolePrediction] = useState<string>(
    existingPrediction?.pole_prediction || ""
  )

  // Build initial positions from existing prediction
  const initialPositions: Array<{ position: number; driverId: string }> = []
  if (existingPrediction?.race_prediction_positions) {
    existingPrediction.race_prediction_positions
      .sort((a, b) => a.predicted_position - b.predicted_position)
      .forEach((pp) => {
        initialPositions.push({
          position: pp.predicted_position,
          driverId: pp.driver_id,
        })
      })
  }

  const [positions, setPositions] = useState<
    Array<{ position: number; driverId: string }>
  >(initialPositions)

  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const driversMap = new Map(drivers.map((d) => [d.id, d]))
  const usedDriverIds = new Set(positions.map((p) => p.driverId))

  const availableDrivers = drivers.filter((d) => !usedDriverIds.has(d.id))

  const addDriver = useCallback(
    (driverId: string) => {
      if (positions.length >= 10) return
      setPositions((prev) => [
        ...prev,
        { position: prev.length + 1, driverId },
      ])
    },
    [positions.length]
  )

  const removeDriver = useCallback((index: number) => {
    setPositions((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.map((p, i) => ({ ...p, position: i + 1 }))
    })
  }, [])

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    setPositions((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next.map((p, i) => ({ ...p, position: i + 1 }))
    })
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  // Touch-based reordering: move up/down
  const movePosition = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= positions.length) return
    setPositions((prev) => {
      const next = [...prev]
      ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
      return next.map((p, i) => ({ ...p, position: i + 1 }))
    })
  }

  const handleSave = async () => {
    if (positions.length !== 10) {
      toast.error("You must predict all 10 positions")
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
          positions: positions.map((p) => ({
            driverId: p.driverId,
            position: p.position,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to save prediction")
        return
      }

      toast.success("Prediction saved!")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const positionLabels = ["Winner", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"]
  const positionBadgeStyles = [
    "bg-f1-yellow/15 text-f1-yellow ring-f1-yellow/20",
    "bg-zinc-300/10 text-zinc-300 ring-zinc-300/20",
    "bg-amber-700/15 text-amber-600 ring-amber-700/20",
  ]

  return (
    <div className="flex flex-col gap-6">
      {isLocked && (
        <Card className="border-f1-yellow/20 bg-f1-yellow/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Lock className="h-5 w-5 text-f1-yellow" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Predictions are locked
              </p>
              <p className="text-xs text-muted-foreground">
                Qualifying has started. You can no longer change your prediction.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pole Position Prediction */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-4 w-4 text-f1-yellow" />
            Pole Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={polePrediction}
            onValueChange={setPolePrediction}
            disabled={isLocked}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Select pole sitter" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {driver.number}
                    </span>
                    <span>
                      {driver.name} {driver.surname}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {driver.team_name}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Top 10 Prediction */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <Medal className="h-4 w-4 text-primary" />
            Top 10 Finishing Order
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {positions.length}/10 positions filled. Drag to reorder.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {/* Current positions */}
          {positions.map((pos, index) => {
            const driver = driversMap.get(pos.driverId)
            if (!driver) return null
            const teamColor = teamColors[driver.team_id] || "bg-secondary text-secondary-foreground"

            return (
              <div
                key={pos.driverId}
                draggable={!isLocked}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-all",
                  dragIndex === index && "border-primary/50 bg-primary/5 opacity-70",
                  !isLocked && "cursor-grab active:cursor-grabbing"
                )}
              >
                {/* Position badge */}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ring-1",
                    index < 3
                      ? positionBadgeStyles[index]
                      : "bg-secondary text-muted-foreground ring-border"
                  )}
                >
                  P{index + 1}
                </span>

                {!isLocked && (
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}

                {/* Driver Info */}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                      teamColor
                    )}
                  >
                    {driver.short_name}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {driver.name} {driver.surname}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {driver.team_name}
                  </span>
                </div>

                {/* Reorder / Remove */}
                {!isLocked && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => movePosition(index, "up")}
                      disabled={index === 0}
                      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      aria-label={`Move ${driver.surname} up`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 10 6" fill="none">
                        <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => movePosition(index, "down")}
                      disabled={index === positions.length - 1}
                      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      aria-label={`Move ${driver.surname} down`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDriver(index)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${driver.surname}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Add driver */}
          {positions.length < 10 && !isLocked && (
            <div className="mt-2">
              <Select
                key={`add-driver-${positions.length}`}
                onValueChange={(val) => addDriver(val)}
              >
                <SelectTrigger className="w-full border-dashed bg-background text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>
                      Add {positionLabels[positions.length] || `P${positions.length + 1}`}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {driver.number}
                        </span>
                        {driver.name} {driver.surname}
                        <span className="text-xs text-muted-foreground">
                          {driver.team_name}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Save Button */}
          {!isLocked && (
            <Button
              onClick={handleSave}
              disabled={saving || positions.length !== 10 || !polePrediction}
              className="mt-4 w-full"
              size="lg"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Prediction
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
