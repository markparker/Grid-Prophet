---
title: "feat: Add live telemetry dashboard to WDC page"
type: feat
date: 2026-03-02
brainstorm: docs/brainstorms/2026-03-02-live-telemetry-brainstorm.md
---

# feat: Add Live Telemetry Dashboard to WDC Page

## Overview

Add a "Telemetry" tab to the `/wdc` page that lets users select a completed race and a driver, then view post-race data across three panels: **Sector Times & Lap Times**, **Tire Strategy**, and **Position & Intervals** — plus a **simplified Car Stats** readout. Data sourced from OpenF1 API (free tier, historical data). Designed for easy upgrade to live polling when paid tier is added.

Forza-inspired HUD aesthetic: translucent dark panels, monospace data readouts, team-colored accents, Recharts line graphs.

## Technical Approach

### Architecture

```
┌──────────────────────────────────────────────────┐
│  /wdc page (Server Component)                    │
│  Fetches: drivers, prediction, standings         │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  WdcPageTabs (Client Component)            │  │
│  │  ┌──────────┐  ┌────────────┐              │  │
│  │  │ Champion- │  │ Telemetry  │              │  │
│  │  │ ship Tab  │  │ Tab        │              │  │
│  │  └──────────┘  └────────────┘              │  │
│  │                                            │  │
│  │  Tab 1: Existing WdcPredictionForm         │  │
│  │  Tab 2: TelemetryDashboard (lazy-loaded)   │  │
│  │    ├── Race Selector (dropdown)            │  │
│  │    ├── Driver Selector (DriverBadge grid)  │  │
│  │    └── Data Panels (3 + stats readout)     │  │
│  │        ├── SectorTimesPanel                │  │
│  │        ├── TireStrategyPanel               │  │
│  │        ├── PositionPanel                   │  │
│  │        └── CarStatsReadout                 │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  /api/telemetry/* (API Routes — OpenF1 proxy)    │
│  ├── /api/telemetry/sessions   (session lookup)  │
│  ├── /api/telemetry/laps       (sector times)    │
│  ├── /api/telemetry/stints     (tire strategy)   │
│  ├── /api/telemetry/positions  (pos + intervals) │
│  └── /api/telemetry/car-stats  (per-lap summary) │
│                                                  │
│  Each route: session check → validate params →   │
│  check cache → fetch OpenF1 → cache → respond    │
└──────────────────────────────────────────────────┘
```

**Server/Client boundary:** The WDC page stays as a server component. It passes existing data (drivers, prediction, standings) to a new `WdcPageTabs` client component that wraps both the existing `WdcPredictionForm` and the new `TelemetryDashboard`. The telemetry dashboard is lazy-loaded via `next/dynamic` with `ssr: false` to avoid impacting initial page load.

**Data fetching:** All telemetry data fetched client-side via SWR from `/api/telemetry/*` proxy routes. SWR provides caching, deduplication, and a clean upgrade path to live polling (just add `refreshInterval`).

**Caching:** Server-side in-memory `Map` with TTL in the API routes. Historical data is immutable, so cached indefinitely (24-hour TTL as safety). Session key mappings cached permanently.

### Data Panels (Scoped for Historical)

**1. Sector Times & Lap Times** — `SectorTimesPanel`
- Table showing each lap: S1, S2, S3 splits, lap time, speed traps
- Color-coded: purple (personal best), green (session best), yellow (normal)
- Recharts line chart: lap time progression across the race (shows tire deg)
- Source: OpenF1 `/v1/laps`

**2. Tire Strategy** — `TireStrategyPanel`
- Horizontal stint timeline bar (like F1 TV post-race graphic)
- Each stint block: compound color (Red=Soft, Yellow=Medium, White=Hard), lap range, tire age
- Compound colors: `#FF3333` Soft, `#FFC300` Medium, `#FFFFFF` Hard, `#39B54A` Inter, `#0067FF` Wet
- Source: OpenF1 `/v1/stints`

**3. Position & Intervals** — `PositionPanel`
- Recharts line chart: position over laps (inverted Y-axis, P1 at top)
- Gap to leader and interval to car ahead shown as stats below chart
- Source: OpenF1 `/v1/position` + `/v1/intervals`

**4. Car Stats Readout** — `CarStatsReadout`
- HUD-style stats card (no heavy chart): top speed, avg speed, DRS activations, total laps, best lap time
- Derived from OpenF1 `/v1/car_data` (summary aggregation server-side, NOT raw 3.7Hz trace)
- Source: OpenF1 `/v1/car_data` → server aggregates to ~10 summary values per request

### Key Mappings

**Driver mapping:** Local `drivers.number` field → OpenF1 `driver_number`. These are the same values (FIA car numbers). Fetch `/v1/drivers?session_key={k}` once per session to verify and get OpenF1 metadata.

**Session mapping:** Query OpenF1 `/v1/sessions?year=2026&session_type=Race` to get all race session_keys. Map to local `races.round` by matching `country_name` + date proximity. Cache the full mapping on first call.

**Sprint weekends:** Default to "Race" session type. No session-type picker in v1.

### Rate Limit Strategy

Free tier: 3 req/s, 30 req/min.

- **Batch session lookup:** Fetch ALL 2026 race session_keys in one call, cache permanently. Cost: 1 request total.
- **Driver selection debounce:** 500ms debounce on driver selection before firing API calls.
- **Stagger panel requests:** Don't fire all 4 panel requests simultaneously. Queue with 350ms delay between each (stays under 3 req/s).
- **Server cache:** In-memory Map keyed by `{endpoint}:{session_key}:{driver_number}`. Historical data never changes → 24-hour TTL.
- **SWR client cache:** `dedupingInterval: 60000` prevents redundant requests for the same data.

### Empty & Error States

- **No completed races yet:** "No race telemetry available yet. Check back after the first race weekend."
- **Race completed but no OpenF1 data:** "Telemetry data for this race is not yet available. Data typically appears within a few hours of the session."
- **Driver didn't participate:** Filter driver selector to only show drivers from `race_results` table (if `results_fetched = true`). Fall back to all 22 if no local results.
- **Individual panel failure:** Show error per-panel, not full-page. "Unable to load sector times. Try again."
- **OpenF1 API down:** Panel-level errors with retry button.

## Implementation Phases

### Phase 1: API Layer & Data Mapping

Build the backend proxy routes and caching layer. This is the foundation everything else depends on.

**Files to create:**

- `lib/openf1.ts` — OpenF1 API client with typed responses
  - `fetchSessions(year: number, sessionType?: string)`
  - `fetchLaps(sessionKey: number, driverNumber: number)`
  - `fetchStints(sessionKey: number, driverNumber: number)`
  - `fetchPositions(sessionKey: number, driverNumber: number)`
  - `fetchIntervals(sessionKey: number, driverNumber: number)`
  - `fetchCarData(sessionKey: number, driverNumber: number)` (summary aggregation)
  - `fetchDrivers(sessionKey: number)`

- `lib/openf1-cache.ts` — In-memory cache with TTL
  - `get<T>(key: string): T | null`
  - `set<T>(key: string, value: T, ttlMs?: number): void`
  - Default TTL: 24 hours for data, indefinite for session mappings

- `app/api/telemetry/sessions/route.ts` — GET: returns session_key map for 2026 races
- `app/api/telemetry/laps/route.ts` — GET: `?session_key=X&driver_number=Y`
- `app/api/telemetry/stints/route.ts` — GET: `?session_key=X&driver_number=Y`
- `app/api/telemetry/positions/route.ts` — GET: `?session_key=X&driver_number=Y` (merges position + intervals)
- `app/api/telemetry/car-stats/route.ts` — GET: `?session_key=X&driver_number=Y` (returns summary stats)

**Validation pattern** (follow existing API route conventions):
```typescript
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sessionKey = Number(searchParams.get("session_key"))
  const driverNumber = Number(searchParams.get("driver_number"))

  if (!sessionKey || !driverNumber)
    return NextResponse.json({ error: "Missing session_key or driver_number" }, { status: 400 })

  // Check cache → fetch OpenF1 → cache → respond
}
```

**Testing approach:** Use 2024 or 2025 historical data during development (e.g., 2024 Belgian GP). Verify against known results.

### Phase 2: WDC Page Tab Structure

Restructure the WDC page to use tabs without breaking existing functionality.

**Files to modify:**

- `app/(app)/wdc/page.tsx` — Wrap existing content in a new `WdcPageTabs` component. Page remains a server component; passes all existing props through.

**Files to create:**

- `components/wdc-page-tabs.tsx` — Client component with two tabs:
  - "Championship" (default) — renders existing `WdcPredictionForm` with all current props
  - "Telemetry" — renders lazy-loaded `TelemetryDashboard`
  - Preserves tab state when switching (Radix `forceMount` or conditional rendering)

- `components/telemetry/telemetry-dashboard.tsx` — Main telemetry container (client, lazy-loaded via `next/dynamic`)
  - Race selector dropdown (defaults to latest completed race from local `races` data)
  - Driver selector (DriverBadge grid, filtered to race participants)
  - Renders 4 data panels when driver is selected
  - Manages SWR fetching with debounced driver selection

**Tab design:**
```
[Championship]  [Telemetry]
```
Championship is the default active tab. Telemetry tab content only initializes when first clicked (lazy load).

### Phase 3: Data Panels — Sector Times

**Files to create:**

- `components/telemetry/sector-times-panel.tsx`
  - Props: `laps` data array from SWR
  - Table: lap number, S1, S2, S3, lap time, speed traps (i1, i2, st)
  - Color coding: purple = personal best sector, green = overall best, yellow = normal
  - Recharts LineChart below table: lap time progression (X: lap number, Y: lap time in seconds)
  - HUD styling: translucent card, monospace numbers, team-color accent border

- `hooks/use-telemetry.ts` — Custom SWR hooks for each telemetry endpoint
  - `useLaps(sessionKey, driverNumber)`
  - `useStints(sessionKey, driverNumber)`
  - `usePositions(sessionKey, driverNumber)`
  - `useCarStats(sessionKey, driverNumber)`
  - Each hook: handles loading/error states, debouncing, SWR config

### Phase 4: Data Panels — Tire Strategy & Position

**Files to create:**

- `components/telemetry/tire-strategy-panel.tsx`
  - Horizontal bar timeline showing stint blocks
  - Each block: compound color fill, lap range label, tire age badge
  - Total pit stops count
  - HUD styling matching other panels

- `components/telemetry/position-panel.tsx`
  - Recharts LineChart: position over laps (inverted Y-axis, P1 at top)
  - Team-colored line
  - Below chart: key stats — starting position, finishing position, positions gained/lost, best gap to leader
  - HUD styling

### Phase 5: Car Stats Readout & Polish

**Files to create:**

- `components/telemetry/car-stats-readout.tsx`
  - HUD-style stats grid (no chart): top speed, avg speed, DRS activations count, total laps completed, best lap time, best sector times
  - Monospace numbers, team-color accents
  - Compact layout — this sits alongside or above the other panels

**Files to modify:**

- `app/globals.css` — Add telemetry-specific CSS custom properties:
  - `--telemetry-panel-bg` (translucent dark)
  - `--telemetry-glow` (subtle team-color glow for chart lines)
  - Compound colors as CSS variables

**Polish tasks:**
- Loading skeletons for each panel (use existing `components/ui/skeleton.tsx`)
- Mobile responsive layout: single column stack, charts full-width
- Empty state illustrations/messaging for each panel
- Debounce and stagger verification
- Rate limit error handling with user-friendly messaging

## Acceptance Criteria

### Functional Requirements

- [x] WDC page shows two tabs: "Championship" (default) and "Telemetry"
- [x] Existing WDC prediction/standings functionality unchanged
- [x] Race dropdown defaults to latest completed race, lists all completed races
- [x] Driver selector shows drivers who participated in the selected race (via DriverBadge)
- [x] Sector Times panel: lap-by-lap table with S1/S2/S3/total + speed traps, color-coded bests, lap time progression chart
- [x] Tire Strategy panel: horizontal stint timeline with compound colors, lap ranges, tire age
- [x] Position panel: position-over-laps chart (P1 at top), start/finish positions, positions gained
- [x] Car Stats readout: top speed, avg speed, DRS count, laps completed, best lap time
- [x] All data sourced from OpenF1 API via `/api/telemetry/*` proxy routes
- [x] Telemetry tab content lazy-loaded (no impact on initial page load)

### Error Handling

- [x] Pre-season: clear empty state message when no races are completed
- [x] Missing OpenF1 data: per-panel "data not available" messaging
- [x] API errors: per-panel error state with retry, not full-page error
- [x] Rate limiting: requests staggered to stay under 3 req/s, 30 req/min

### Non-Functional

- [x] Server-side caching for all OpenF1 responses (in-memory, 24h TTL)
- [x] Client-side SWR caching with deduplication
- [x] Session-key mapping cached permanently after first lookup
- [x] Driver selection debounced (500ms)
- [x] Mobile responsive: single-column layout, readable charts
- [x] Forza HUD aesthetic: translucent panels, monospace readouts, team-color accents

### Live Upgrade Path

- [x] Architecture supports adding `refreshInterval` to SWR hooks for live polling
- [x] No code changes needed beyond SWR config and OpenF1 tier upgrade

## Dependencies & Risks

**Dependencies:**
- OpenF1 API availability for 2026 season (verify with test call before implementation)
- OpenF1 free tier rate limits (3 req/s, 30 req/min)

**Risks:**
- OpenF1 may not have 2026 data immediately — mitigate by developing against 2024/2025 data
- Rate limits could be hit with concurrent users — mitigated by aggressive server-side caching
- Recharts performance with position chart data — mitigated by limiting to ~60 data points (1 per lap)

**Not in scope for v1:**
- Full car telemetry traces (speed/throttle/brake 3.7Hz graphs)
- Driver comparison mode
- Session type picker for sprint weekends (defaults to Race)
- URL state for tab/race/driver selection
- Live data (requires paid OpenF1 tier)

## References

- Brainstorm: `docs/brainstorms/2026-03-02-live-telemetry-brainstorm.md`
- OpenF1 API docs: https://openf1.org/docs
- Existing F1 API client: `lib/f1-api.ts`
- Existing Recharts usage: `components/points-chart.tsx`
- Existing Tabs component: `components/ui/tabs.tsx`
- DriverBadge + TEAM_META: `components/driver-badge.tsx`
- WDC page: `app/(app)/wdc/page.tsx`
- API route pattern: `app/api/predictions/wdc/route.ts`
