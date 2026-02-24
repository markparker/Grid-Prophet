import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MapPin, Check, Lock, ChevronRight, Zap } from "lucide-react"

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

const countryFlags: Record<string, string> = {
  Australia: "AU",
  China: "CN",
  Japan: "JP",
  Bahrain: "BH",
  "Saudi Arabia": "SA",
  USA: "US",
  Italy: "IT",
  Monaco: "MC",
  Spain: "ES",
  Canada: "CA",
  Austria: "AT",
  "Great Britain": "GB",
  Belgium: "BE",
  Netherlands: "NL",
  Azerbaijan: "AZ",
  Singapore: "SG",
  Mexico: "MX",
  Brazil: "BR",
  Qatar: "QA",
  UAE: "AE",
}

export function RaceCard({ race, status, hasPrediction }: RaceCardProps) {
  const raceDate = new Date(race.race_date)

  return (
    <Link href={`/races/${race.round}`}>
      <Card
        className={cn(
          "group relative overflow-hidden border-border bg-card transition-all hover:border-primary/30 hover:bg-card/80",
          status === "results" && "border-f1-green/20",
          status === "locked" && "opacity-75"
        )}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {/* Round Number */}
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              R{race.round}
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {raceDate.toLocaleDateString("en-US", { day: "2-digit" })}
            </span>
          </div>

          {/* Race Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {race.race_name.replace(" Grand Prix", " GP")}
              </span>
              {race.is_sprint && (
                <span className="flex shrink-0 items-center gap-0.5 rounded bg-f1-yellow/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-f1-yellow">
                  <Zap className="h-2.5 w-2.5" />
                  Sprint
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {race.city}, {race.country}
            </span>
            <span className="text-xs text-muted-foreground">
              {raceDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex shrink-0 items-center gap-2">
            {hasPrediction && status !== "results" && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-f1-green/10">
                <Check className="h-3 w-3 text-f1-green" />
              </span>
            )}
            {status === "locked" && !race.results_fetched && (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            {status === "results" && (
              <span className="rounded-full bg-f1-green/10 px-2 py-0.5 text-[10px] font-bold uppercase text-f1-green">
                Results
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
