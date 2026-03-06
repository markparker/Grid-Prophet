import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Countdown } from "@/components/countdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Flag, Trophy, ArrowRight, Users } from "lucide-react"
import { InviteCodeDisplay } from "@/components/invite-code-display"
import { SyncButton } from "@/components/sync-button"
import { DashboardTelemetrySection } from "@/components/dashboard-telemetry-section"
import { DashboardLastRace } from "@/components/dashboard-last-race"
import { DashboardSeasonStats } from "@/components/dashboard-season-stats"

const TOTAL_RACES = 24

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  // Fetch all data in parallel
  const [
    { data: nextRace },
    { data: lastRace },
    { data: players },
    { data: scores },
    { data: group },
    { data: allRaces },
    { data: myScores },
    { data: drivers },
    { count: completedRaces },
  ] = await Promise.all([
    supabase
      .from("races")
      .select("*")
      .gte("race_date", today)
      .order("race_date", { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from("races")
      .select("*")
      .lt("race_date", today)
      .eq("results_fetched", true)
      .order("race_date", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("players")
      .select("id, name")
      .eq("group_id", session.groupId),
    supabase.from("player_scores").select("*"),
    supabase
      .from("groups")
      .select("invite_code")
      .eq("id", session.groupId)
      .single(),
    supabase
      .from("races")
      .select("id, round, race_name, country, race_date, results_fetched")
      .order("round"),
    supabase
      .from("player_scores")
      .select("*")
      .eq("player_id", session.playerId),
    supabase.from("drivers").select("*").order("team_name, surname"),
    supabase
      .from("races")
      .select("id", { count: "exact", head: true })
      .eq("results_fetched", true),
  ])

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

  // Build leaderboard
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

  // Compute rank for current player
  const myRank = leaderboard.findIndex((p) => p.isMe) + 1

  // Find my score for last race
  const myLastRaceScores = lastRace
    ? (myScores || []).find(
        (s) => (s as { race_id?: string }).race_id === lastRace.id
      ) ?? null
    : null

  const completed = completedRaces || 0
  const progressPercent = (completed / TOTAL_RACES) * 100

  const rankBadgeColor = (index: number) => {
    if (index === 0) return "bg-yellow-500/20 text-yellow-500"
    if (index === 1) return "bg-gray-400/20 text-gray-400"
    if (index === 2) return "bg-amber-700/20 text-amber-700"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Season 2026 &middot; {completed}/{TOTAL_RACES} races
          </p>
          <Progress value={progressPercent} className="h-1.5 w-48" />
        </div>
        <SyncButton />
      </div>

      {/* Next Race Hero */}
      {nextRace && (
        <Card className="overflow-hidden border-l-4 border-l-primary border-border/30 bg-card/50">
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

      {/* Last Race + Season Stats */}
      <div className="grid gap-8 lg:grid-cols-2">
        {lastRace ? (
          <DashboardLastRace
            lastRace={lastRace}
            myLastRaceScores={
              myLastRaceScores
                ? {
                    points: (myLastRaceScores as { points: number }).points,
                    breakdown: (myLastRaceScores as { breakdown: { exact?: number; close?: number; total?: number; pole_correct?: boolean } | null }).breakdown,
                  }
                : null
            }
          />
        ) : (
          <Card className="border-border/30 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flag className="h-4 w-4 text-primary" />
                Last Race
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No races completed yet. Results will appear here after the first race.
              </p>
            </CardContent>
          </Card>
        )}

        <DashboardSeasonStats
          myScores={(myScores || []).map((s) => ({
            points: (s as { points: number }).points,
            breakdown: (s as { breakdown: { exact?: number; close?: number; total?: number; pole_correct?: boolean } | null }).breakdown,
          }))}
          rank={myRank || leaderboard.length}
          completedRaces={completed}
        />
      </div>

      {/* 3-col: Standings, Quick Actions, Your League */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Standings */}
        <Card className="border-border/30 bg-card/50 sm:col-span-2 lg:col-span-1">
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
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${rankBadgeColor(i)}`}
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
                    <span className="font-mono text-sm font-bold tabular-nums">
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
        <Card className="border-border/30 bg-card/50">
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

        {/* Your League */}
        <Card className="border-border/30 bg-card/50">
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

      {/* Telemetry Collapsible */}
      <DashboardTelemetrySection
        races={allRaces || []}
        drivers={drivers || []}
      />
    </div>
  )
}
