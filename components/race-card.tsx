import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Lock, Circle, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface RaceCardProps {
  race: {
    id: string
    round: number
    race_name: string
    country: string
    city: string
    race_date: string
    is_sprint: boolean
  }
  status: "upcoming" | "locked" | "completed" | "results"
  hasPrediction: boolean
}

const statusConfig = {
  upcoming: {
    label: "Open",
    color: "text-f1-green",
    bg: "bg-f1-green/10",
    icon: Circle,
  },
  locked: {
    label: "Locked",
    color: "text-f1-yellow",
    bg: "bg-f1-yellow/10",
    icon: Lock,
  },
  completed: {
    label: "Awaiting Results",
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: Circle,
  },
  results: {
    label: "Results In",
    color: "text-primary",
    bg: "bg-primary/10",
    icon: Trophy,
  },
}

export function RaceCard({ race, status, hasPrediction }: RaceCardProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const raceDate = new Date(race.race_date)

  return (
    <Link href={`/races/${race.round}`}>
      <Card className="group transition-colors hover:border-primary/30 hover:bg-card/80">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-sm font-bold text-muted-foreground">
            R{String(race.round).padStart(2, "0")}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-semibold group-hover:text-primary transition-colors">
                {race.race_name}
              </h3>
              {race.is_sprint && (
                <span className="flex-shrink-0 rounded bg-f1-yellow/10 px-1.5 py-0.5 text-[10px] font-medium text-f1-yellow">
                  SPRINT
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {race.city}, {race.country}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-muted-foreground">
                {raceDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <div className="flex items-center gap-1.5">
                {hasPrediction && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-f1-green" />
                )}
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    config.bg,
                    config.color
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {config.label}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
