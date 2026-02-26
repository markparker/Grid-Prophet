import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Trophy, Target } from "lucide-react"
import { DriverBadge } from "@/components/driver-badge"

interface Driver {
  id: string
  name: string
  surname: string
  short_name: string
  team_name: string
  team_id: string
}

interface Props {
  raceResults: Array<{ driver_id: string; position: number; points: number }>
  qualyResults: Array<{ driver_id: string; grid_position: number }>
  driverMap: Map<string, Driver>
  groupPredictions: Array<{
    playerName: string
    playerId: string
    polePrediction: string | null
    positions: Array<{ driver_id: string; predicted_position: number }>
    score: number
    poleScore: number
  }>
  currentPlayerId: string
}

export function ResultComparison({
  raceResults,
  qualyResults,
  driverMap,
  groupPredictions,
  currentPlayerId,
}: Props) {
  const pole = qualyResults[0]?.driver_id || null
  const top10Results = raceResults.filter((r) => r.position <= 10)

  return (
    <div className="flex flex-col gap-4">
      {/* Actual Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            Race Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pole && driverMap.get(pole) && (
            <div className="mb-3 flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 border border-primary/10">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Pole:</span>
              <div className="flex-1">
                <DriverBadge
                  teamId={driverMap.get(pole)!.team_id}
                  shortName={driverMap.get(pole)!.short_name}
                  firstName={driverMap.get(pole)!.name}
                  lastName={driverMap.get(pole)!.surname}
                  compact
                />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            {top10Results.map((result) => {
              const driver = driverMap.get(result.driver_id)
              if (!driver) return null
              return (
                <div
                  key={result.driver_id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold",
                      result.position === 1
                        ? "bg-primary text-primary-foreground"
                        : result.position <= 3
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {result.position}
                  </span>
                  <div className="flex-1">
                    <DriverBadge
                      teamId={driver.team_id}
                      shortName={driver.short_name}
                      firstName={driver.name}
                      lastName={driver.surname}
                      compact
                    />
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {result.points} pts
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Group Predictions Comparison */}
      {groupPredictions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Group Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {groupPredictions.map((pred) => {
                const isMe = pred.playerId === currentPlayerId
                const resultMap = new Map(
                  raceResults.map((r) => [r.driver_id, r.position])
                )

                return (
                  <div
                    key={pred.playerId}
                    className={cn(
                      "rounded-lg border p-3",
                      isMe ? "border-primary/30 bg-primary/5" : "border-border"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {pred.playerName}
                        {isMe && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {pred.poleScore > 0 && (
                          <span className="rounded bg-f1-green/10 px-1.5 py-0.5 text-[10px] font-medium text-f1-green">
                            POLE +{pred.poleScore}
                          </span>
                        )}
                        <span className="font-mono text-sm font-bold text-primary">
                          {pred.score + pred.poleScore} pts
                        </span>
                      </div>
                    </div>

                    {/* Pole prediction */}
                    {pred.polePrediction && (
                      <div
                        className={cn(
                          "mb-2 flex items-center gap-1.5 rounded px-2 py-1 text-xs",
                          pred.polePrediction === pole
                            ? "bg-f1-green/10 text-f1-green"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        <Target className="h-3 w-3" />
                        Pole: {driverMap.get(pred.polePrediction)?.short_name}
                        {pred.polePrediction === pole ? " (correct)" : ""}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-5">
                      {[...pred.positions]
                        .sort((a, b) => a.predicted_position - b.predicted_position)
                        .map((pos) => {
                          const actual = resultMap.get(pos.driver_id)
                          const diff =
                            actual !== undefined
                              ? Math.abs(pos.predicted_position - actual)
                              : null

                          let bgClass = ""
                          if (diff === 0) bgClass = "text-f1-green"
                          else if (diff === 1) bgClass = "text-f1-yellow"
                          else bgClass = "text-muted-foreground"

                          return (
                            <div
                              key={pos.driver_id}
                              className={cn("flex items-center gap-1 text-xs", bgClass)}
                            >
                              <span className="font-mono w-5">
                                P{pos.predicted_position}
                              </span>
                              <span className="font-medium">
                                {driverMap.get(pos.driver_id)?.short_name}
                              </span>
                              {diff === 0 && (
                                <span className="text-[10px]">+3</span>
                              )}
                              {diff === 1 && (
                                <span className="text-[10px]">+1</span>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
