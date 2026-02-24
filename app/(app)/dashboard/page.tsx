import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Calendar,
  Trophy,
  Target,
  ChevronRight,
  Users,
} from "lucide-react"
import { Countdown } from "@/components/countdown"
import { InviteCodeDisplay } from "@/components/invite-code-display"
import { SyncButton } from "@/components/sync-button"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = await createClient()

  // Get next upcoming race
  const { data: nextRace } = await supabase
    .from("races")
    .select("*")
    .gte("race_date", new Date().toISOString().split("T")[0])
    .order("race_date", { ascending: true })
    .limit(1)
    .single()

  // Get the group's invite code
  const { data: group } = await supabase
    .from("groups")
    .select("invite_code, name")
    .eq("id", session.groupId)
    .single()

  // Get all group players
  const { data: players } = await supabase
    .from("players")
    .select("id, name")
    .eq("group_id", session.groupId)

  // Get total scores for leaderboard preview
  const playerIds = players?.map((p) => p.id) || []
  const { data: scores } = await supabase
    .from("player_scores")
    .select("player_id, points")
    .in("player_id", playerIds)

  // Aggregate scores
  const leaderboard = (players || [])
    .map((p) => ({
      ...p,
      total: (scores || [])
        .filter((s) => s.player_id === p.id)
        .reduce((sum, s) => sum + s.points, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

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

  // Count completed races
  const { count: completedRaces } = await supabase
    .from("races")
    .select("id", { count: "exact", head: true })
    .eq("results_fetched", true)

  // Count player's total predictions
  const { count: playerPredictions } = await supabase
    .from("race_predictions")
    .select("id", { count: "exact", head: true })
    .eq("player_id", session.playerId)

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {session.playerName}. Here{"'"}s your season overview.
          </p>
        </div>
        <SyncButton variant="outline" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Races
            </span>
            <span className="font-mono text-2xl font-bold text-foreground">
              {completedRaces || 0}
              <span className="text-sm text-muted-foreground">/24</span>
            </span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Predictions
            </span>
            <span className="font-mono text-2xl font-bold text-foreground">
              {playerPredictions || 0}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your Points
            </span>
            <span className="font-mono text-2xl font-bold text-primary">
              {leaderboard.find((p) => p.id === session.playerId)?.total || 0}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Players
            </span>
            <span className="font-mono text-2xl font-bold text-foreground">
              {players?.length || 0}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next Race Card */}
        {nextRace && (
          <Card className="border-border bg-card lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Next Race
              </CardTitle>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-medium text-primary">
                R{nextRace.round}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {nextRace.race_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {nextRace.city}, {nextRace.country} &middot;{" "}
                  {new Date(nextRace.race_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Countdown targetDate={nextRace.qualifying_date || nextRace.race_date} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href={`/races/${nextRace.round}`}>
                    <Target className="mr-2 h-4 w-4" />
                    {hasPrediction ? "Edit Prediction" : "Make Prediction"}
                  </Link>
                </Button>
                <Button variant="secondary" asChild className="flex-1">
                  <Link href="/races">
                    View Calendar
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Preview */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Standings
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
              <Link href="/leaderboard">
                View All
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              {leaderboard.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No scores yet. Make predictions and sync results to see
                  standings.
                </p>
              )}
              {leaderboard.map((player, i) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between border-b border-border/50 py-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold ${
                        i === 0
                          ? "bg-primary/15 text-primary"
                          : i === 1
                            ? "bg-secondary text-secondary-foreground"
                            : i === 2
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        player.id === session.playerId
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {player.name}
                      {player.id === session.playerId && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {player.total}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      pts
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Code */}
      {group && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Invite friends to {group.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Share this code so they can join your prediction league
                </p>
              </div>
            </div>
            <InviteCodeDisplay code={group.invite_code} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
