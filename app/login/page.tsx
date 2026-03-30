'use client'

import { SignIn } from "@clerk/nextjs"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Grid Prophet</h1>
          <p className="text-muted-foreground">Sign in to start predicting F1 races</p>
        </div>
        <SignIn 
          routing="hash"
          forceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/join"
        />
      </div>
    </div>
  )
}
