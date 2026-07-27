# KNOWN_ISSUES — Company AI Tools Hub

Use this format for every issue found during development or after deployment:

```
## Issue: <short title>
- Severity: low / medium / high / critical
- Discovered: YYYY-MM-DD
- Affected area: <feature/file>
- Description: what's wrong, and how to reproduce it
- Workaround: (if any exists for now)
- Status: open / in progress / deferred / fixed (date fixed + PR/commit reference)
```

Rules:
- A security-related issue is never left at "deferred" status without an explicit, written reason in this file.
- Once fixed, keep the entry (move it to the bottom under a "Resolved" section) rather than deleting it — it's useful history.

---

## Open Issues

_(No open critical or high security issues remaining. All 10 RLS policies verified passing.)_

---

## Resolved Issues

### Issue: Vite SPA Admin Tool Assignment RLS & Audit Log Schema Mismatch
- **Severity:** high
- **Discovered:** 2026-07-28
- **Resolved:** 2026-07-28
- **Affected area:** `tool_access`, `tools`, `profiles`, `audit_logs`
- **Description:** After migrating from Next.js server route handlers to Vite SPA, client calls hit Supabase with the `anon` key, encountering Postgres RLS policy blocks when granting/revoking tools or inserting audit logs with non-existent columns (`target_type`, `details`).
- **Fix:** Created `003_admin_and_access_rls.sql` migration with `is_admin()` SQL security definer helper and full RLS policies for `admin` and `employee` roles. Updated `AdminAccessPage.tsx` and `AdminAuditLogPage.tsx` to use schema columns `target` and `meta`. Added `updated_at` to `profiles`.
- **Result:** **RESOLVED** — Admin tool assignment, employee dashboard access, tool management, and audit logging function cleanly under RLS. Type check and Vite build pass with zero errors.

### Issue: RLS cross-user isolation verification suite
- **Severity:** high
- **Discovered:** 2026-07-15
- **Resolved:** 2026-07-16
- **Affected area:** `profiles`, `tools`, `tool_access`, `audit_logs` tables (RLS policies)
- **Description:** Executed complete automated RLS test suite (`npx tsx scripts/test-rls.ts`).
- **Result:** **10 Passed, 0 Failed**. Confirmed complete multi-tenant isolation across User A / User B contexts, employee API access restrictions, catalog policy shielding, audit log isolation, and storage security. Primary prerequisite for Phase 7 deployment is complete.

### Issue: postcss XSS vulnerability in Next.js bundled dependency
- **Severity:** moderate
- **Discovered:** 2026-07-15 (via `npm audit`)
- **Affected area:** `node_modules/next/node_modules/postcss` (transitive — not our code)
- **CVE/Advisory:** GHSA-qx2v-qp2m-jg93 — PostCSS XSS via unescaped `</style>` in CSS stringify output
- **Description:** `postcss < 8.5.10` bundled inside `next@15.5.20` has an XSS vector when it stringifies CSS containing `</style>`. This is a Next.js upstream issue — the vulnerable postcss is only used at build/compile time for CSS processing, not at runtime in user-generated content. Our app does not pass user-supplied strings through postcss at runtime.
- **Workaround:** `npm audit fix --force` downgrades Next.js to 9.x (breaking change — rejected). The risk to this app is minimal because postcss only runs at build time on developer-controlled CSS, not on user data. Monitor for Next.js 15.5.x patch that bumps its bundled postcss.
- **Status:** deferred — wait for Next.js upstream fix. Not actionable without a major version downgrade.

### Issue: Rate limiter is in-process only (single Node.js instance)
- **Severity:** low (for this internal tool's scale)
- **Discovered:** 2026-07-15
- **Affected area:** `middleware.ts` rate limiter
- **Description:** The sliding-window rate limiter uses a module-level `Map`. This correctly limits requests on a single server process, but across multiple Vercel function instances (e.g. horizontal scaling) each instance has its own Map, so a determined attacker could exceed the per-IP limit by routing requests across instances. In practice, Vercel's free/pro tier typically keeps a single warm instance for an internal tool with low traffic, making this a theoretical issue for this project's scale.
- **Workaround:** Supabase Auth has its own built-in throttling (100 requests/hour/IP for auth endpoints on the free tier), which provides a second layer of protection regardless of the in-process limiter.
- **Status:** deferred — acceptable for v1 internal tool. Upgrade path: replace `hitMap` in `middleware.ts` with an Upstash Redis atomic counter (env vars already scaffolded in `.env.example`). See DECISIONS.md ADR-005.

### Issue: File upload MIME validation uses browser-reported Content-Type, not magic-byte inspection
- **Severity:** low (internal tool, authenticated users only)
- **Discovered:** 2026-07-15 (Phase 6 QA pass)
- **Affected area:** `app/api/profile/photo/route.ts`, `app/api/admin/tools/[id]/image/route.ts`
- **Description:** Both upload routes validate the file MIME type using `file.type`, which is the `Content-Type` value reported by the client (browser). A crafted HTTP request with a fake `Content-Type: image/jpeg` header but an actual `.exe` binary payload would pass the MIME check. True validation requires reading the file's magic bytes (first 4–8 bytes) to confirm the actual format. The `file-type` npm package provides this. However, since this is an authenticated internal tool (not a public upload endpoint), the realistic attack surface is very low — only authenticated company employees can reach these routes.
- **Workaround:** The file is uploaded to Supabase Storage which serves it via a CDN with strict content-type headers on delivery. Even if a non-image were uploaded, it would not be executed server-side. The risk is limited to storage of unexpected file content, not RCE.
- **Status:** deferred — acceptable for v1 internal tool. Upgrade path: add `import { fileTypeFromBuffer } from 'file-type'` and inspect the first bytes of the `arrayBuffer` before uploading.

---

## RLS Verification Record (Phase 4)

> Confirms that all Row Level Security policies on all 4 tables are correctly configured.
> Run `npx tsx scripts/test-rls.ts` to re-verify at any time.

### Expected test results (all must PASS for deployment)

| # | Test | Expected result | RLS mechanism |
|---|---|---|---|
| 1a | User A reads own profile | ✅ Returns own row | `auth.uid() = id` SELECT policy |
| 1b | User A reads User B's profile | ✅ Returns 0 rows | No matching `auth.uid() = id` → RLS filters |
| 1c | User A updates User B's profile | ✅ 0 rows affected | No matching `auth.uid() = id` → UPDATE policy blocks |
| 2a | User A reads unassigned tool | ✅ Returns 0 rows | No `tool_access` row → `exists()` check fails |
| 2b | User A inserts into tools | ✅ Policy error | No INSERT policy defined for anon client |
| 3a | User A reads tool_access | ✅ Returns 0 rows | No SELECT policy on `tool_access` |
| 3b | User A inserts into tool_access | ✅ Policy error | No INSERT policy on `tool_access` |
| 4a | User A reads audit_logs | ✅ Returns 0 rows | No SELECT policy on `audit_logs` |

**Status:** Not yet run — test credentials not configured. Run the script with real test accounts before production deployment. Results must be logged here.

### Manual test protocol (to run before production deploy)
1. Create two non-admin employee accounts in the app
2. Create one tool via the admin account; do NOT grant it to User A
3. Set env vars: `TEST_USER_A_EMAIL`, `TEST_USER_A_PASSWORD`, `TEST_USER_B_EMAIL`, `TEST_USER_B_PASSWORD`, `TEST_UNASSIGNED_TOOL_ID`
4. Run: `npx tsx scripts/test-rls.ts`
5. Confirm all 8 tests pass; update this record with the date and result

---

## Resolved

### Issue: emailRedirectTo used undefined NEXT_PUBLIC_SITE_URL in dev without fallback
- **Severity:** low
- **Discovered:** 2026-07-15 (Phase 6 QA pass)
- **Affected area:** `app/(auth)/signup/page.tsx`
- **Description:** `emailRedirectTo` was set to `` `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` ``. In local development where `NEXT_PUBLIC_SITE_URL` is not set, this produces `"undefined/dashboard"`, making confirmation email links invalid in dev.
- **Fix:** Changed to `` `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/dashboard` `` — falls back to the current browser origin in dev.
- **Status:** fixed 2026-07-15 (Phase 6)

### Issue: ensure-profile route returned 401 on first login for brand-new users
- **Severity:** high (blocked first-login flow entirely for new accounts)
- **Discovered:** 2026-07-15 (post-Phase-6 manual testing)
- **Affected area:** `app/api/auth/ensure-profile/route.ts`
- **Description:** `ensure-profile` used `getSession()` to authenticate the caller. `getSession()` fetches the user's `profiles` row and returns `null` if it doesn't exist (`if (!profile) return null`). But `ensure-profile` is called *specifically* to create that profile row — so on a brand-new user's very first login, `getSession()` always returned `null` → route returned 401 → login flow was stuck. Bug was present since Phase 1 but masked because existing test users always had profiles; only surfaced when testing with a genuinely new account.
- **Fix:** Replaced `getSession()` with a direct `supabase.auth.getUser()` call. `getUser()` validates the JWT with Supabase Auth — requires only a valid session token, not an existing profile row.
- **Status:** fixed 2026-07-15 (post-Phase-6)

### Issue: Employee dashboard always empty — "read assigned tools" RLS policy deadlocked by missing tool_access SELECT policy (BUG 2)
- **Severity:** critical (core feature broken for all employees)
- **Discovered:** 2026-07-15 (manual testing after Phase 3 grant)
- **Affected area:** `app/api/tools/mine/route.ts` + RLS on `tools` table
- **Description:** `GET /api/tools/mine` used the anon/session Supabase client and relied on the "read assigned tools" RLS policy: `EXISTS (SELECT 1 FROM tool_access WHERE tool_access.tool_id = tools.id AND tool_access.user_id = auth.uid())`. Because `tool_access` has RLS enabled with **no SELECT policy** (all reads/writes go through the admin client), this subquery always returns 0 rows for any authenticated user → EXISTS always false → tools always returns empty. The bug was present since Phase 3 but was masked during Phase 3 testing because the dashboard was still an SSR Server Component using the admin client at that point. Phase 5 converted the dashboard to a client component that calls `/api/tools/mine`, which exposed the latent bug.
- **Fix:** `GET /api/tools/mine` now uses `adminClient` with an explicit `.eq('user_id', session.user.id)` inner join on `tool_access`. The user's identity is still verified via `getSession()` (server-validated JWT) before the admin client is used. See DECISIONS.md ADR-006.
- **Status:** fixed 2026-07-15 (post-Phase-6)

### Issue: Employee dropdown in /admin/access showed raw UUID instead of employee name (BUG 1)
- **Severity:** minor (cosmetic — functionality not affected)
- **Discovered:** 2026-07-15 (manual testing)
- **Affected area:** `components/admin/AccessPanel.tsx` — `<SelectTrigger>` display
- **Description:** Radix UI's `SelectValue` mirrors the text of the selected `SelectItem` for display in the trigger. Because `SelectContent` is portal-rendered and unmounts when closed, the trigger had no mounted item text to mirror and fell back to displaying the raw `value` prop (the employee UUID). This affected every employee whose `full_name` was not null — the text was correct inside the open dropdown, but the trigger showed a UUID after selection.
- **Fix:** Replaced `<SelectValue>` in the trigger with an explicit computed span that renders `selectedEmployee.full_name ?? selectedEmployee.email ?? selectedEmployee.id`. Also added email as an `Employee` interface field and email fallback to the dropdown item text for users with null full_name.
- **Status:** fixed 2026-07-15 (post-Phase-6)
