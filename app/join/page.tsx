'use client'

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { JoinForm } from "@/components/join-form"
import { Onboarding } from "@/components/onboarding"
import { Card, CardContent } from "@/components/ui/card"

export default function JoinPage() {
  const { user, isSignedIn, isLoaded } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Check if user has dismissed onboarding before
      const dismissed = localStorage.getItem("gp_onboarding_dismissed")
      if (!dismissed) {
        setShowOnboarding(true)
      }
      setCheckingOnboarding(false)
    }
  }, [isLoaded, isSignedIn])

  // Redirect to login if not authenticated
  if (isLoaded && !isSignedIn) {
    redirect("/login")
  }

  // Show loading state while checking auth or onboarding status
  if (!isLoaded || checkingOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show onboarding for first-time users
  if (showOnboarding && user) {
    return (
      <Onboarding
        userName={user.firstName || user.username || "there"}
        onComplete={() => setShowOnboarding(false)}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Grid Prophets</h1>
          <p className="text-muted-foreground">Create or join a prediction league</p>
        </div>
        <JoinForm onShowTour={() => setShowOnboarding(true)} />
      </div>
    </div>
  )
}
