import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flag, ArrowRight, Check, X } from "lucide-react"
import Link from "next/link"

interface LastRaceScore {
  points: number
  breakdown: {
    exact?: number
    close?: number
    total?: number
    pole_correct?: boolean
  } | null
}

interface Race {
  round: number
  race_name: string
  country: string
}

interface Props {
  lastRace: Race
  myLastRaceScores: LastRaceScore | null
}

export function DashboardLastRace({ lastRace, myLastRaceScores }: Props) {
  const breakdown = myLastRaceScores?.breakdown

  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flag className="h-4 w-4 text-primary" />
          Last Race
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
            R{lastRace.round}
          </span>
          <span className="text-sm font-medium">{lastRace.race_name}</span>
        </div>

        {myLastRaceScores ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-secondary/50 px-3 py-2 text-center">
                <p className="font-mono text-lg font-bold tabular-nums">
                  {myLastRaceScores.points}
                </p>
                <p className="text-[10px] uppercase text-muted-foreground">Points</p>
              </div>
              <div className="rounded-md bg-secondary/50 px-3 py-2 text-center">
                <p className="font-mono text-lg font-bold tabular-nums">
                  {breakdown?.exact ?? 0}
                </p>
                <p className="text-[10px] uppercase text-muted-foreground">Exact</p>
              </div>
              <div className="rounded-md bg-secondary/50 px-3 py-2 text-center">
                <p className="font-mono text-lg font-bold tabular-nums">
                  {breakdown?.close ?? 0}
                </p>
                <p className="text-[10px] uppercase text-muted-foreground">Close</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm">
              {breakdown?.pole_correct ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className="text-muted-foreground">Pole prediction</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No prediction submitted for this race.
          </p>
        )}

        <Link href={`/races/${lastRace.round}`}>
          <Button variant="ghost" size="sm" className="w-full gap-1 text-xs">
            View Race Details
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
