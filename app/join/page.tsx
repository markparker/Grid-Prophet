'use client'

import { useAuth } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { JoinForm } from "@/components/join-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function JoinPage() {
  const { isSignedIn, isLoaded } = useAuth()

  // Redirect to login if not authenticated
  if (isLoaded && !isSignedIn) {
    redirect("/login")
  }

  // Show loading state while checking auth
  if (!isLoaded) {
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Grid Prophet</h1>
          <p className="text-muted-foreground">Create or join a prediction league</p>
        </div>
        <JoinForm />
      </div>
    </div>
  )
}
