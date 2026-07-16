# PRD — Company AI Tools Hub

## 1. Vision

One internal platform where every company system/tool that lives at its own URL gets a single, secure, good-looking front door. Admins control visibility per employee. Employees get a clean personal dashboard and manage their own profile.

## 2. Users

### Admin
- Full control over tool cards (create, edit, delete, image, category, URL)
- Full control over who can see which tool (per-employee, and later per-department)
- Full control over employee accounts (view, edit, deactivate)
- Can view an audit log of every admin action

### Employee
- Signs up, logs in
- Creates/edits own profile: name, photo, department, designation, bio
- Sees only the tool cards assigned to them, as a card grid
- Clicks a card → tool's URL opens in a new tab
- Cannot see other employees' profiles or any unassigned tool

## 3. Feature List

**Admin**
- F1. Tool CRUD (title, description, URL, image upload, category, active/inactive toggle)
- F2. Access control — grant/revoke a specific tool to a specific employee
- F3. Employee management — list, search/filter by department, deactivate/reactivate
- F4. Audit log — read-only feed of admin actions (who did what, when)

**Employee**
- F5. Signup/login (email + password)
- F6. Profile create/edit (name, photo, department, designation, bio)
- F7. Personal dashboard — grid of only-assigned tool cards, searchable/filterable by category
- F8. Empty state when zero tools are assigned

**Shared**
- F9. Auth (Supabase Auth), forgot-password flow
- F10. Fully responsive (mobile/tablet/desktop)
- F11. Motion/animated, professional white-theme UI
- F12. Google OAuth — "Sign in with Google" on login and signup pages (via Supabase Google provider)

## 4. User Flows

**Flow A — Employee onboarding**
1. Employee visits signup page → creates account (email + password) → Supabase sends verification email
2. On first login, a blank profile row is auto-created (role = `employee`, `is_active = true`)
3. Employee fills in name, uploads photo, sets department/designation/bio → saves
4. Dashboard shows empty state until admin assigns tools

**Flow B — Admin publishes a tool**
1. Admin opens Admin → Tools → "Add Tool"
2. Fills title, description, URL, category, uploads image → saves
3. Tool now exists but is invisible to everyone until access is granted
4. Admin opens Admin → Access, picks the tool, picks employee(s) → grants access
5. Action is written to the audit log automatically

**Flow C — Employee views dashboard**
1. Employee logs in → dashboard requests "my tools" from the server
2. Server checks session, looks up `tool_access` rows for that user, returns only those tools
3. Cards render with image, title, description, category badge, "Launch" button
4. Click → `window.open(url, '_blank')`

## 5. Non-Functional Requirements

- **Performance:** first meaningful paint under ~1.5s on a typical connection; dashboard data cached client-side (TanStack Query) to avoid refetch flicker on navigation
- **Responsiveness:** usable at 320px width up to large desktop, no horizontal scroll at any breakpoint
- **Security:** see `SECURITY.md` — non-negotiable
- **Availability:** free-tier Vercel/Supabase is acceptable for v1; no uptime SLA promised to end users yet
- **Browser support:** latest two versions of Chrome, Edge, Safari, Firefox

## 6. Explicitly Out of Scope (v1)

Do not build these unless a task in `TODO.md` explicitly asks for them. This section exists specifically so Antigravity does not "helpfully" invent extra scope.

- No embedding external tools in an iframe inside the hub (many tools block iframes via `X-Frame-Options`; cards always open in a new tab)
- No real-time chat/notifications
- No mobile native app (responsive web only)
- No SSO/OAuth with external identity providers other than Google (Google OAuth added per user request; other providers like Microsoft, GitHub, etc. remain out of scope)
- No public/external-facing pages — this is an internal tool, always behind login
- No billing/payments anywhere in this product
- No multi-tenant support (this is one company's internal tool, not a SaaS product for many companies)

## 7. Success Criteria

- An admin can go from "new tool URL" to "visible on the right employee's dashboard" in under 2 minutes, no engineering help needed
- A new employee can self-onboard (signup → profile complete) without asking anyone for help
- Zero cases of an employee seeing a tool they weren't explicitly granted
