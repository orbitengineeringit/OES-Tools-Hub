# CHANGELOG — Company AI Tools Hub

Format (based on Keep a Changelog): newest entry on top. One entry per deploy or meaningful milestone, not per commit.

## 2026-07-15 — Feature: Split-screen auth redesign + Orbit brand identity

### Summary
Complete visual overhaul of the three auth pages (login, signup, forgot-password) to a split-screen layout matching the Orbit reference design. Updated both navbars (admin + employee) with the real Orbit logo. Established the Orbit brand palette as the new primary token system across the entire app.

### Brand color change
- Replaced generic blue-600 (`#2563eb`) with Orbit Cyan (`#1DB4D2`) as `--primary` across all shadcn components (buttons, input focus rings, badges, active states)
- Added four new CSS tokens: `--orbit-cyan`, `--orbit-cyan-dark`, `--orbit-navy`, `--orbit-panel-bg` — sourced from pixel analysis of `public/logo.png`

### New files
- `public/logo.png` — Orbit logo (planet sphere + ORBIT wordmark)
- `public/illustrations/auth-hero.jpg` — branded placeholder illustration (drop-in replaceable, no code change needed)
- `components/auth/SplitAuthLayout.tsx` — reusable split-screen layout wrapper

### Modified files
- `app/globals.css` — brand token swap + 4 new Orbit tokens
- `app/(auth)/layout.tsx` — wraps in `<SplitAuthLayout>` instead of plain centred div
- `app/(auth)/login/page.tsx` — complete redesign: Orbit logo header, icon-decorated inputs, pill submit button, proper links
- `app/(auth)/signup/page.tsx` — same treatment; email-sent confirmation state updated
- `app/(auth)/forgot-password/page.tsx` — same treatment; reset-sent confirmation state updated
- `app/(employee)/layout.tsx` — logo: AI square → `<Image src="/logo.png">`, name: "Orbit AI Tools Hub"
- `app/(admin)/layout.tsx` — same logo + name update
- `UI_GUIDELINES.md` — added Section 10 (Orbit Brand Identity: colour tokens, logo usage, SplitAuthLayout, illustration convention, auth input style)

### Verification
- `npm run build` → ✅ BUILD_OK (23 routes, 0 errors)
- `npm run lint` → ✅ 0 errors
- `npm run type-check` → ✅ 0 TypeScript errors
- Auth page JS bundle reduced: login 3.21kB → 2.11kB (removed shadcn Card/CardHeader/CardContent/CardFooter imports)

## 2026-07-15 — Bugfix: dashboard empty state + access dropdown UUID (Bug 1 & 2)

### Bug 2 (critical) — Employee dashboard always showed "No tools assigned yet"
**Root cause:** `GET /api/tools/mine` used the anon/session Supabase client and relied on RLS policy "read assigned tools" (`EXISTS (SELECT 1 FROM tool_access WHERE ...)`). `tool_access` has RLS enabled but **no SELECT policy** — reads/writes are admin-client-only. So the EXISTS subquery always returned 0 rows → RLS policy always false → tools table always returned empty for authenticated users. Present since Phase 3 but masked because the SSR Server Component dashboard used the admin client directly; exposed when Phase 5 converted to a client component that fetches `/api/tools/mine`.
**Fix:** `app/api/tools/mine/route.ts` now uses `adminClient` + explicit `.eq('user_id', session.user.id)` inner join on `tool_access`. Identity is still verified via `getSession()` before the admin client is used. See DECISIONS.md ADR-006.

### Bug 1 (minor) — /admin/access employee dropdown showed raw UUID instead of name
**Root cause:** Radix UI's `SelectValue` mirrors text from the selected `SelectItem`, but `SelectContent` is portal-rendered and unmounts when closed. With no mounted item to mirror, the trigger fell back to displaying the raw `value` prop (the UUID).
**Fix:** `components/admin/AccessPanel.tsx` — replaced `<SelectValue>` in trigger with an explicit computed label: `selectedEmployee.full_name ?? selectedEmployee.email ?? selectedEmployee.id`. Added email as Employee interface field + fallback in dropdown item text.

### Files touched
- `app/api/tools/mine/route.ts` (admin client + explicit join)
- `components/admin/AccessPanel.tsx` (SelectTrigger label fix + email fallback)
- `DECISIONS.md` (ADR-006)
- `KNOWN_ISSUES.md` (Resolved entries)

## 2026-07-15 — Bugfix: image upload missing from Edit Tool dialog

### Investigation
- `POST /api/admin/tools/[id]/image` route — ✅ fully implemented and working
- `ToolImageUpload` component — ✅ existed inline in `admin/tools/page.tsx`, wired to the `ImagePlus` icon in each table row
- **Gap:** no image upload in the Edit Tool dialog (`ToolForm`); the only way to upload/change an image was via the tiny table-row icon, which was invisible when the table was empty and undiscoverable in the Edit flow

### Fixed
- **`components/forms/ToolForm.tsx`** — added `ToolImageField` sub-component that appears in **edit mode only** (image upload requires the tool to exist to have an `id` for the route). Features:
  - 64×64 image preview box with rounded corners; shows `ImagePlus` placeholder when no image exists
  - `Upload image` / `Replace image` button (variant=outline, size=sm)
  - Optimistic local preview on file select; reverts to previous on server error
  - JPEG / PNG / WebP · max 5 MB hint text
  - Client-side MIME + size pre-check (mirrors server-side validation)
  - Calls `onImageUploaded(newUrl)` prop on success so the parent can invalidate its query
- **`components/forms/ToolForm.tsx`** — added contextual hint in **create mode**: "After creating the tool, click the 📷 icon in the table row to add an image" — explains the intentional two-step pattern
- **`app/(admin)/admin/tools/page.tsx`** — passes `onImageUploaded={invalidateTools}` into the Edit dialog's `ToolForm` so an upload within Edit also refreshes the table
- **`app/(admin)/admin/tools/page.tsx`** — widens Edit dialog from `max-w-md` → `max-w-lg` to give the image field + form fields room
- **`app/(admin)/admin/tools/page.tsx`** — improves create success toast: "Tool created — use the image icon in the row to add a cover image."

### Files touched
- `components/forms/ToolForm.tsx` (rewrote with ToolImageField)
- `app/(admin)/admin/tools/page.tsx` (prop wiring, dialog width, toast copy)

## 2026-07-15 — Post-Phase-6 Bugfix: ensure-profile 401 on first login

### Fixed
- **`app/api/auth/ensure-profile/route.ts`** — critical first-login regression: brand-new users always received 401 on their first sign-in.
  - **Root cause:** `ensure-profile` was calling `getSession()`, which internally queries `profiles` and returns `null` when no row exists. But `ensure-profile` is the route that *creates* that row — so no profile → `getSession()` returns null → route returns 401 → login stuck. Classic chicken-and-egg.
  - **Fix:** Authenticate via `supabase.auth.getUser()` directly. This validates the JWT with Supabase Auth — it requires only a valid token, not an existing profile row.
  - **Why this was hidden:** All Phase 1–5 tests used accounts created during Phase 1, which always had profiles. The bug only surfaces on a user's very first login before any profile exists.

### Files touched
- `app/api/auth/ensure-profile/route.ts`
- `KNOWN_ISSUES.md` (added resolved entry)
- `PROGRESS.md`

## 2026-07-15 — Phase 6: QA Pass

### Fixed
- `app/(auth)/signup/page.tsx` — `emailRedirectTo` now falls back to `window.location.origin` when `NEXT_PUBLIC_SITE_URL` is unset (previously produced `undefined/dashboard` in local dev, breaking email confirmation links)

### QA Findings (full report in `phase6_qa_report.md`)
| Area | Result |
|---|---|
| Auth (wrong password, duplicate email, session, logout) | ✅ All pass |
| CRUD (validation, pre-fill, delete cascade via ON DELETE CASCADE, audit log) | ✅ All pass |
| Role-based access (403 on all 8 admin routes for employee role) | ✅ Code-verified |
| File upload (server-side MIME check, size limit) | ✅ Pass with caveats — see Known Issues |
| Responsive (breakpoints, column hiding) | ✅ Code-verified — manual browser check pending |
| Regression (23 routes unchanged from Phase 5) | ✅ Pass |

### Deferred items logged
- File upload MIME uses browser-reported Content-Type, not magic bytes (low, deferred — see KNOWN_ISSUES.md)
- Manual RLS test script execution — remains **HARD BLOCKER** for Phase 7

### Files touched
- `app/(auth)/signup/page.tsx` (bug fix)
- `KNOWN_ISSUES.md` (new: MIME limitation; resolved: emailRedirectTo)

## 2026-07-15 — Phase 5: UI Polish

### Added
- `components/ui/skeleton.tsx` — shadcn-style Skeleton primitive (`animate-pulse` on muted background)
- `components/employee/ToolCardSkeleton.tsx` — pixel-matched skeleton for the tool card grid (thumbnail box + 2 text lines + badge pill)
- `components/admin/TableRowSkeleton.tsx` — configurable skeleton table body (`rows` / `cols` props); first-col wider, last-col narrower to look organic
- `components/employee/ToolCard.tsx` — Framer Motion entrance (fade + y:16 slide, 50ms stagger per `index` prop, 250ms ease-out) + hover lift (y:-2 + `boxShadow`, 150ms ease-out); `useReducedMotion()` disables all animation for OS-level reduced-motion preference
- `app/(employee)/dashboard/page.tsx` — converted from SSR to client component; TanStack Query (`staleTime: 30_000`); shows 8 `ToolCardSkeleton` placeholders during loading; header fades in; empty state fades in
- `app/(admin)/admin/tools/page.tsx` — Loader2 spinner replaced with `TableRowSkeleton` (5 rows × 5 cols) with matching column headers
- `components/admin/EmployeeTable.tsx` — same Loader2 → `TableRowSkeleton` replacement; unused `Loader2` import removed

### Governance
- `KNOWN_ISSUES.md` — added "RLS cross-user isolation not yet manually verified" (high severity, **blocks Phase 7/Deploy**)
- `DEPLOYMENT.md` — added hard BLOCKER item in Pre-Deploy Checklist: `scripts/test-rls.ts` must pass before any production deployment

### Fixed
- Framer Motion v12 type error: `ease: 'easeOut'` must be `'easeOut' as const` to satisfy the `Easing` union type (affects `ToolCard.tsx` and `dashboard/page.tsx`)

### Files touched
- `components/ui/skeleton.tsx` (new), `components/employee/ToolCardSkeleton.tsx` (new), `components/admin/TableRowSkeleton.tsx` (new)
- `components/employee/ToolCard.tsx`, `app/(employee)/dashboard/page.tsx`
- `app/(admin)/admin/tools/page.tsx`, `components/admin/EmployeeTable.tsx`
- `KNOWN_ISSUES.md`, `DEPLOYMENT.md`

## 2026-07-15 — Phase 4: RLS + Security Hardening

### Added
- `middleware.ts` — in-process sliding-window rate limiter: 20 req/60s per IP on auth paths (`/login`, `/signup`, `/forgot-password`, `/api/auth/*`); returns HTTP 429 + `Retry-After: 60` header
- `next.config.ts` — `Permissions-Policy` (disables camera/mic/geolocation/interest-cohort), `Strict-Transport-Security` (HSTS 1 year + includeSubDomains), `X-DNS-Prefetch-Control: off`, `frame-ancestors 'none'` added to CSP
- `scripts/test-rls.ts` — runnable RLS verification script (8 test cases across all 4 tables); run with `npx tsx scripts/test-rls.ts`
- `KNOWN_ISSUES.md` — full open issues section: postcss audit finding, rate-limiter limitation, RLS verification record with expected results table and manual test protocol
- `DECISIONS.md` — ADR-005 (rate limiting: in-process Map vs Upstash Redis), ADR-006 (security headers additions)

### Security checklist status after Phase 4
| Header | Status |
|---|---|
| `X-Frame-Options: DENY` | ✅ (Phase 0) |
| `X-Content-Type-Options: nosniff` | ✅ (Phase 0) |
| `Referrer-Policy: strict-origin-when-cross-origin` | ✅ (Phase 0) |
| `Content-Security-Policy` | ✅ (Phase 0, tightened Phase 4) |
| `Permissions-Policy` | ✅ (Phase 4) |
| `Strict-Transport-Security` | ✅ (Phase 4) |
| `X-DNS-Prefetch-Control: off` | ✅ (Phase 4) |
| Rate limiting on auth routes | ✅ (Phase 4) |

### npm audit
- 2 moderate vulnerabilities in `postcss < 8.5.10` bundled inside `next@15.5.20` (transitive, build-time only, upstream fix required — documented in `KNOWN_ISSUES.md`, not actionable without Next.js downgrade)

### Files touched
- `middleware.ts`, `next.config.ts`, `scripts/test-rls.ts` (new)
- `KNOWN_ISSUES.md`, `DECISIONS.md`

## 2026-07-15 — Phase 3: Access Control + Employee Dashboard

### Added
- `/admin/access` page — employee selector + tool checklist; toggling grants/revokes access immediately
- `/admin/employees` page — full employee table (avatar, name, department, designation, role, status)
- `/dashboard` — SSR tool card grid using RLS-filtered query; empty state with icon when no tools assigned
- `GET /api/admin/access?user_id=UUID` — list grants for a specific employee (admin only)
- `POST /api/admin/access` — grant tool to employee; 409 on duplicate (Postgres 23505); writes `access.granted` audit log
- `DELETE /api/admin/access/[id]` — revoke grant; reads tool+employee names for audit target string; writes `access.revoked` audit log
- `GET /api/admin/employees` — list all profiles alphabetically (admin only)
- `GET /api/tools/mine` — returns only tools the current user has access to via RLS
- `components/employee/ToolCard.tsx` — clickable card (opens tool URL in new tab), thumbnail, description 2-line clamp, category badge
- `components/admin/EmployeeTable.tsx` — TanStack Query client table (replaces Phase 2 stub)
- `components/admin/AccessPanel.tsx` — employee Select + per-tool checkboxes; disables all while mutation in flight

### Fixed
- `components/admin/AccessPanel.tsx`: `@base-ui/react/select` `onValueChange` passes `string | null`; wrapped `setSelectedUserId` to coerce null to `''`

### Files touched
- `app/api/admin/employees/route.ts`, `app/api/admin/access/route.ts`, `app/api/admin/access/[id]/route.ts`
- `app/api/tools/mine/route.ts`, `app/(employee)/dashboard/page.tsx`
- `app/(admin)/admin/employees/page.tsx`, `app/(admin)/admin/access/page.tsx`
- `components/employee/ToolCard.tsx` (new), `components/admin/EmployeeTable.tsx`, `components/admin/AccessPanel.tsx` (new)
- `API_RULES.md` (added GET /api/admin/access)

## 2026-07-15 — Phase 2: Admin Tools CRUD

### Added
- Admin layout (`app/(admin)/layout.tsx`) — role-guarded via `requireRole('admin')`, top nav with Tools / Employees / Access / Audit Log
- Admin tools page (`/admin/tools`) — full CRUD: table, create dialog, edit dialog, delete confirmation, inline image upload
- Admin audit log page (`/admin/audit-log`) — paginated table with actor name, action badge, target, timestamp
- `lib/audit.ts` — shared `writeAuditLog()` helper called after every admin mutation
- `GET /api/admin/tools` — list all tools (admin only)
- `POST /api/admin/tools` — create tool + write `tool.created` audit log entry
- `PATCH /api/admin/tools/[id]` — update tool + write `tool.updated` audit log entry
- `DELETE /api/admin/tools/[id]` — delete tool + write `tool.deleted` audit log entry
- `POST /api/admin/tools/[id]/image` — upload/replace tool image (MIME + 5MB server validation, upsert to `tool-images` bucket)
- `GET /api/admin/audit-log` — paginated audit log with actor join (`?page=1&limit=20`)
- `components/forms/ToolForm.tsx` — react-hook-form + Zod create/edit form with category Select
- `components/admin/AuditLogTable.tsx` — paginated audit log table, TanStack Query, action badge color coding
- shadcn components added: `dialog`, `alert-dialog`, `select`, `table`, `textarea`
- `next.config.ts` updated with `images.remotePatterns` for Supabase Storage public URLs

### Fixed
- `lib/validation/tool.ts`: removed `z.boolean().default(true)` on `is_active` — Zod v4's `.default()` creates an input/output type split that breaks `zodResolver` typing in react-hook-form

### Files touched
- `lib/audit.ts` (new), `lib/validation/tool.ts`
- `app/(admin)/layout.tsx` (new), `app/(admin)/admin/tools/page.tsx`, `app/(admin)/admin/audit-log/page.tsx`
- `app/(admin)/admin/employees/page.tsx` (placeholder), `app/(admin)/admin/access/page.tsx` (placeholder)
- `app/api/admin/tools/route.ts`, `app/api/admin/tools/[id]/route.ts`, `app/api/admin/tools/[id]/image/route.ts`
- `app/api/admin/audit-log/route.ts`
- `components/forms/ToolForm.tsx`, `components/admin/AuditLogTable.tsx`
- `components/ui/dialog.tsx`, `alert-dialog.tsx`, `select.tsx`, `table.tsx`, `textarea.tsx` (new)
- `next.config.ts`

## 2026-07-14 — Phase 1: Auth + Profiles

### Added
- `middleware.ts` — Supabase SSR session refresh middleware (required for persistent sessions)
- Signup page (`/signup`) with email+password form, confirm password, post-signup verification email confirmation state
- Login page (`/login`) with email+password, "Forgot password?" link, friendly error messages
- Forgot password page (`/forgot-password`) — email-enumeration safe (always shows success message)
- Employee layout (`app/(employee)/layout.tsx`) — auth guard, top nav, avatar, sign-out
- Dashboard placeholder (`/dashboard`) — welcome message, empty state for Phase 3 tools
- Profile page (`/profile`) — SSR data load, edit form (name, department, designation, bio), photo uploader
- `GET /api/profile/me` — fetch own profile (401 if not authenticated)
- `PATCH /api/profile/me` — update own profile fields (Zod-validated, 400 on bad input)
- `POST /api/profile/photo` — upload profile photo (server-side MIME type + 5MB size enforcement)
- `POST /api/auth/ensure-profile` — idempotent, race-safe profile row auto-creation on first login
- `POST /api/auth/signout` — server-side session clear + redirect to /login
- `components/QueryProvider.tsx` — TanStack Query client provider
- `components/forms/ProfileForm.tsx` — react-hook-form + Zod, posts to PATCH /api/profile/me
- `components/forms/PhotoUploader.tsx` — hidden file input + button, posts to POST /api/profile/photo
- shadcn/ui initialized (base-nova style, Tailwind v4) with components: button, input, label, card, avatar, badge, separator, sonner
- react-hook-form, @hookform/resolvers added to dependencies
- Brand blue (#2563eb) set as `--primary` and `--ring` in CSS variables

### Files touched
- `middleware.ts` (new), `app/layout.tsx`, `app/globals.css`, `components.json`, `lib/utils.ts`
- `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/forgot-password/page.tsx`
- `app/(employee)/layout.tsx`, `app/(employee)/dashboard/page.tsx`, `app/(employee)/profile/page.tsx`
- `app/api/profile/me/route.ts`, `app/api/profile/photo/route.ts`
- `app/api/auth/ensure-profile/route.ts`, `app/api/auth/signout/route.ts`
- `components/QueryProvider.tsx`, `components/forms/ProfileForm.tsx`, `components/forms/PhotoUploader.tsx`
- `components/ui/*` (8 new shadcn components)
- `API_RULES.md` (2 new routes added)


### Added
- Next.js 15.5.20 scaffold with TypeScript (strict), Tailwind CSS v4, ESLint
- Dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `framer-motion`, `@tanstack/react-query`, `zod`
- Full folder structure per `ARCHITECTURE.md` (all page and route stubs in place)
- `lib/supabase/client.ts` — browser anon client (RLS-scoped)
- `lib/supabase/server.ts` — server SSR client (cookie-based session)
- `lib/supabase/admin.ts` — service-role admin client (server-only)
- `lib/auth/index.ts` — `getSession()` and `requireRole()` helpers
- `lib/validation/profile.ts`, `tool.ts`, `access.ts` — Zod schemas for all three entities
- `types/index.ts` — shared types barrel with `ApiResponse` and `PaginatedData` envelopes
- `supabase/migrations/001_initial_schema.sql` — full schema (profiles, tools, tool_access, audit_logs) + RLS policies
- `.env.example` — variable names only, no secrets
- Security headers in `next.config.ts` (X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, CSP)
- Design tokens in `app/globals.css` (accent color, foreground/background, Inter font, prefers-reduced-motion rule)

### Files touched
- `package.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `.gitignore`, `.env.example`, `.env.local`
- `supabase/migrations/001_initial_schema.sql`
- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- `lib/auth/index.ts`
- `lib/validation/profile.ts`, `lib/validation/tool.ts`, `lib/validation/access.ts`
- `types/index.ts`
- All page stubs under `app/(auth)/`, `app/(employee)/`, `app/(admin)/`
- All route stubs under `app/api/`
- All component stubs under `components/`

<!--
Template for each new entry:

## YYYY-MM-DD — Phase N: <short name>
### Added
- ...
### Changed
- ...
### Fixed
- ...
### Files touched
- ...
-->
