import { clerkMiddleware } from '@clerk/nextjs/server'

// Minimal Clerk middleware - no protection, just session hydration for Clerk components
// Our app uses custom cookie sessions via getSession() for page protection
export default clerkMiddleware()

export const config = {
  matcher: [
    // Only run on auth-related routes where Clerk is actually needed
    '/login',
    '/join',
    '/auth/(.*)',
  ],
}
