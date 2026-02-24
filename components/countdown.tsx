"use client"

import { useEffect, useState } from "react"

interface CountdownProps {
  targetDate: string
  className?: string
}

function getTimeLeft(target: Date) {
  const now = new Date()
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  }
}

export function Countdown({ targetDate, className = "" }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(new Date(targetDate)))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(new Date(targetDate)))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (timeLeft.expired) {
    return <span className={className}>Race day!</span>
  }

  const blocks = [
    { value: timeLeft.days, label: "D" },
    { value: timeLeft.hours, label: "H" },
    { value: timeLeft.minutes, label: "M" },
    { value: timeLeft.seconds, label: "S" },
  ]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {blocks.map((block, i) => (
        <div key={block.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {String(block.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {block.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span className="mt-[-12px] text-lg text-muted-foreground/50">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
