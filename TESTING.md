# TESTING — Company AI Tools Hub

No feature is "done" until it passes this. This file is what Antigravity checks itself against during the Verification step of every task (see `AGENTS.md`).

## 1. Test Case Template (fill this in for every feature before touching code)

```
Feature: <name>
Preconditions: <what state the app/data must be in>

Test 1 — Happy path
  Steps: ...
  Expected: ...

Test 2 — Invalid/empty input
  Steps: ...
  Expected: clear validation error, no crash, no partial save

Test 3 — Wrong role / unauthorized
  Steps: hit the API route directly as the wrong role (e.g. employee calling an admin route)
  Expected: 403/401, no data leaked

Test 4 — Refresh/reload
  Steps: perform the action, refresh the page
  Expected: state persisted correctly, no duplicate data

Test 5 — Mobile viewport (375px)
  Steps: resize browser / use device toolbar
  Expected: no horizontal scroll, all actions reachable

Test 6 — Slow network
  Steps: throttle to "Slow 3G" in devtools
  Expected: skeleton/loading state shown, no broken flash of empty content
```

## 2. Per-Feature-Type Checklists

**Auth (signup/login)**
- Wrong password → clear error, no account lockout confusion
- Already-registered email on signup → clear error
- Session persists across page refresh and new tab
- Logout actually clears session (protected page redirects to `/login` after)

**CRUD (tools, employees, profile)**
- Create with all fields → appears correctly in list/UI immediately
- Create with missing required field → blocked with a specific message, not a generic error
- Edit → old values pre-filled correctly, save updates only changed fields
- Delete → confirmation required, item actually gone from list and DB, related `tool_access` rows cleaned up (cascade)

**Role-based access**
- Log in as employee, manually call an admin API route (e.g. via browser devtools `fetch`) → must be rejected, not just hidden in UI
- Employee dashboard never shows a tool without a matching `tool_access` row — verify directly in the Supabase table editor during testing

**File upload (photo/tool image)**
- Valid image uploads and displays correctly
- Oversized file rejected with clear message
- Non-image file (e.g. renamed `.exe` to `.jpg`) rejected server-side, not just by the file picker's `accept` filter

**Responsive**
- 320px, 375px, 768px, 1024px, 1440px — no overlap, no horizontal scroll, all buttons tappable (min ~44px touch target)

## 3. Regression Testing

Before marking any task done, re-check the previously completed features listed as "done" in `PROGRESS.md` that touch the same files/tables you just changed. If you changed `tools` table logic, re-verify: tool creation, tool listing, access-based visibility, and the audit log entry for tool actions — all four, not just the one you were working on.

## 4. Build/Lint/Type Gates

Before considering any task complete, all of these must pass with zero errors:
```
npm run build
npm run lint
npm run type-check   (tsc --noEmit)
```
If any of these fail, the task is not done — fix it before moving on or updating `PROGRESS.md` to "done."

## 5. Manual QA Log

Every completed feature gets one entry appended to the "Tests Performed" field of its `PROGRESS.md` task record, briefly noting which of the above tests were run and the result (pass/fail/fixed).
