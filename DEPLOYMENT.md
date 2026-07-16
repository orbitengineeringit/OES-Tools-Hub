# DEPLOYMENT — Company AI Tools Hub

## 1. Environments

| Environment | Where | Purpose |
|---|---|---|
| Local | developer machine | day-to-day development |
| Production | Vercel (free tier) + Supabase (free tier) | live app used by the company |

There is no separate staging environment in v1 — keep this in mind and test thoroughly locally before pushing (see `TESTING.md`).

## 2. Supabase Setup (one-time)

1. Create a Supabase project
2. Run all migrations from `/supabase/migrations` in order (`DATABASE.md` is the source of truth for what they should contain)
3. Enable RLS on every table (verify none were missed — see `SECURITY.md` Section 1)
4. Create Storage buckets: `profile-photos`, `tool-images`
5. Copy the project URL, anon key, and service role key into Vercel's environment variables (never into a committed file)
6. Manually create the first admin: sign up normally through the app, then in the Supabase Table Editor set that user's `profiles.role` to `'admin'`

## 3. Vercel Setup (one-time)

1. Import the GitHub repo into Vercel
2. Set environment variables (match `.env.example` exactly — see that file for the full list)
3. Set the production branch (`main`)
4. Deploy

## 4. Environment Variable Checklist (must all be set before first deploy)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-only, no `NEXT_PUBLIC_` prefix)
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] (optional, once added) `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## 5. Pre-Deploy Checklist

- [ ] `npm run build` passes locally with zero errors
- [ ] `npm run lint` and type-check pass
- [ ] All items in `TESTING.md` Section 4 gates pass
- [ ] No secrets committed (`git grep -i "service_role"` on the repo returns nothing outside `.env.example`'s variable *name*)
- [ ] `PROGRESS.md` updated to reflect what's being shipped
- [ ] **[HARD BLOCKER — do not skip]** `scripts/test-rls.ts` has been executed against real test accounts and all 8 tests passed. Result logged with date in `KNOWN_ISSUES.md` → "RLS Verification Record". The open issue "RLS cross-user isolation not yet manually verified" must be moved to "Resolved" before deploying.

## 6. Post-Deploy Smoke Test (run on the live URL, every deploy)

1. Sign up a fresh test account → verify email flow works
2. Log in as that account → dashboard loads, shows empty state
3. Log in as admin → create a test tool, grant it to the test account
4. Log back in as test account → confirm the tool now appears
5. Confirm audit log recorded the grant
6. Check on a real mobile device, not just devtools emulation

## 7. Rollback Plan

Vercel keeps every deployment — if a deploy breaks production, use Vercel's dashboard to instantly redeploy the last known-good deployment while the issue is fixed. Database migrations are additive-first where possible (avoid destructive column drops in the same migration as a feature launch) so a code rollback doesn't leave the DB in a broken state.

## 8. After Every Deploy

Append an entry to `CHANGELOG.md` with what shipped, and update `PROGRESS.md`'s current phase/task if this deploy completes one.
