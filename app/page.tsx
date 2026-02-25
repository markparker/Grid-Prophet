import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { JoinForm } from "@/components/join-form"

export default async function LandingPage() {
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5">
            <span className="text-xs font-mono font-medium tracking-wider text-primary">
              2026 SEASON
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-balance">
            Grid Prophet
          </h1>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Predict F1 race results, pole positions, and the World
            Championship with your friends.
          </p>
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-card" />}>
          <JoinForm />
        </Suspense>
      </div>
    </div>
  )
}
