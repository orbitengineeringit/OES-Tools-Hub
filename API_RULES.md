# API_RULES — Company AI Tools Hub

## 1. Standard Response Shape

Every Route Handler returns exactly one of these two shapes — never a bare array, never a raw Supabase response object:

```ts
// success
{ success: true, data: T }

// failure
{ success: false, error: { code: string, message: string } }
```

`code` is a short machine-readable string (`"UNAUTHORIZED"`, `"VALIDATION_ERROR"`, `"NOT_FOUND"`, `"FORBIDDEN"`, `"SERVER_ERROR"`). `message` is human-readable and safe to show in the UI.

## 2. Standard Handler Pattern

Every privileged Route Handler follows this exact order — do not skip or reorder steps:

1. Get session (`getSession()`) → if none, return `401 UNAUTHORIZED`
2. If route is admin-only, check `profile.role === 'admin'` → if not, return `403 FORBIDDEN`
3. Parse request body/query with the matching Zod schema → if invalid, return `400 VALIDATION_ERROR` with field-level messages
4. Perform the database operation using the correct client (anon for own-data reads, admin client for privileged writes)
5. On any DB error, return `500 SERVER_ERROR` with a generic message (never leak raw DB error text to the client)
6. On success, if the action is a privileged write, insert an `audit_logs` row in the same handler before responding
7. Return the standard success shape

## 3. Route Table

| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| GET | `/api/profile/me` | employee+ | — | fetch own profile |
| PATCH | `/api/profile/me` | employee+ | `ProfileUpdateSchema` | update own profile fields |
| POST | `/api/profile/photo` | employee+ | multipart file | upload/replace own profile photo |
| POST | `/api/auth/ensure-profile` | employee+ | — | auto-create profile row on first login (idempotent) |
| POST | `/api/auth/signout` | any | — | clear session cookie and redirect to /login |
| GET | `/api/tools/mine` | employee+ | — | list tools assigned to current user |
| GET | `/api/admin/tools` | admin | — | list all tools |
| POST | `/api/admin/tools` | admin | `ToolCreateSchema` | create a tool |
| PATCH | `/api/admin/tools/[id]` | admin | `ToolUpdateSchema` | edit a tool |
| DELETE | `/api/admin/tools/[id]` | admin | — | delete a tool |
| POST | `/api/admin/tools/[id]/image` | admin | multipart file | upload/replace a tool's card image |
| GET | `/api/admin/employees` | admin | — | list all employees |
| PATCH | `/api/admin/employees/[id]` | admin | `EmployeeUpdateSchema` | edit department/designation/active status |
| POST | `/api/admin/access` | admin | `{ tool_id, user_id }` | grant a tool to an employee |
| DELETE | `/api/admin/access/[id]` | admin | — | revoke a specific grant |
| GET | `/api/admin/access` | admin | query: `user_id` | list all grants for a given employee |
| GET | `/api/admin/audit-log` | admin | query: page, limit | paginated audit log |

Do not add a route that isn't in this table without adding it here first — this table is the contract Antigravity should build against, not a suggestion.

## 4. Validation Rule

Every entry in the route table above has a corresponding Zod schema in `lib/validation/`. The schema is the single source of truth for what fields exist and their constraints — the same schema is imported by the client-side form and the server route, so they can never drift apart.

## 5. Pagination Convention

Any list endpoint that could grow large (audit log, employees list once the company grows) uses `?page=1&limit=20` query params and returns `{ items: T[], total: number, page: number, limit: number }` inside `data`.

## 6. Error Logging

Server-side errors are logged (console in dev, Sentry in production) with enough context to debug (route, user id, error message) — but the response sent to the client never includes stack traces or raw error objects.
