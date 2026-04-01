"use client"

import { useState } from "react"
import { useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  Flag, 
  Trophy, 
  Users, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft,
  LogOut,
  Target,
  Medal
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingProps {
  userName: string
  onComplete: () => void
}

const steps = [
  {
    title: "Welcome to Grid Prophets",
    description: "Your F1 prediction league awaits. Let us show you around.",
    icon: Flag,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Grid Prophets is the ultimate F1 prediction game where you compete with friends to predict race results and championship standings.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Predict</p>
                <p className="text-xs text-muted-foreground">Race results</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Medal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Compete</p>
                <p className="text-xs text-muted-foreground">With friends</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    title: "Race Predictions",
    description: "Predict the top 10 finishers before each race.",
    icon: Flag,
    content: (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Flag className="h-5 w-5 text-primary" />
            <span className="font-medium">How it works</span>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">1</span>
              <span>Drag and drop drivers into your predicted finishing order</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">2</span>
              <span>Lock in your predictions before qualifying starts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">3</span>
              <span>Earn points based on how close your predictions are</span>
            </li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Perfect prediction = 25 points per driver position
        </p>
      </div>
    ),
  },
  {
    title: "Championship Predictions",
    description: "Predict the full WDC standings for bonus points.",
    icon: Trophy,
    content: (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-medium">WDC Predictions</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            At the start of the season, predict the final World Drivers&apos; Championship standings.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Track your predictions against live standings</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Bonus points awarded at the end of the season
        </p>
      </div>
    ),
  },
  {
    title: "Leaderboard & Scoring",
    description: "Compete with your league and climb the standings.",
    icon: Users,
    content: (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">League Competition</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-500">1</span>
                <span className="text-sm">Top Prophet</span>
              </div>
              <span className="text-sm font-mono text-primary">250 pts</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-gray-500/20 flex items-center justify-center text-xs font-bold text-gray-400">2</span>
                <span className="text-sm">Runner Up</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">230 pts</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-amber-700/20 flex items-center justify-center text-xs font-bold text-amber-600">3</span>
                <span className="text-sm">Third Place</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">210 pts</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Ready to Start?",
    description: "Join or create a league to begin predicting.",
    icon: TrendingUp,
    content: (
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            To start making predictions, you need to be part of a league.
          </p>
          <p className="font-medium text-primary">
            Create your own or join an existing one!
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Join League</p>
              <p className="text-xs text-muted-foreground">Use an invite code</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Create League</p>
              <p className="text-xs text-muted-foreground">Invite your friends</p>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
]

export function Onboarding({ userName, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showAgain, setShowAgain] = useState(true)
  const { signOut } = useClerk()

  const step = steps[currentStep]
  const Icon = step.icon
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  async function handleComplete() {
    // Store preference in localStorage
    if (!showAgain) {
      localStorage.setItem("gp_onboarding_dismissed", "true")
    }
    onComplete()
  }

  async function handleSignOut() {
    await fetch("/api/session", { method: "DELETE" })
    await signOut({ redirectUrl: "/" })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg">
        {/* Header with sign out */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Welcome, <span className="text-foreground font-medium">{userName}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentStep 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Main card */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            {/* Step header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">{step.title}</h2>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>

            {/* Step content */}
            <div className="mb-6">
              {step.content}
            </div>

            {/* Show again checkbox (only on last step) */}
            {isLastStep && (
              <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-muted/50">
                <Checkbox
                  id="show-again"
                  checked={showAgain}
                  onCheckedChange={(checked) => setShowAgain(checked as boolean)}
                />
                <Label 
                  htmlFor="show-again" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Show this guide next time I sign in
                </Label>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isFirstStep}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {!isLastStep && (
                <Button
                  variant="ghost"
                  onClick={handleComplete}
                  className="text-muted-foreground"
                >
                  Skip Tour
                </Button>
              )}

              {isLastStep ? (
                <Button onClick={handleComplete} className="gap-2">
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setCurrentStep(currentStep + 1)} className="gap-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step counter */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  )
}
