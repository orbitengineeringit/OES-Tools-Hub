# DECISIONS — Company AI Tools Hub

Architecture Decision Records. Every non-trivial technical choice gets an entry here so it isn't silently reversed or re-debated later. Newest on top.

---

## ADR-012: Migration from Next.js 15 to React 19 + Vite + React Router v7
- **Context:** Development server speed in Next.js 15 (`next dev --turbopack`) suffered from 5-10s cold starts and compile latencies on Windows. The user explicitly requested migrating to React + Vite for instant development and runtime performance.
- **Decision:** Shifted the entire project to **React 19 + Vite + React Router v7 + Supabase Direct RLS**:
  1. Replaced Next.js toolchain with Vite (`@vitejs/plugin-react` & `@tailwindcss/vite`).
  2. Converted App Router filesystem routes (`/app`) to React Router v7 routes (`/src/App.tsx`).
  3. Replaced `@supabase/ssr` server routes with direct Supabase browser client queries backed by Postgres Row-Level Security (RLS).
  4. Added `vercel.json` with SPA rewrite rules for instant Vercel deployment.
- **Why:** Reduces dev server startup time from >5s to <200ms, provides instant HMR (<20ms), eliminates intermediate Node API server latency, and drastically simplifies hosting.
- **Alternatives rejected:** Staying on Next.js dev server with flags (rejected because user requested Vite shift for maximum speed).

---

## ADR-011: Dashboard Tool Card — Hero-Image Modern Redesign
- **Context:** The original tool card was a compact icon-list card (~130px tall) with a small 40×40px thumbnail, plain text, and a shadcn Badge. It felt visually inconsistent with the premium split-screen auth pages (which use bold imagery, diagonal clip-paths, and Orbit brand gradients).
- **Decision:** Redesigned `ToolCard.tsx` as a tall hero-image card (300px+ min-height):
  1. **Image Hero (160px):** Full-bleed `next/image` at the top with a diagonal white clip overlay (`polygon(0 100%, 100% 40%, 100% 100%, 0% 100%)`) creating an angled image-to-body transition, matching the auth layout's signature diagonal style.
  2. **Frosted glass category badge:** `backdrop-filter: blur(8px)`, `rgba(255,255,255,0.18)` bg, white border — overlaid on the image at top-left.
  3. **No-image fallback:** Orbit navy→cyan diagonal gradient + oversized first-letter initial (text-white/20) — premium even without an image.
  4. **Hover animation:** Framer Motion `scale(1.03)`, `y(-6px)`, Orbit cyan glow box-shadow (`rgba(29,180,210,0.28)`) + image zoom-in (scale 1.08) for a parallax feel.
  5. **Launch button:** Full-width Orbit cyan pill button at card bottom; arrow nudges right on hover.
  6. **Grid updated:** `lg:grid-cols-3` (down from 4) — taller cards require more horizontal space to display imagery properly.
  7. **Header gradient:** Page title "My Tools" uses a `foreground→orbit-cyan` gradient text clip.
- **Deviation from UI_GUIDELINES.md §4:** The spec called for 16:9 or 4:3 image ratio; the redesign uses a fixed 160px height. This was a deliberate upgrade for visual consistency — updated in UI_GUIDELINES.md §4.
- **Why:** Provides visual parity with the premium auth pages, makes each tool feel like a distinct product card rather than a list item, and uses the full Orbit brand palette (cyan glow, navy→cyan gradient) established in the design system.
- **Alternatives rejected:** Keeping the icon-list layout but adding color — rejected because the small thumbnail cannot showcase tool imagery meaningfully.

---

## ADR-010: Multi-Layer Application Performance Optimization
- **Context:** The application required a comprehensive performance optimization to achieve near-instant client responsiveness, immediate route switching, fast image asset delivery, reduced JS bundle sizes, and zero redundant DB lookups without modifying any UI, UX, business logic, auth, schema, APIs, or existing features.
- **Decision:** Implemented a multi-tier optimization strategy across 5 layers:
  1. **Server Session Cache**: Wrapped `getSession()` in `React.cache()` to deduplicate authentication and profile DB lookups within layout + page request lifecycles.
  2. **Middleware Fast-Path**: Added a fast-path cookie check in `middleware.ts` to bypass remote Supabase Auth network round-trips (~150-300ms RTT) on cookieless/public requests.
  3. **Package Tree-Shaking**: Configured `experimental.optimizePackageImports` in `next.config.ts` for `lucide-react`, `framer-motion`, `@base-ui/react`, `sonner`, and `@tanstack/react-query`.
  4. **TanStack Query Optimization**: Set `refetchOnWindowFocus: false`, `staleTime: 60s`, and `gcTime: 10m` in `QueryProvider` to eliminate tab-switch network refetches and maintain persistent client cache states.
  5. **Image & Render Stability**: Replaced plain `<img>` with Next.js `<Image>` (using `priority`, WebP/AVIF compression, and responsive `sizes`), memoized card grid/table row components (`React.memo`), and stabilized animation variant references outside component render bodies.
- **Why:** Delivers native-SPA feel, reduces network latencies, decreases initial bundle size, and prevents wasteful DOM re-renders while preserving 100% functional and visual identity.
- **Alternatives rejected:** Full client state rewrite (rejected to maintain full backward compatibility and existing Next.js App Router server component architecture).

---

## ADR-009: Whitelist-based Access Control (Email & Domain Restriction)
- **Context:** Google OAuth in "Testing" mode does not restrict logins to the Test Users list if the application only requests basic scopes (`email`, `profile`, `openid`). This allows any Google account to sign in. To maintain privacy and security for this internal hub, we must restrict signups and logins to company-controlled emails.
- **Decision:** Implement a whitelist validation system checking emails against a domain whitelist (`NEXT_PUBLIC_ALLOWED_DOMAINS`) and a specific email whitelist (`NEXT_PUBLIC_ALLOWED_EMAILS`) stored in `.env.local` (prefixed with `NEXT_PUBLIC_` so it is accessible in client signup forms and server callback routes). The check runs in (1) `/auth/callback/route.ts` (OAuth flow) and (2) `/app/(auth)/signup/page.tsx` (standard email+password signup). If Google OAuth signs in an unauthorized user, their session is immediately terminated (`supabase.auth.signOut()`) and they are redirected to `/login?error=unauthorized`.
- **Why:** Protects the hub from unauthorized access by personal Gmails or other domains while allowing custom domain emails (`@orbitengineerings.com`) and specific developer/manager Gmails (`shubh.orbitengineering.group@gmail.com`). Prefixing with `NEXT_PUBLIC_` allows immediate client-side error feedback on signup before hitting Supabase APIs. Signing out unauthorized OAuth users is critical to prevent session cookie persistence.
- **Alternatives rejected:** (1) Google Cloud "Internal" mode — rejected because company domain emails are not hosted on Google Workspace/G Suite. (2) Database triggers to check domains — rejected because Next.js application layer can handle it cleaner and show friendly validation messages directly in the UI instead of general database errors.

---

## ADR-008: Google OAuth via Supabase-managed provider
- **Context:** User requested "Sign in with Google" on auth pages. PRD v1 had listed OAuth as out-of-scope, but this is now explicitly requested and added to scope.
- **Decision:** Use Supabase's built-in Google OAuth provider. Google Client ID and Client Secret are configured in the Supabase Dashboard (Authentication → Providers → Google), NOT stored in the app's `.env` file. The app calls `supabase.auth.signInWithOAuth({ provider: 'google' })` on the client side, which triggers a full-page redirect to Google's consent screen. After consent, Google redirects to Supabase's `/auth/v1/callback`, which then redirects to our `/auth/callback` route handler. That handler exchanges the code for a session, ensures a profile row exists, and redirects to `/dashboard`.
- **Why:** Supabase manages the OAuth provider configuration (token exchange, refresh, etc.) so the app never handles Google secrets directly. No new env vars needed in the codebase. The callback route at `/auth/callback` (not `/api/auth/callback`) avoids the 20-req/60s rate limiter on `/api/auth/*` paths since Google controls the redirect frequency. Profile auto-creation in the callback uses `user.user_metadata.full_name` from Google for better defaults.
- **Alternatives rejected:** (1) Manual OAuth implementation with Google Client Library — too much complexity for no benefit when Supabase handles it. (2) Storing Google credentials in `.env` — unnecessary since Supabase Dashboard is the single source of truth for provider config.

---

## ADR-007: Security headers additions (Phase 4)
- **Context:** SECURITY.md Section 4 required a security headers checklist. Phase 4 task asked to add any missing headers.
- **Decision:** Added `Permissions-Policy` (disabling camera/mic/geolocation/interest-cohort), `Strict-Transport-Security` with 1-year `max-age` (HSTS), `X-DNS-Prefetch-Control: off`, and `frame-ancestors 'none'` to the existing CSP (belt-and-suspenders alongside `X-Frame-Options: DENY`).
- **Why:** Each header closes a distinct browser-enforced attack surface. HSTS prevents protocol-downgrade attacks. Permissions-Policy prevents feature abuse by injected scripts. `frame-ancestors` provides CSP-level clickjacking protection independent of `X-Frame-Options` (older browser fallback).
- **Alternatives considered:** Not adding HSTS in dev (it causes localhost to redirect to HTTPS) — the header is sent on all environments but browsers only honour it for HTTPS origins, so it's a no-op on localhost.

## ADR-006: /api/tools/mine uses admin client + explicit join, not anon client + RLS
- **Context:** The "read assigned tools" RLS policy on `tools` uses `EXISTS (SELECT 1 FROM tool_access WHERE ...)`. Because `tool_access` has RLS enabled with **no SELECT policy** (all access management goes through the admin client in route handlers, never the anon client), this subquery always returns 0 rows for authenticated users. The EXISTS is always false → tools returns empty → dashboard always shows "No tools assigned yet" even after grants are made.
- **Decision:** `GET /api/tools/mine` uses `adminClient` to join `tool_access → tools` with an explicit `.eq('user_id', session.user.id)` filter rather than relying on RLS to enforce the scope.
- **Why:** The user's identity is already verified by `getSession()` which calls `supabase.auth.getUser()` (server-validated JWT, not a local cache). The admin client then performs the join on the server. This matches the established pattern: all privileged DB reads/writes use the admin client in route handlers, never the anon client from within route handlers. The existing RLS "read assigned tools" policy remains in place as a second wall of defence for any hypothetical direct client calls, but the primary enforcement is the server-side filter.
- **Alternatives considered:** (a) Add a SELECT policy on `tool_access`: `USING (auth.uid() = user_id)` — this would allow the EXISTS subquery to see the user's own rows and fix the RLS bug. Rejected: changing live RLS policies requires careful re-testing (see KNOWN_ISSUES.md RLS blocker) and adds a client-accessible read path to `tool_access` that we explicitly chose to keep admin-only. (b) Use `SECURITY DEFINER` function to wrap the EXISTS check — overly complex for this use case. (c) Keep anon client but add SECURITY DEFINER function for the policy — same objection.

## ADR-005: Rate limiting — in-process Map vs. Upstash Redis
- **Context:** Phase 4 TODO required rate limiting on auth routes. `.env.example` has optional `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` vars (not yet set). ARCHITECTURE.md says no new major dependency without a DECISIONS.md entry.
- **Decision:** Implemented an in-process sliding-window limiter using a module-level `Map` in `middleware.ts`. No new package required.
- **Why:** This is an internal tool with low concurrent traffic. A module-level Map is sufficient for a single-process Vercel deployment (the common case for this project's scale). Adding Upstash as a hard dependency for a feature that may never be stressed is premature complexity for v1.
- **Limitations:** See `KNOWN_ISSUES.md` — in-process state is not shared across Vercel function replicas. Supabase Auth's own throttling (100 req/hr/IP on free tier) provides a secondary layer.
- **Upgrade path:** When/if needed, replace the `hitMap` logic in `middleware.ts` with `@upstash/redis` atomic increment. The env vars are already scaffolded; no architectural change required.
- **Alternatives considered:** Upstash Redis (`@upstash/ratelimit`) — rejected for v1 because it adds a required external service and env var for a low-traffic internal tool.

## ADR-004: No iframe embedding of external tools
- **Context:** Considered showing each linked tool inside the hub via `<iframe>` for a more "unified" feel.
- **Decision:** Cards always open the tool's URL in a new browser tab, never in an iframe.
- **Why:** Most external tools set `X-Frame-Options`/CSP that block iframing; even for internal tools this would need per-tool cooperation and adds fragile complexity for little benefit.
- **Alternatives considered:** iframe with fallback to new tab — rejected as unnecessary complexity for v1.

## ADR-003: Two Supabase clients, service role never reaches the browser
- **Context:** Needed a way to let admins manage all data while regular users are tightly scoped.
- **Decision:** Anon client (RLS-scoped) for client-safe reads; a separate admin client using the service role key, instantiated only inside server-side Route Handlers.
- **Why:** Keeps a hard boundary between "what the browser can ever request" and "what only the trusted server can do" — satisfies the no-direct-frontend-to-privileged-backend requirement.
- **Alternatives considered:** Single client with broad RLS policies keyed off a `role` column readable by the client — rejected because it relies on the client-reported context being trustworthy at query time in more places, increasing attack surface.

## ADR-002: BFF pattern via Next.js Route Handlers, not a separate backend service
- **Context:** Needed a backend layer between the client and Supabase.
- **Decision:** Use Next.js Route Handlers/Server Actions as the entire backend — no separate Express/Nest server.
- **Why:** One codebase, one deploy target (Vercel), fewer moving parts to secure and maintain, sufficient for this app's scale.
- **Alternatives considered:** Standalone Node backend — rejected as unnecessary operational overhead for this project's size.

## ADR-001: Tech stack selection
- **Context:** Needed a modern, fast, well-supported stack with a free-tier-friendly deployment path.
- **Decision:** Next.js 15 + TypeScript + Tailwind + shadcn/ui + Framer Motion + TanStack Query + Zod + Supabase + Vercel.
- **Why:** Each piece is widely adopted (not a fad), has strong docs (reduces hallucination risk when the AI agent needs to check something), and fits together with minimal glue code.
- **Alternatives considered:** Remix (smaller ecosystem for this use case), a custom Express+React setup (more manual wiring, more security surface to manage by hand), Firebase instead of Supabase (Supabase chosen per explicit requirement — Postgres + RLS gives finer-grained access control than Firestore's rules for this relational data model).

<!--
Template for new entries:

## ADR-00N: <short title>
- **Context:** ...
- **Decision:** ...
- **Why:** ...
- **Alternatives considered:** ...
-->
