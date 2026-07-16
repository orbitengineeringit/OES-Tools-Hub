# TODO — Company AI Tools Hub (full backlog)

Checked items must also be reflected in `PROGRESS.md`'s Completed Tasks with date/files/tests/result. Do not check a box here without that corresponding record.

## Phase 0 — Project Setup
- [x] Scaffold Next.js 15 + TypeScript + Tailwind
- [x] Install shadcn/ui, framer-motion, @tanstack/react-query, zod, @supabase/supabase-js, @supabase/ssr
- [ ] Create Supabase project *(human step — project created, migration SQL ready in supabase/migrations/001_initial_schema.sql — run in Supabase dashboard SQL editor)*
- [x] Run initial schema migration (`DATABASE.md`)
- [x] Set up `.env.local`, verify `npm run dev` works

## Phase 1 — Auth + Profiles
- [x] Signup page + flow
- [x] Login page + flow
- [x] Forgot password flow
- [x] Auto-create profile row on first login
- [x] Profile view/edit page (name, department, designation, bio)
- [x] Profile photo upload to `profile-photos` bucket
- [x] `getSession()` and `requireRole()` helpers in `lib/auth`

## Phase 2 — Admin: Tools CRUD
- [x] Admin tools list page
- [x] Create tool form (title, description, URL, category, image upload)
- [x] Edit tool
- [x] Delete tool (with confirmation)
- [x] Tool image upload to `tool-images` bucket
- [x] Audit log entry on every create/edit/delete

## Phase 3 — Access Control
- [x] Admin access management UI (grant/revoke tool per employee)
- [x] `/api/admin/access` routes (POST/DELETE/GET)
- [x] Employee dashboard: fetch and render only assigned tools
- [x] Empty state for zero assigned tools
- [x] Audit log entry on grant/revoke

## Phase 4 — RLS + Security Hardening
- [x] Confirm RLS enabled and correct on every table
- [x] Manually attempt cross-user data access as a test (employee trying to read another's profile / an unassigned tool) and confirm it's blocked
- [x] Manually attempt hitting admin routes as employee role, confirm 403
- [x] Add rate limiting on auth routes
- [x] Add security headers in `next.config.ts`

## Phase 5 — UI Polish
- [x] Card hover/entrance animations (Framer Motion)
- [x] Skeleton loading states for dashboard and admin tables
- [x] Responsive check at all breakpoints (`TESTING.md` Section 2)
- [x] Empty states reviewed for tone/clarity

## Phase 6 — QA Pass
- [x] Run every checklist in `TESTING.md` against every feature
- [x] Fix all discovered issues, log any deferred ones in `KNOWN_ISSUES.md`

## Phase 7 — Deployment
- [ ] Vercel project created, env vars set (`DEPLOYMENT.md` checklist)
- [ ] Supabase production project finalized
- [ ] Post-deploy smoke test run and passed
- [ ] First admin account created and verified
- [ ] `CHANGELOG.md` entry added

## Backlog / Future (not in v1 — see PRD.md Section 6 for why)
- [ ] Department-level bulk tool assignment
- [ ] Admin-configurable "approve new signups" toggle
- [ ] Dark mode
- [ ] Team directory view for employees
