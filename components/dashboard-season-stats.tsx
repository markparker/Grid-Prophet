import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"

interface PlayerScore {
  points: number
  breakdown: {
    exact?: number
    close?: number
    total?: number
    pole_correct?: boolean
  } | null
}

interface Props {
  myScores: PlayerScore[]
  rank: number
  completedRaces: number
}

export function DashboardSeasonStats({ myScores, rank, completedRaces }: Props) {
  const totalPoints = myScores.reduce((sum, s) => sum + (s.points || 0), 0)
  const racesPredicted = myScores.length
  const exactPredictions = myScores.reduce(
    (sum, s) => sum + (s.breakdown?.exact ?? 0),
    0
  )
  const poleCorrect = myScores.filter((s) => s.breakdown?.pole_correct).length
  const bestScore = myScores.length > 0
    ? Math.max(...myScores.map((s) => s.points || 0))
    : 0

  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-primary" />
          Season Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {completedRaces === 0 ? (
          <p className="text-sm text-muted-foreground">
            No races completed yet. Stats will appear after the first race.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Total Points" value={totalPoints} />
            <Stat label="League Rank" value={`#${rank}`} />
            <Stat label="Races Predicted" value={`${racesPredicted}/${completedRaces}`} />
            <Stat label="Exact Picks" value={exactPredictions} />
            <Stat label="Pole Correct" value={poleCorrect} />
            <Stat label="Best Race" value={bestScore} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-secondary/50 px-3 py-2">
      <p className="font-mono text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
    </div>
  )
}
