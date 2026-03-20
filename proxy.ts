import { type NextRequest, NextResponse } from 'next/server'

/**
 * Proxy function for Next.js 16
 * Handles session validation and routing for the Grid Prophet app.
 * Uses custom session management (not Supabase Auth).
 */
export async function proxy(request: NextRequest) {
  // Pass through all requests - session is managed via cookies
  // and validated in API routes using getSession()
  return NextResponse.next({
    request,
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
