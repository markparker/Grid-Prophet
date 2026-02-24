import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { JoinForm } from "@/components/join-form"
import { Flag } from "lucide-react"

export default async function LandingPage() {
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background grid lines for racing feel */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" aria-hidden="true">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Flag className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-balance font-mono text-3xl font-bold tracking-tight text-foreground">
              Grid Predict
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              Compete with friends to predict the 2026 F1 season. Call the race
              winners, nail pole position, and crown the World Champion.
            </p>
          </div>
        </div>

        {/* Join/Create Form */}
        <JoinForm />

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          F1 2026 season data powered by{" "}
          <a
            href="https://f1api.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 underline-offset-4 hover:underline"
          >
            f1api.dev
          </a>
        </p>
      </div>
    </div>
  )
}
