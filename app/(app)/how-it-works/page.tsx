"use client"

import {
  Flag,
  Trophy,
  Medal,
  Star,
  Lock,
  CheckCircle,
  ChevronRight,
  Users,
  BarChart3,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const steps = [
  {
    number: "01",
    title: "Join or create a league",
    description:
      "Create a prediction league and share the invite code with your friends. Everyone joins with the same invite code — no separate signups required. You can join multiple leagues at once.",
    icon: Users,
  },
  {
    number: "02",
    title: "Predict each race",
    description:
      "Before each race weekend, submit your predictions for pole position and the top 10 finishing order. Predictions lock automatically when qualifying begins, so you have to be ahead of the race.",
    icon: Flag,
  },
  {
    number: "03",
    title: "Earn points",
    description:
      "Points are awarded automatically after real results are fetched from the F1 API. The more accurate your predictions, the more points you score. See the scoring breakdown below for the full details.",
    icon: Star,
  },
  {
    number: "04",
    title: "Track the leaderboard",
    description:
      "Your league leaderboard updates after every race. See how you stack up across all 24 races of the 2026 season, with a points progression chart showing how the standings evolved race by race.",
    icon: BarChart3,
  },
]

const raceScoring = [
  {
    scenario: "Exact position",
    example: "You predict P3, driver finishes P3",
    points: 3,
    color: "text-f1-green",
    badge: "bg-f1-green/10 text-f1-green border-f1-green/20",
  },
  {
    scenario: "Off by 1 position",
    example: "You predict P3, driver finishes P2 or P4",
    points: 1,
    color: "text-f1-yellow",
    badge: "bg-f1-yellow/10 text-f1-yellow border-f1-yellow/20",
  },
  {
    scenario: "Off by 2+ positions",
    example: "You predict P3, driver finishes P6",
    points: 0,
    color: "text-muted-foreground",
    badge: "bg-muted/40 text-muted-foreground border-border",
  },
  {
    scenario: "Driver not in top 10",
    example: "Your predicted driver finishes P11 or lower",
    points: 0,
    color: "text-muted-foreground",
    badge: "bg-muted/40 text-muted-foreground border-border",
  },
]

const bonusScoring = [
  {
    title: "Pole position",
    description: "Correctly predict the driver who sets the fastest qualifying lap.",
    points: 5,
    icon: Flag,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Race winner",
    description: "Getting P1 exactly right awards the standard 3 points plus an extra bonus.",
    points: "3",
    icon: Trophy,
    color: "text-f1-yellow",
    bg: "bg-f1-yellow/10",
  },
  {
    title: "WDC prediction",
    description: "Pre-season world championship prediction — scored at season end using the same exact/close system across all 22 drivers.",
    points: "Up to 66",
    icon: Medal,
    color: "text-f1-green",
    bg: "bg-f1-green/10",
  },
]

const lockRules = [
  {
    icon: Lock,
    title: "Race predictions lock at qualifying",
    description:
      "Each race prediction window closes when qualifying begins for that race weekend. You cannot edit or submit predictions after that point.",
  },
  {
    icon: Clock,
    title: "WDC predictions lock at the first race",
    description:
      "Your pre-season World Drivers Championship prediction must be submitted before Australian GP qualifying begins on 7 March 2026. Once locked, it is read-only for the rest of the season.",
  },
  {
    icon: CheckCircle,
    title: "Results are synced automatically",
    description:
      "Race and qualifying results are fetched from the F1 API after each event. Scores are recalculated and the leaderboard updates within minutes of the chequered flag.",
  },
]

function PointsBadge({ points }: { points: number | string }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
      {typeof points === "number" ? `+${points}` : points}
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-14 px-4 py-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5">
          <span className="font-mono text-xs font-medium tracking-wider text-primary">
            GUIDE
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">How Grid Prophet Works</h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          Grid Prophet is a prediction league for the 2026 Formula 1 season. Compete with your
          friends by predicting race results, pole positions, and the World Drivers Championship.
          Here is everything you need to know.
        </p>
      </div>

      {/* Steps */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Getting started</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <Card key={step.number} className="relative overflow-hidden">
                <div className="absolute right-4 top-3 font-mono text-4xl font-bold text-border select-none">
                  {step.number}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </span>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Race Prediction Scoring */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Race finishing order — scoring</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You predict the top 10 finishing positions for every race. Points are awarded per driver
            based on how close your prediction was.
          </p>
        </div>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {raceScoring.map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{row.scenario}</span>
                  <span className="text-xs text-muted-foreground">{row.example}</span>
                </div>
                <Badge variant="outline" className={row.badge}>
                  {row.points === 0 ? "0 pts" : `+${row.points} pts`}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Maximum score per race from finishing order predictions: <strong className="text-foreground">30 points</strong> (all 10 positions exact).
        </p>
      </section>

      {/* Bonus Points */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Bonus predictions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Additional prediction categories that can earn you extra points each race weekend and
            across the full season.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {bonusScoring.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <PointsBadge points={item.points} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Max points table */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Maximum points per race weekend</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">Max per race</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">Over 24 races</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-5 py-3 font-medium">Finishing order (P1–P10)</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">30 pts</td>
                  <td className="px-5 py-3 text-right font-medium text-primary">720 pts</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium">Pole position</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">5 pts</td>
                  <td className="px-5 py-3 text-right font-medium text-primary">120 pts</td>
                </tr>
                <tr className="bg-secondary/20">
                  <td className="px-5 py-3 font-semibold">Total (excl. WDC)</td>
                  <td className="px-5 py-3 text-right font-semibold">35 pts</td>
                  <td className="px-5 py-3 text-right font-bold text-primary">840 pts</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-muted-foreground">WDC prediction (season end)</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">—</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">Up to 66 pts</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Lock rules */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Prediction windows and locking</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Predictions are time-limited. Miss the window and your entry is locked in — or left blank.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {lockRules.map((rule) => {
            const Icon = rule.icon
            return (
              <div key={rule.title} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{rule.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tips */}
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Star className="h-4 w-4 text-primary" />
          Tips for a high score
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Pole position is worth 5 points — a correct pole guess alone can swing a leaderboard race.",
            "Getting P1 exactly right is the highest-value single prediction at 3 points from finishing order.",
            "Off-by-one predictions (1 point) add up fast — a near-perfect top 10 still scores 10 points.",
            "Submit your WDC prediction early — it locks before the first Australian GP qualifying session.",
            "Check recent form and practice pace before submitting your race top 10.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {tip}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
