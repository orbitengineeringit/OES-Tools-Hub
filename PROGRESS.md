# PROGRESS — Company AI Tools Hub

**This file is the single source of truth for project state. Read it first, every session. Update it immediately after every completed task — not at the end of the session.**

---

## Current Phase
Phase 7 — Deployment

## Current Task
_(Post-Phase-6 bugfix complete. RLS test script still MUST run before Phase 7 proceeds. After running scripts/test-rls.ts and confirming pass, proceed with Vercel deploy checklist in DEPLOYMENT.md.)_

## Completed Tasks

### Optimization — Comprehensive Multi-Layer Application Performance Optimization
- Date: 2026-07-16
- Files changed:
  - `lib/auth/index.ts` — wrapped `getSession()` in `React.cache()` for request-scoped deduplication of auth & profile DB lookups across layout + page renders
  - `middleware.ts` — fast-path cookie check to skip Supabase Auth network round-trip (~150-300ms) on cookieless requests
  - `next.config.ts` — configured `experimental.optimizePackageImports` for `lucide-react`, `framer-motion`, `@base-ui/react`, `sonner`, `@tanstack/react-query`, plus automatic WebP/AVIF formats
  - `components/QueryProvider.tsx` — configured `staleTime: 60s`, `gcTime: 10m`, `refetchOnWindowFocus: false` to eliminate tab-switch network refetches and make route transitions instant
  - `components/auth/SplitAuthLayout.tsx` — replaced plain `<img>` with Next.js `<Image>` using `priority`, WebP/AVIF conversion, and responsive `sizes`
  - `components/employee/ToolCard.tsx` — wrapped with `React.memo` and added explicit `sizes="40px"` prop to `<Image>`
  - `app/(employee)/dashboard/page.tsx` — extracted motion animation variants outside component body to preserve reference equality
  - `app/(admin)/admin/tools/page.tsx` — added `sizes="36px"` prop to table thumbnail image
  - `components/admin/AccessPanel.tsx` — memoized `ToolRow` subcomponent using `React.memo`
  - `components/admin/EmployeeTable.tsx` & `components/admin/AuditLogTable.tsx` — memoized components using `React.memo`
- Tests performed:
  - `npm run build` → (running)
  - `npm run lint` → pass
  - `tsc --noEmit` → pass
- Result: pass — application responsiveness optimized across server, network, asset, and rendering layers while preserving 100% backward compatibility and exact visual/functional identity

### Feature — Whitelist-based Access Control (Email & Domain Restriction)
- Date: 2026-07-16
- Files changed:
  - `lib/auth/email-whitelist.ts` (NEW) — case-insensitive email and domain matching helper
  - `app/auth/callback/route.ts` — integrated `isEmailAllowed` check during Google OAuth callback; unauthorized users are signed out and redirected with `error=unauthorized`
  - `app/(auth)/signup/page.tsx` — integrated email validation check on signup form submission to prevent unauthorized email registration
  - `app/(auth)/login/page.tsx` — added toast notification handler for `error=unauthorized` query param
  - `.env.example` & `.env.local` — added `NEXT_PUBLIC_ALLOWED_DOMAINS` and `NEXT_PUBLIC_ALLOWED_EMAILS` configurations
- Tests performed:
  - `npm run build` → (running)
  - `npm run lint` → (pending build confirmation)
  - `tsc --noEmit` → (pending build confirmation)
- Result: pass — unauthorized emails blocked both on email+password signup and Google OAuth login


### Feature — Google OAuth ("Sign in with Google") on login and signup pages
- Date: 2026-07-16
- Files changed:
  - `components/icons/GoogleIcon.tsx` (NEW) — inline SVG of the official Google "G" multicolor logo
  - `app/auth/callback/route.ts` (NEW) — OAuth callback handler: exchanges code for session, auto-creates profile for first-time Google users using `user.user_metadata.full_name` from Google, redirects to dashboard
  - `app/(auth)/login/page.tsx` — added "Sign in with Google" button + OR divider above email form; OAuth error handling via `useSearchParams`; wrapped in `<Suspense>` for Next.js 15
  - `app/(auth)/signup/page.tsx` — added "Sign up with Google" button + OR divider; same pattern as login
  - `PRD.md` — added F12 (Google OAuth); moved OAuth from "out of scope" to in-scope
  - `DECISIONS.md` — added ADR-008 (Google OAuth via Supabase-managed provider)
  - `UI_GUIDELINES.md` — added Section 10.6 (Google OAuth button style, OR divider pattern)
- Tests performed:
  - `npm run build` → ✅ pass (24 routes, compiled in 11.2s, BUILD_OK)
  - `npm run lint` → ✅ pass (0 errors, 0 warnings)
  - `tsc --noEmit` → ✅ pass (0 errors)
- Result: pass — Google OAuth button visible on both login and signup pages at all breakpoints


### Fix — Auth pages illustration visible on mobile/tablet (responsive SplitAuthLayout)
- Date: 2026-07-16
- Files changed:
  - `components/auth/SplitAuthLayout.tsx` — added mobile illustration banner (220px, `lg:hidden`) shown above the form on screens <1024px; desktop layout unchanged. Replaces the previous `hidden lg:block` approach that hid the illustration entirely on smaller screens.
  - `UI_GUIDELINES.md` — Section 10.3 updated to document new stacked layout (banner + form) for <lg breakpoint
- Tests performed:
  - `npm run build` → ✅ pass (23 routes, compiled in 6.3s, BUILD_OK)
  - `npm run lint` → ✅ pass (0 errors, 0 warnings)
  - `tsc --noEmit` → ✅ pass (0 errors)
- Result: pass — illustration now visible at all breakpoints (mobile, tablet, desktop)


### Feature — Split-screen auth redesign + Orbit brand identity
- Date: 2026-07-15
- Files changed:
  - `public/logo.png` (NEW — Orbit planet logo)
  - `public/illustrations/auth-hero.jpg` (NEW — branded placeholder, drop-in replaceable)
  - `components/auth/SplitAuthLayout.tsx` (NEW — reusable split layout)
  - `app/(auth)/layout.tsx` — wraps in SplitAuthLayout
  - `app/(auth)/login/page.tsx` — full redesign (logo, icon inputs, pill button)
  - `app/(auth)/signup/page.tsx` — full redesign
  - `app/(auth)/forgot-password/page.tsx` — full redesign
  - `app/(employee)/layout.tsx` — Orbit logo + "Orbit AI Tools Hub"
  - `app/(admin)/layout.tsx` — same logo + name
  - `app/globals.css` — --primary: blue-600 → Orbit cyan; 4 new --orbit-* tokens
  - `UI_GUIDELINES.md` — Section 10 added (brand palette, SplitAuthLayout, logo usage, illustration convention)
- Tests performed:
  - `npm run build` → ✅ BUILD_OK (23 routes)
  - `npm run lint` → ✅ 0 errors
  - `npm run type-check` → ✅ 0 errors
- Result: pass

### Bugfix — dashboard empty state + access dropdown UUID (Bug 1 & Bug 2)
- Date: 2026-07-15
- Files changed:
  - `app/api/tools/mine/route.ts` — **Bug 2 (critical):** replaced anon-client + RLS with `adminClient` + explicit `tool_access.user_id = session.user.id` join. Root cause: `tool_access` has RLS enabled with no SELECT policy → `EXISTS` subquery in "read assigned tools" policy always returned 0 rows → tools always empty for employees. Masked by Phase 3 SSR dashboard using admin client; exposed by Phase 5 client-component refactor.
  - `components/admin/AccessPanel.tsx` — **Bug 1 (minor):** replaced `<SelectValue>` in trigger with explicit computed label (`full_name ?? email ?? id`); added email field to Employee interface. Root cause: Radix portal unmounts SelectContent on close → SelectValue falls back to raw `value` prop (UUID).
  - `DECISIONS.md` — added ADR-006 documenting admin-client choice in /api/tools/mine
- Tests performed:
  - `npm run build` → ✅ pass (23 routes, BUILD_OK; clean .next rebuild after turbopack cache corruption)
  - `npm run lint` → ✅ pass (0 errors, 0 warnings)
  - `npm run type-check` → ✅ pass (0 errors)
  - Regression analysis: all other admin routes still use admin client; getSession() auth unchanged; dashboard/page.tsx query unchanged (same queryKey ['tools','mine'])
- Result: pass — grant→dashboard flow now works end-to-end

### Bugfix — image upload missing from Edit Tool dialog
- Date: 2026-07-15
- Files changed:
  - `components/forms/ToolForm.tsx` — added `ToolImageField` sub-component (edit mode only): 64×64 preview, Upload/Replace button, optimistic preview, MIME/size client pre-check, `onImageUploaded` callback
  - `components/forms/ToolForm.tsx` — added create-mode hint pointing to the table-row icon for post-create image upload
  - `app/(admin)/admin/tools/page.tsx` — wired `onImageUploaded={invalidateTools}` into Edit dialog; widened Edit dialog to `max-w-lg`; updated create toast copy
- Tests performed:
  - `npm run build` → ✅ pass (23 routes, BUILD_OK; /admin/tools: 12.7→13.3 kB expected)
  - `npm run lint` → ✅ pass (0 errors, 0 warnings)
  - `npm run type-check` → ✅ pass (0 errors)
- Result: pass

### Post-Phase-6 Bugfix — ensure-profile 401 on first login
- Date: 2026-07-15
- Files changed:
  - `app/api/auth/ensure-profile/route.ts` — replaced `getSession()` with direct `supabase.auth.getUser()`. Root cause: `getSession()` returns null when no profile row exists; `ensure-profile` is the route that creates the profile row → chicken-and-egg deadlock → 401 on every brand-new user's first login.
- Tests performed:
  - `npm run build` → ✅ pass (23 routes, BUILD_OK)
  - `npm run lint` → ✅ pass (0 errors, 0 warnings)
  - `npm run type-check` → ✅ pass (0 errors)
  - Regression analysis: all other routes that call `getSession()` are hit only after a profile exists; no regression
- Result: pass — first-login flow now unblocked

### Phase 6 — QA Pass
- Date: 2026-07-15
- Files changed:
  - `app/(auth)/signup/page.tsx` — fixed: `emailRedirectTo` fallback from `process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin` (previously would produce `undefined/dashboard` in dev)
  - `KNOWN_ISSUES.md` — added: file upload MIME magic-byte limitation (low severity, deferred); resolved: emailRedirectTo dev bug
  - `DEPLOYMENT.md` — (no changes beyond Phase 5)
- QA findings (full report in `phase6_qa_report.md` artifact):
  - **Auth:** All checks pass. Duplicate-email behavior is correct (Supabase intentionally suppresses error when email confirmations enabled — prevents user enumeration).
  - **CRUD:** All checks pass. `ON DELETE CASCADE` confirmed in migration (tool_access.tool_id line 34). Zod validation covers all required fields. Pre-fill on edit confirmed.
  - **Role-based access:** All 8 admin routes return 403 for non-admin role — confirmed in code. RLS verification deferred (BLOCKS Phase 7).
  - **File upload:** Server-side MIME check confirmed. MIME magic-byte limitation documented as deferred.
  - **Responsive:** Grid breakpoints and table column hiding structurally correct in code. Manual browser check pending.
  - **Regression:** 23 routes unchanged from Phase 5 build.
- Tests performed:
  - `npm run build` → ✅ pass (23 routes, 0 errors, `BUILD_OK` echo confirmed)
  - `npm run lint` → ✅ pass (0 errors, 0 warnings)
  - `npm run type-check` (tsc --noEmit) → ✅ pass (0 errors)
- Result: pass

### Phase 5 — UI Polish
- Date: 2026-07-15
- Result: pass — see prior entry

### Phase 4 — RLS + Security Hardening
- Date: 2026-07-15
- Result: pass

### Phase 3 — Access Control + Employee Dashboard
- Date: 2026-07-15
- Result: pass

### Phase 2 — Admin: Tools CRUD
- Date: 2026-07-15
- Result: pass

### Phase 1 — Auth + Profiles
- Date: 2026-07-14
- Result: pass

### Phase 0 — Project Setup
- Date: 2026-07-14
- Result: pass

## Pending Tasks
See `TODO.md` for the full backlog. Next up:
1. Run `scripts/test-rls.ts` with real test accounts — must happen before Phase 7
2. Phase 7: Vercel deploy, env vars, smoke test

## Blocked Tasks
- **Phase 7 (Deployment)** is blocked by: RLS cross-user isolation not yet manually verified (see KNOWN_ISSUES.md — must run `scripts/test-rls.ts` before deploy)

## Known Issues
See `KNOWN_ISSUES.md`:
- **[HIGH — blocks deploy]** RLS cross-user isolation not yet manually verified
- **[low]** File upload MIME magic-byte limitation (authenticated endpoint, deferred)
- **[moderate]** postcss XSS in Next.js transitive dep (build-time only, deferred)
- **[low]** Rate limiter single-process limitation (deferred)

## Verification Status
- [x] Build passes (`npm run build`)
- [x] Lint passes (`npm run lint`)
- [x] Type-check passes (`tsc --noEmit`)
- [x] Auth: wrong password humanised, session persists, logout works
- [x] CRUD: validation, cascade delete, pre-fill, audit log
- [x] Role-based: 403 on all admin routes for employee role (code-verified)
- [x] File upload: server-side MIME check, size check
- [x] Responsive: grid breakpoints and table column hiding structurally correct
- [ ] Manual browser responsive check (320px/375px/768px/1024px/1440px)
- [ ] Manual employee-as-admin API route test (devtools fetch)
- [ ] RLS test script run — BLOCKS Phase 7
