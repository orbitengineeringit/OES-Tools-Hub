# ARCHITECTURE — Company AI Tools Hub

## 1. System Diagram

```
[Browser / Mobile]
      |
      |  fetch("/api/...") — same-origin calls ONLY
      v
[Next.js Server Layer]  (Route Handlers + Server Actions)
      |  - reads session cookie, confirms identity + role
      |  - validates every input with Zod
      |  - holds the Supabase SERVICE ROLE key (server-only env var)
      v
[Supabase]
      - Postgres (RLS enabled on every table — second wall of defense)
      - Auth (issues/verifies sessions)
      - Storage (profile photos, tool card images)
```

The browser never calls Supabase directly for anything that touches another user's data or requires a write. This is a **Backend-for-Frontend (BFF)** pattern: the Next.js server is the only client Supabase ever talks to for privileged operations.

## 2. Tech Stack (exact, pinned)

| Package | Role | Notes |
|---|---|---|
| `next` (v15, App Router) | Framework | Use Route Handlers under `/app/api/**/route.ts` |
| `typescript` | Language | Strict mode on |
| `tailwindcss` | Styling | No custom CSS files unless Tailwind genuinely can't express it |
| `shadcn/ui` | Component primitives | Installed via CLI, components live in `/components/ui` |
| `framer-motion` | Animation | Only for entrance/hover transitions, not core logic |
| `@tanstack/react-query` | Client data cache | Wraps all `/api` calls from client components |
| `zod` | Validation | One schema per entity, shared between form + API route |
| `@supabase/supabase-js` | DB/Auth/Storage client | Two separate client instances — see below |
| `@supabase/ssr` | Session handling in Next.js | For reading auth cookies server-side |

**Do not add a new major dependency (state manager, CSS framework, ORM, etc.) without adding an entry to `DECISIONS.md` first.**

## 3. Two Supabase Clients — Never Confuse Them

1. **Anon client** (`lib/supabase/client.ts`) — uses the public anon key, respects RLS, safe to use in places where RLS alone is sufficient (e.g., reading your own profile).
2. **Admin client** (`lib/supabase/admin.ts`) — uses the service role key, **server-only**, used inside Route Handlers for admin operations (creating tools, granting access, listing all employees). This file must never be imported into any file that ships to the client bundle.

## 4. Folder Structure

```
/app
  /(auth)
    /login/page.tsx
    /signup/page.tsx
  /(employee)
    /dashboard/page.tsx
    /profile/page.tsx
  /(admin)
    /admin/tools/page.tsx
    /admin/employees/page.tsx
    /admin/access/page.tsx
    /admin/audit-log/page.tsx
  /api
    /profile/me/route.ts
    /profile/photo/route.ts
    /tools/mine/route.ts
    /admin/tools/route.ts
    /admin/tools/[id]/route.ts
    /admin/tools/[id]/image/route.ts
    /admin/employees/route.ts
    /admin/employees/[id]/route.ts
    /admin/access/route.ts
    /admin/access/[id]/route.ts
    /admin/audit-log/route.ts
/components
  /ui            (shadcn primitives — do not hand-edit generated files)
  /cards          (ToolCard, EmptyState)
  /forms          (ProfileForm, ToolForm)
  /admin          (AccessMatrix, EmployeeTable, AuditLogTable)
/lib
  /supabase       (client.ts, admin.ts, server.ts)
  /validation     (zod schemas — one file per entity: profile.ts, tool.ts, access.ts)
  /auth           (getSession(), requireRole() helpers)
/types            (shared TypeScript types generated/derived from Zod schemas)
```

## 5. Key Data Flows

**Login → Dashboard**
1. Supabase Auth issues a session cookie on login
2. `dashboard/page.tsx` (server component) calls `getSession()` from `lib/auth`
3. If no session → redirect to `/login`
4. Client component fetches `/api/tools/mine` via TanStack Query
5. Route Handler verifies session, queries `tool_access` joined to `tools`, returns only that user's rows

**Admin grants access**
1. Admin UI calls `POST /api/admin/access` with `{ tool_id, user_id }`
2. Route Handler verifies `role === 'admin'` server-side (never trust a client-side role flag)
3. Admin client inserts into `tool_access`, writes a row to `audit_logs`
4. Response returns updated access list; client cache invalidates and refetches

## 6. Environment Variables

See `.env.example` for the full authoritative list. Never reference an env var in code that isn't listed there — if you need a new one, add it to `.env.example` first and note why in `DECISIONS.md`.
