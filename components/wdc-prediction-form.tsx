"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, GripVertical, Save, Trophy } from "lucide-react"
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
  wdc_prediction_positions: Array<{
    driver_id: string
    predicted_position: number
  }>
}

interface WdcPredictionFormProps {
  drivers: Driver[]
  existingPrediction: ExistingPrediction | null
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

export function WdcPredictionForm({
  drivers,
  existingPrediction,
}: WdcPredictionFormProps) {
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Build initial order from existing prediction or default driver order
  const getInitialOrder = (): Driver[] => {
    if (existingPrediction?.wdc_prediction_positions?.length === 22) {
      const posMap = new Map<string, number>()
      existingPrediction.wdc_prediction_positions.forEach((pp) => {
        posMap.set(pp.driver_id, pp.predicted_position)
      })
      return [...drivers].sort(
        (a, b) => (posMap.get(a.id) || 99) - (posMap.get(b.id) || 99)
      )
    }
    return [...drivers]
  }

  const [orderedDrivers, setOrderedDrivers] = useState<Driver[]>(
    getInitialOrder
  )

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    setOrderedDrivers((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const movePosition = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= orderedDrivers.length) return
    setOrderedDrivers((prev) => {
      const next = [...prev]
      ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const positions = orderedDrivers.map((d, i) => ({
        driverId: d.id,
        position: i + 1,
      }))

      const res = await fetch("/api/predictions/wdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to save WDC prediction")
        return
      }

      toast.success("WDC prediction saved!")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const positionBadgeStyles = [
    "bg-f1-yellow/15 text-f1-yellow ring-f1-yellow/20",
    "bg-zinc-300/10 text-zinc-300 ring-zinc-300/20",
    "bg-amber-700/15 text-amber-600 ring-amber-700/20",
  ]

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          <Trophy className="h-4 w-4 text-primary" />
          Your WDC Prediction
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Drag to reorder all 22 drivers into your predicted final championship
          order.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {orderedDrivers.map((driver, index) => {
          const teamColor =
            teamColors[driver.team_id] || "bg-secondary text-secondary-foreground"

          return (
            <div
              key={driver.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 transition-all cursor-grab active:cursor-grabbing",
                dragIndex === index &&
                  "border-primary/50 bg-primary/5 opacity-70"
              )}
            >
              {/* Position */}
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ring-1",
                  index < 3
                    ? positionBadgeStyles[index]
                    : "bg-secondary text-muted-foreground ring-border"
                )}
              >
                {index + 1}
              </span>

              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />

              {/* Driver */}
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                  teamColor
                )}
              >
                {driver.short_name}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {driver.name} {driver.surname}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {driver.team_name}
              </span>

              {/* Move buttons */}
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => movePosition(index, "up")}
                  disabled={index === 0}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  aria-label={`Move ${driver.surname} up`}
                >
                  <svg className="h-3 w-3" viewBox="0 0 10 6" fill="none">
                    <path
                      d="M1 5L5 1L9 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => movePosition(index, "down")}
                  disabled={index === orderedDrivers.length - 1}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  aria-label={`Move ${driver.surname} down`}
                >
                  <svg className="h-3 w-3" viewBox="0 0 10 6" fill="none">
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full"
          size="lg"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save WDC Prediction
        </Button>
      </CardContent>
    </Card>
  )
}
