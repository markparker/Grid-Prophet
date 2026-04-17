'use client'

import { useState, useEffect, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { JoinForm } from "@/components/join-form"
import { Onboarding } from "@/components/onboarding"
import { Card, CardContent } from "@/components/ui/card"

export default function JoinPage() {
  const { user, isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)

  // Check onboarding status only once when loaded
  const shouldShowOnboarding = useMemo(() => {
    if (typeof window === 'undefined') return null
    return !localStorage.getItem("gp_onboarding_dismissed")
  }, [])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login")
      return
    }
    
    if (isLoaded && isSignedIn && showOnboarding === null) {
      setShowOnboarding(shouldShowOnboarding ?? false)
    }
  }, [isLoaded, isSignedIn, router, showOnboarding, shouldShowOnboarding])

  // Show loading state while checking auth
  if (!isLoaded || showOnboarding === null) {
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
  
  // Prevent render while redirecting
  if (!isSignedIn) {
    return null
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
