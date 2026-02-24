"use client"

import { useEffect, useState } from "react"

interface CountdownProps {
  targetDate: string
  label?: string
}

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds }
}

export function Countdown({ targetDate, label }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (!timeLeft) {
    return (
      <span className="text-sm text-f1-green font-medium">Race complete</span>
    )
  }

  const blocks = [
    { value: timeLeft.days, label: "D" },
    { value: timeLeft.hours, label: "H" },
    { value: timeLeft.minutes, label: "M" },
    { value: timeLeft.seconds, label: "S" },
  ]

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
      <div className="flex items-center gap-1.5">
        {blocks.map((block) => (
          <div
            key={block.label}
            className="flex items-baseline gap-0.5 font-mono"
          >
            <span className="text-lg font-bold tabular-nums text-foreground">
              {String(block.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {block.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
