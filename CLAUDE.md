# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Grid Prophet

F1 2026 prediction league app where users predict race results, pole positions, and the World Drivers' Championship with friends.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19, TypeScript 5.7
- **Styling**: Tailwind CSS 4, shadcn/ui (Radix primitives), Lucide icons
- **Backend**: Supabase (Postgres database, SSR cookies via `@supabase/ssr`)
- **Auth**: Clerk (`@clerk/nextjs`) for OAuth (Google), with custom session cookie fallback
- **Data Fetching**: SWR for client-side, server components for initial loads
- **Charts**: Recharts
- **Deployment**: Vercel (with `@vercel/analytics`)
- **Package Manager**: pnpm

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm test         # Run tests (Vitest)
pnpm test:watch   # Run tests in watch mode
```

Tests live in `__tests__/`. The framework is Vitest with the `@/` alias wired up in `vitest.config.ts`. Only pure utility modules are tested (`lib/scoring.ts`, `lib/openf1-cache.ts`) — API routes and server components depend on Supabase/Next.js internals and are not tested.

## Environment Variables

Environment variables are managed in **Vercel** (not committed to the repo). To run locally, create a `.env.local` file:

```bash
# Supabase (required — app won't function without these)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Resend (required for email features; build fails without it)
RESEND_API_KEY=

# App URL (optional — defaults to https://gridprophets.com)
NEXT_PUBLIC_APP_URL=
```

Run `vercel env pull .env.local` from the linked Vercel project to get all values populated.

## Architecture

### Authentication & Session

Two-layer auth system:
1. **Clerk** handles OAuth (Google sign-in) via `@clerk/nextjs`. Webhook events arrive at `POST /api/webhooks/clerk` and are verified with Svix.
2. **Custom session cookie** (`f1_league_session`, httpOnly, 1-year max-age) stores `{ playerId, groupId, playerName, groupName, avatarUrl, email, googleLinked, isAdmin }`. Helper is in `lib/session.ts`. Backwards-compatible with legacy `f1_session` cookie.

Middleware in `middleware.ts` refreshes Supabase session cookies on every request via `lib/supabase/proxy.ts`.

### Database Schema

All tables have RLS disabled — access control relies on invite codes. Migration files are in `scripts/`.

Key tables:
- **groups** — friend groups with unique invite codes
- **players** — league participants (FK: groups); `google_id` field enables multi-league support
- **drivers** / **races** — seeded 2026 F1 grid and calendar data
- **race_results** / **qualifying_results** — actual results populated via `/api/f1/sync`
- **race_predictions** + **race_prediction_positions** — player predictions per race
- **wdc_predictions** + **wdc_prediction_positions** — season-long WDC predictions
- **player_scores** — score ledger with breakdown JSONB; unique on `(player_id, race_id, score_type)`

### Scoring Logic (`lib/scoring.ts`)

- **Race**: 3 pts exact position, 1 pt if ±1 position; DNF drivers excluded from scoring
- **Pole**: 5 pts if correct, 0 otherwise
- **WDC**: Same 3/1/0 rule as race, all drivers included (no DNF exclusion)
- Score breakdown stored as JSONB in `player_scores` for audit trail

### F1 Data Flow

Two separate data sources:
1. **Official results** — `lib/f1-api.ts` fetches from `https://f1api.dev/api` with 1-hour ISR cache. `/api/f1/sync` triggers a full sync: populates `race_results` + `qualifying_results`, then auto-scores all predictions.
2. **Telemetry** — `lib/openf1.ts` fetches from `https://api.openf1.org/v1`. Proxied through `app/api/telemetry/` routes with server-side in-memory cache (`lib/openf1-cache.ts`). Permanent TTL for immutable historical race data; temporary TTL for live/upcoming sessions. SWR hooks consume telemetry with a 5-minute dedup interval.

Admin can reprocess all scores via `POST /api/admin/reprocess` after results are updated.

### Multi-League Support

Users link groups via `google_id` on the players table. `GET /api/leagues` returns all groups for a given `google_id`. A league switcher component allows toggling between groups within a session.

### Conventions

- **Components**: Function components, named exports, `"use client"` directive only when needed
- **Imports**: `@/` path alias for all imports
- **Styling**: Tailwind utility classes, dark theme by default (`bg-background`, `text-foreground`), HUD-style aesthetic with translucent cards (`bg-card/50`, `border-border/30`)
- **API routes**: `app/api/[domain]/route.ts`; return `NextResponse.json({ error })` or `NextResponse.json({ data })`
- **Types**: Colocated in the files that define them (e.g., OpenF1 types in `lib/openf1.ts`)
- **Team colors**: Defined in `components/driver-badge.tsx` (`TEAM_META` map)

## Known Issues

- `next build` fails locally without `RESEND_API_KEY` env var (Resend client instantiates at module level in `lib/email.ts`)
- Pre-existing TypeScript strict-mode errors in `app/auth/callback/route.ts`, `lib/f1-api.ts`, `lib/supabase/` (implicit `any` types)
