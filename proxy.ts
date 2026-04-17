import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Only authenticate on auth routes - app pages use session cookie
const isAuthRoute = createRouteMatcher([
  '/login',
  '/auth/check',
  '/join',
])

export default clerkMiddleware(async (auth, req) => {
  // Only call auth() for actual auth routes
  // App pages rely on session cookie in getSession()
  if (isAuthRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
