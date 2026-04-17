import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Only run Clerk on auth-related routes and protected pages
// Skip for static assets, API routes that don't need auth, and public pages
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/join(.*)',
  '/auth/(.*)',
  '/api/webhooks/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // For public routes, don't require authentication
  if (isPublicRoute(req)) {
    return
  }
})

export const config = {
  matcher: [
    // Skip static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
