# Grid Prophet

F1 2026 prediction league app where users predict race results, pole positions, and the World Drivers' Championship with friends.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19, TypeScript 5.7
- **Styling**: Tailwind CSS 4, shadcn/ui (Radix primitives), Lucide icons
- **Backend**: Supabase (auth, Postgres database, SSR cookies via `@supabase/ssr`)
- **Data Fetching**: SWR for client-side, server components for initial loads
- **Charts**: Recharts
- **Deployment**: Vercel (with `@vercel/analytics`)
- **Package Manager**: pnpm

## Project Structure

```
app/                    # Next.js App Router pages + API routes
  api/                  # Route handlers (f1, groups, leagues, predictions, scores, session, telemetry)
  auth/                 # Auth callback
components/
  ui/                   # shadcn/ui primitives
  telemetry/            # Telemetry dashboard panels (sector times, position, tire strategy, car stats)
  *.tsx                 # Feature components (race cards, leaderboard, predictions, etc.)
hooks/                  # Client hooks (use-telemetry, use-toast, use-mobile)
lib/
  supabase/             # Supabase client (client.ts, server.ts, proxy.ts)
  openf1.ts             # OpenF1 API client + types
  openf1-cache.ts       # Server-side in-memory cache for OpenF1 data
  f1-api.ts             # F1 data API helpers
  scoring.ts            # Prediction scoring logic
  email.ts              # Resend email integration
docs/plans/             # Feature planning documents
```

## Conventions

- **Components**: Function components, named exports, `"use client"` directive only when needed
- **Imports**: Use `@/` path alias for all imports
- **Styling**: Tailwind utility classes, dark theme by default (`bg-background`, `text-foreground`), HUD-style aesthetic with translucent cards (`bg-card/50`, `border-border/30`)
- **Data fetching**: SWR hooks in `hooks/` for client-side; Supabase queries in server components/API routes
- **API routes**: Located at `app/api/[domain]/route.ts`
- **Types**: Colocated in the files that define them (e.g., OpenF1 types in `lib/openf1.ts`)

## Environment Variables

This is a shared GitHub repository. Environment variables are managed in **Vercel** (not committed to the repo). To run locally, create a `.env.local` file with the following:

```bash
# Supabase (required — app won't function without these)
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anonymous/public key

# Resend (required for email features; build fails without it)
RESEND_API_KEY=                  # Resend API key for transactional emails

# App URL (optional — defaults to https://gridprophets.com)
NEXT_PUBLIC_APP_URL=             # Override for local dev, e.g. http://localhost:3000
```

**For new contributors**: Ask the repo owner to either:
1. Share the values directly (DM or password manager), or
2. Run `vercel env pull .env.local` from the linked Vercel project and send you the resulting file

The Vercel CLI option is cleanest — the owner runs `vercel env pull` and sends the `.env.local` file, which already has all values populated for the development environment.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
```

## Key Patterns

- **Supabase auth**: Middleware in `middleware.ts` refreshes session cookies on every request via `lib/supabase/proxy.ts`
- **Telemetry**: OpenF1 API → server-side cache (`lib/openf1-cache.ts`, permanent TTL for immutable historical data) → proxy API routes (`app/api/telemetry/`) → SWR hooks → dashboard panels. Lives at `/telemetry` as its own nav tab.
- **Team colors**: Defined in `components/driver-badge.tsx` (`TEAM_META` map)

## Known Issues

- `next build` fails locally without `RESEND_API_KEY` env var (Resend client instantiates at module level in `lib/email.ts`)
- Pre-existing TypeScript strict-mode errors in `app/auth/callback/route.ts`, `lib/f1-api.ts`, `lib/supabase/` (implicit `any` types)
