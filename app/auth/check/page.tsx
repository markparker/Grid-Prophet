"use client"

import { useEffect, useState, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function AuthCheckPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [status, setStatus] = useState("Checking your account...")
  const hasChecked = useRef(false)

  useEffect(() => {
    async function checkAndRedirect() {
      // Prevent duplicate calls
      if (!isLoaded || hasChecked.current) return
      hasChecked.current = true
      
      if (!user) {
        router.replace("/login")
        return
      }

      const email = user.primaryEmailAddress?.emailAddress
      if (!email) {
        router.replace("/join")
        return
      }

      setStatus("Setting up your session...")

      try {
        // Call API to check user and set session
        const res = await fetch("/api/auth/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User",
            avatarUrl: user.imageUrl,
          }),
        })

        const data = await res.json()

        if (data.redirect === "dashboard") {
          router.replace("/dashboard")
        } else {
          router.replace("/join")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.replace("/join")
      }
    }

    checkAndRedirect()
  }, [isLoaded, user, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}
