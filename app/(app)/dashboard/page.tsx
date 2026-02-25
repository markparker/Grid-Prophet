import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Countdown } from "@/components/countdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flag, Trophy, ArrowRight, Users } from "lucide-react"
import { InviteCodeDisplay } from "@/components/invite-code-display"
import { SyncButton } from "@/components/sync-button"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()

  // Get next upcoming race
  const today = new Date().toISOString().split("T")[0]
  const { data: nextRace } = await supabase
    .from("races")
    .select("*")
    .gte("race_date", today)
    .order("race_date", { ascending: true })
    .limit(1)
    .single()

  // Get last completed race
  const { data: lastRace } = await supabase
    .from("races")
    .select("*")
    .lt("race_date", today)
    .eq("results_fetched", true)
    .order("race_date", { ascending: false })
    .limit(1)
    .single()

  // Get players in group
  const { data: players } = await supabase
    .from("players")
    .select("id, name")
    .eq("group_id", session.groupId)

  // Get all scores for leaderboard
  const { data: scores } = await supabase.from("player_scores").select("*")

  // Get group invite code
  const { data: group } = await supabase
    .from("groups")
    .select("invite_code")
    .eq("id", session.groupId)
    .single()

  // Check if player has prediction for next race
  let hasPrediction = false
  if (nextRace) {
    const { data: pred } = await supabase
      .from("race_predictions")
      .select("id")
      .eq("player_id", session.playerId)
      .eq("race_id", nextRace.id)
      .single()
    hasPrediction = !!pred
  }

  // Check if player has WDC prediction
  const { data: wdcPred } = await supabase
    .from("wdc_predictions")
    .select("id")
    .eq("player_id", session.playerId)
    .single()

  // Build mini leaderboard
  const leaderboard = (players || [])
    .map((player) => {
      const playerScores = (scores || []).filter(
        (s) => s.player_id === player.id
      )
      const total = playerScores.reduce(
        (sum, s) => sum + (s.points || 0),
        0
      )
      return { name: player.name, total, isMe: player.id === session.playerId }
    })
    .sort((a, b) => b.total - a.total)

  // Count completed races
  const { count: completedRaces } = await supabase
    .from("races")
    .select("id", { count: "exact", head: true })
    .eq("results_fetched", true)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {session.playerName}. Season progress:{" "}
            {completedRaces || 0}/24 races.
          </p>
        </div>
        <SyncButton />
      </div>

      {/* Next Race Hero */}
      {nextRace && (
        <Card className="overflow-hidden border-primary/20 bg-card">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                    ROUND {nextRace.round}
                  </span>
                  {nextRace.is_sprint && (
                    <span className="rounded bg-f1-yellow/10 px-2 py-0.5 text-xs font-medium text-f1-yellow">
                      SPRINT
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold">{nextRace.race_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {nextRace.city}, {nextRace.country} &middot;{" "}
                  {new Date(nextRace.race_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <Countdown
                  targetDate={nextRace.qualifying_date || nextRace.race_date}
                  label="Predictions lock in"
                />
                <Link href={`/races/${nextRace.round}`}>
                  <Button size="sm" className="gap-1.5">
                    {hasPrediction ? "View Prediction" : "Make Prediction"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Mini Leaderboard */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" />
              Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No scores yet. Make predictions to start scoring!
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {leaderboard.slice(0, 5).map((player, i) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          player.isMe ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {player.name}
                        {player.isMe && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold">
                      {player.total}
                    </span>
                  </div>
                ))}
                <Link href="/leaderboard">
                  <Button variant="ghost" size="sm" className="mt-1 w-full gap-1 text-xs">
                    Full Leaderboard
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/races">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Flag className="h-3.5 w-3.5" />
                View All Races
              </Button>
            </Link>
            <Link href="/wdc">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Trophy className="h-3.5 w-3.5" />
                {wdcPred ? "Update" : "Make"} WDC Prediction
              </Button>
            </Link>
            {lastRace && (
              <Link href={`/races/${lastRace.round}`}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Last Race Results
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Group Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Your League
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-muted-foreground">League</p>
              <p className="font-medium">{session.groupName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="font-medium">{players?.length || 0} players</p>
            </div>
            {group?.invite_code && (
              <InviteCodeDisplay code={group.invite_code} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
