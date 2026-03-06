# Fix Outstanding Code Issues

## Context

The project had 17 TypeScript errors (all `implicit any` or `property does not exist`), a build-blocking issue with module-level Resend client instantiation, and `ignoreBuildErrors: true` in `next.config.mjs` masking type errors. Fixing these enabled removing the escape hatch and getting a clean `pnpm build`.

**Branch**: `fix/code-issues` (off `main`)

---

## Risk Category 1: LOW RISK — Type Annotations Only

No runtime behavior changes. Purely additive type information.

### Task 1A: Fix Supabase cookie `setAll` types (3 files, 14 TS errors)

Imported `CookieOptions` from `@supabase/ssr` and typed the `setAll` callback parameter.

| File | Change |
|------|--------|
| `lib/supabase/proxy.ts` | Added `CookieOptions` import, typed `setAll` parameter |
| `lib/supabase/server.ts` | Added `CookieOptions` import, typed `setAll` parameter |
| `app/auth/callback/route.ts` | Added `CookieOptions` import, typed `setAll` parameter, typed `cookiesToForward` array with `CookieOptions`, removed unnecessary `as Record<string, string>` cast |

**Fix pattern** (same in all 3 files):
```ts
import type { CookieOptions } from "@supabase/ssr"

setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
```

### Task 1B: Fix F1 API response types (`lib/f1-api.ts`, 3 TS errors)

Added a typed interface for the API response objects and used it in `.map()` calls replacing `Record<string, unknown>`:

```ts
interface F1ApiResponse {
  driverId?: string
  driver?: { driverId?: string }
  position?: number | string
  points?: number | string
  gridPosition?: number | string
}
```

---

## Risk Category 2: MEDIUM RISK — Runtime Behavior Changes

These change how/when code executes.

### Task 2A: Lazy-init Resend client (`lib/email.ts`)

**Problem**: `new Resend(process.env.RESEND_API_KEY)` at module scope crashed the build when the env var was missing.

**Fix**: Replaced with lazy getter so the client is only instantiated when `sendInviteCodeEmail` is actually called:
```ts
let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}
```

### Task 2B: Remove `ignoreBuildErrors` (`next.config.mjs`)

Deleted the `typescript: { ignoreBuildErrors: true }` block so type checking is enforced during builds.

---

## Files Modified

| File | Task | Risk |
|------|------|------|
| `lib/supabase/proxy.ts` | 1A | Low |
| `lib/supabase/server.ts` | 1A | Low |
| `app/auth/callback/route.ts` | 1A | Low |
| `lib/f1-api.ts` | 1B | Low |
| `lib/email.ts` | 2A | Medium |
| `next.config.mjs` | 2B | Medium |

## Verification

- `npx tsc --noEmit` — 0 errors
- `pnpm build` — succeeds without `RESEND_API_KEY`
