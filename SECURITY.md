# SECURITY — Company AI Tools Hub

No system is 100% unhackable — this document exists to make that statement irrelevant by closing every realistic gap through layered defense, not through a marketing claim.

## 1. Non-Negotiable Rules

1. `SUPABASE_SERVICE_ROLE_KEY` exists only in Vercel server environment variables. It must never appear in any file under `/app` that is imported by a client component, never in `NEXT_PUBLIC_*` variables, never logged, never committed.
2. Every table has RLS enabled (see `DATABASE.md`). This is checked in every PR/change — if a migration adds a table without RLS, that is a bug, not a style choice.
3. Role checks happen server-side, on every privileged Route Handler, by reading the `profiles.role` column tied to the verified session — never by trusting a role value sent from the client.
4. Sessions are managed entirely by Supabase Auth via secure, httpOnly cookies. No tokens are ever stored in `localStorage` or `sessionStorage`.
5. Every API input is validated with the matching Zod schema from `lib/validation` before it touches the database — reject and return a clear error on failure, never "best effort" parse.
6. File uploads (profile photos, tool images) are restricted to `image/png`, `image/jpeg`, `image/webp`, max 5MB, validated server-side (not just via the HTML `accept` attribute, which is trivially bypassed).
7. All admin actions (create/edit/delete tool, grant/revoke access, deactivate employee) write a row to `audit_logs` in the same request — not as an afterthought.

## 2. Threat Model

| Threat | Mitigation |
|---|---|
| Client tampers with role to act as admin | Role is read server-side from the DB via the verified session, never from client payload |
| Client calls Supabase directly, bypassing app logic | Client never holds the service role key; anon key is RLS-restricted to "read own data" only |
| Brute-force login attempts | Rate limit `/api/auth/*` (and Supabase's own built-in throttling) |
| Stolen session cookie | httpOnly + secure + short session lifetime + re-auth for sensitive admin actions (optional, phase 2) |
| SQL injection | Never build raw SQL from string concatenation; use Supabase client query builder or parameterized queries only |
| XSS via profile bio / tool description | React escapes by default — never use `dangerouslySetInnerHTML` on user-supplied text |
| Malicious file upload (disguised executable as image) | Validate MIME type + magic bytes server-side, enforce size limit, store in a bucket with no execute permissions |
| Privilege escalation (employee promotes self to admin) | `role` column is only writable via the admin server client, never via a client-facing update endpoint |
| Leaked API keys in git history | `.env*` files are gitignored; only `.env.example` (no real values) is committed |
| Unauthorized cross-user data read | RLS policy on `tools`/`profiles` scopes every query to `auth.uid()`; server routes double-check role/ownership before returning data |

## 3. Auth Flow

1. Signup/login handled by `@supabase/supabase-js` Auth methods (client-side call is fine here — this is Supabase's own designed public surface, not a data query)
2. On success, `@supabase/ssr` writes the session into httpOnly cookies
3. Every server component/Route Handler calls `getSession()` (from `lib/auth`) which reads and verifies the cookie via Supabase
4. If `getSession()` returns null → redirect to `/login` (server components) or return `401` (Route Handlers)
5. Role-gated routes additionally call `requireRole('admin')`, which throws a `403` if the profile's role doesn't match

## 4. Headers & Transport

- HTTPS enforced by Vercel by default — no plaintext HTTP in production
- Set security headers in `next.config.ts`: `X-Frame-Options: DENY` (this app should never be iframed either), `X-Content-Type-Options: nosniff`, a reasonable `Content-Security-Policy`

## 5. Dependency Hygiene

- Run `npm audit` before each deployment phase
- Keep Next.js, Supabase client libraries, and Zod on current stable minor versions
- Do not add a dependency for something 10 lines of code can solve (also see `CODING_STANDARDS.md`) — fewer dependencies is itself a security posture

## 6. Incident Response (lightweight, for a small internal tool)

If a security issue is found: log it immediately in `KNOWN_ISSUES.md` with severity, do not silently patch without a record, and if it involves a leaked key, rotate it in Supabase/Vercel immediately regardless of what else is in progress.
