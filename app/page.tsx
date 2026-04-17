import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getSession } from "@/lib/session"
import { JoinForm } from "@/components/join-form"
import { Flag, Trophy, Users, TrendingUp, Target, Medal, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function LandingPage() {
  // Check cookie session first (fast) - if exists, go to dashboard
  // Only call Clerk auth() if no session (slower, needs external API)
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }
  
  // No session - check if signed in with Clerk but session not yet set
  const { userId } = await auth()
  if (userId) {
    redirect("/auth/check")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.15),transparent)]" />
        
        <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <Flag className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Grid Prophet</span>
            </div>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Sign In
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </nav>

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            {/* Left: Hero content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-xs font-mono font-medium tracking-wider text-primary">
                  2026 SEASON LIVE
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
                Predict. Compete.
                <span className="text-primary"> Dominate.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                Create a prediction league with friends and compete to see who knows F1 best. 
                Predict race results, pole positions, and the World Championship.
              </p>
              
              {/* Feature pills */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                <div className="flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">WDC Predictions</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2">
                  <TrendingUp className="h-4 w-4 text-chart-2" />
                  <span className="text-sm font-medium">Live Standings</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2">
                  <Users className="h-4 w-4 text-chart-3" />
                  <span className="text-sm font-medium">League Leaderboards</span>
                </div>
              </div>
            </div>

            {/* Right: Join Form */}
            <div id="join" className="w-full max-w-md flex-shrink-0">
              <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-card" />}>
                <JoinForm />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section with Mockups */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Everything you need to compete
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track your predictions, compare with friends, and watch your scores update in real-time as the season unfolds.
            </p>
          </div>

          {/* Feature Grid with Mockups */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Race Predictions Card */}
            <div className="group relative rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Flag className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Race Predictions</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Predict the top 10 finishers and pole position for every Grand Prix.
                </p>
              </div>
              {/* Mockup */}
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-background border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">Australian GP</span>
                    <span className="text-primary">R1</span>
                  </div>
                  {[
                    { pos: 1, name: "VER", team: "Red Bull", color: "#3671C6" },
                    { pos: 2, name: "NOR", team: "McLaren", color: "#FF8000" },
                    { pos: 3, name: "LEC", team: "Ferrari", color: "#E80020" },
                  ].map((driver) => (
                    <div key={driver.pos} className="flex items-center gap-2 py-1.5 px-2 rounded bg-secondary/50">
                      <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold bg-primary/20 text-primary">
                        {driver.pos}
                      </span>
                      <div className="h-3 w-1 rounded-full" style={{ backgroundColor: driver.color }} />
                      <span className="text-xs font-mono">{driver.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{driver.team}</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-muted-foreground text-center pt-1">+ 7 more positions</div>
                </div>
              </div>
            </div>

            {/* Live Standings Card */}
            <div className="group relative rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                    <TrendingUp className="h-5 w-5 text-chart-2" />
                  </div>
                  <h3 className="font-semibold text-lg">Live WDC Standings</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Compare your pre-season predictions with real-time championship standings.
                </p>
              </div>
              {/* Mockup */}
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-background border border-border p-3">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-muted-foreground">Your Prediction</span>
                    <span className="text-muted-foreground">Live</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Verstappen", pred: 1, live: 1, delta: 0 },
                      { name: "Norris", pred: 2, live: 3, delta: -1 },
                      { name: "Leclerc", pred: 3, live: 2, delta: 1 },
                    ].map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-muted-foreground">{d.pred}</span>
                        <span className="flex-1 font-medium">{d.name}</span>
                        <span className={`font-mono ${d.delta > 0 ? 'text-chart-2' : d.delta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {d.delta > 0 ? `+${d.delta}` : d.delta === 0 ? '-' : d.delta}
                        </span>
                        <span className="w-4 text-right text-muted-foreground">{d.live}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Card */}
            <div className="group relative rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                    <Medal className="h-5 w-5 text-chart-4" />
                  </div>
                  <h3 className="font-semibold text-lg">League Leaderboard</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Track your position against friends with detailed race-by-race scoring.
                </p>
              </div>
              {/* Mockup */}
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-background border border-border p-3">
                  <div className="space-y-2">
                    {[
                      { pos: 1, name: "Mark", pts: 156, avatar: "M" },
                      { pos: 2, name: "Sarah", pts: 142, avatar: "S" },
                      { pos: 3, name: "Alex", pts: 138, avatar: "A" },
                    ].map((p) => (
                      <div key={p.pos} className="flex items-center gap-2 py-1.5">
                        <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                          p.pos === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {p.pos}
                        </span>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                          {p.avatar}
                        </div>
                        <span className="flex-1 text-sm font-medium">{p.name}</span>
                        <span className="text-sm font-mono text-primary">{p.pts} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pole Predictions Card */}
            <div className="group relative rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/10">
                    <Target className="h-5 w-5 text-chart-5" />
                  </div>
                  <h3 className="font-semibold text-lg">Pole Position Bonus</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Predict who will take pole each weekend for bonus points.
                </p>
              </div>
              {/* Mockup */}
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-background border border-border p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1 rounded-full bg-[#3671C6]" />
                    <div>
                      <p className="text-sm font-medium">Max Verstappen</p>
                      <p className="text-[10px] text-muted-foreground">Red Bull Racing</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-chart-2 font-medium">+5 pts</p>
                      <p className="text-[10px] text-muted-foreground">Correct!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scoring Card */}
            <div className="group relative rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Smart Scoring</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Earn points for exact matches and close predictions.
                </p>
              </div>
              {/* Mockup */}
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-background border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Exact position</span>
                    <span className="font-mono text-chart-2">+3 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Off by one</span>
                    <span className="font-mono text-chart-4">+1 pt</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pole position</span>
                    <span className="font-mono text-chart-5">+5 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                    <span className="text-muted-foreground">Max per race</span>
                    <span className="font-mono text-primary font-bold">35 pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Season Stats Card */}
            <div className="group relative rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                    <Users className="h-5 w-5 text-chart-3" />
                  </div>
                  <h3 className="font-semibold text-lg">Season Dashboard</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  View your stats, accuracy, and performance over the season.
                </p>
              </div>
              {/* Mockup */}
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-background border border-border p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 rounded bg-secondary/50">
                      <p className="text-lg font-bold text-primary">156</p>
                      <p className="text-[10px] text-muted-foreground">Total Points</p>
                    </div>
                    <div className="text-center p-2 rounded bg-secondary/50">
                      <p className="text-lg font-bold">#1</p>
                      <p className="text-[10px] text-muted-foreground">League Rank</p>
                    </div>
                    <div className="text-center p-2 rounded bg-secondary/50">
                      <p className="text-lg font-bold">12</p>
                      <p className="text-[10px] text-muted-foreground">Exact Picks</p>
                    </div>
                    <div className="text-center p-2 rounded bg-secondary/50">
                      <p className="text-lg font-bold">3</p>
                      <p className="text-[10px] text-muted-foreground">Pole Correct</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to prove you know F1?
          </h2>
          <p className="text-muted-foreground mb-8">
            Create your league in seconds and invite your friends to compete all season long.
          </p>
          <Link
            href="#join"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get Started
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flag className="h-4 w-4" />
            <span className="text-sm">Grid Prophet</span>
          </div>
          <p className="text-xs text-muted-foreground">
            2026 Season. Not affiliated with Formula 1.
          </p>
        </div>
      </footer>
    </div>
  )
}
