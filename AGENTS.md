# AGENTS.md — Operating Protocol for Antigravity

**Read this file first, every session, before writing or changing any code.** This is not optional and not a suggestion — it is the operating system this project runs on.

---

## 0. Session Startup Workflow

At the start of every session, in this exact order:
1. Read `README.md` — orientation
2. Read `PRD.md` — what we're building and what's explicitly out of scope
3. Read `PROGRESS.md` — current phase, current task, what's already done
4. Read `TODO.md` — the full backlog, to see what's next
5. Read `ARCHITECTURE.md` — how the system is structured
6. Read `DECISIONS.md` — so you don't re-debate or silently reverse a settled choice
7. Read `KNOWN_ISSUES.md` — so you don't reintroduce a known bug or ignore an open one relevant to your task

Only after all seven are read may you open a code file.

## 1. Context Loading Workflow (per task, not just per session)

Before implementing the specific task at hand:
- Open and read every file you are about to modify, in full — never edit a file you haven't actually read in this session
- Check `DATABASE.md`, `API_RULES.md`, `SECURITY.md`, `UI_GUIDELINES.md`, or `CODING_STANDARDS.md` — whichever are relevant to this task — for the exact contract you must follow
- If the task touches a table, route, or component not documented in those files, stop and add it to the relevant doc first (this keeps the docs authoritative rather than stale)

## 2. Planning Workflow

Before writing code for any feature, write out this template (in your working notes / as a comment in `PROGRESS.md`'s current task):

```
Goal: <one sentence>
Requirements: <bullet list, from PRD.md/TODO.md>
Constraints: <relevant rules from ARCHITECTURE.md / SECURITY.md / CODING_STANDARDS.md>
Acceptance Criteria: <specific, checkable conditions>
Definition of Done: build/lint/type-check pass + all acceptance criteria verified + docs updated
Dependencies: <what must already exist for this to work>
Risks: <what could go wrong, what might break>
Test Cases: <use the template in TESTING.md>
Completion Checklist: <the specific checklist items from TESTING.md that apply>
```

Do not skip this for "small" tasks — small tasks are exactly where undocumented scope creep and hallucinated shortcuts happen.

## 3. Implementation Workflow

- Implement the smallest coherent slice that satisfies one item from the plan above — not multiple features at once
- Follow `CODING_STANDARDS.md` exactly (naming, no unnecessary abstraction, Server Components by default, etc.)
- Follow `API_RULES.md` exactly for any new/changed route
- Follow `UI_GUIDELINES.md` exactly for any new/changed UI
- Never invent a Supabase method, Next.js API, npm package function, database column, environment variable, or route that isn't in this project's documentation or verified against official docs (see Section 6 — Hallucination Prevention)

## 4. Verification Workflow (the loop — every feature goes through this, in order)

```
Understand
   ↓
Explore Existing Code (read what's already there before adding to it)
   ↓
Create Plan (Section 2 template)
   ↓
Implement
   ↓
Run Build         (npm run build)
   ↓
Run Lint          (npm run lint)
   ↓
Run Type Check    (tsc --noEmit)
   ↓
Run Tests         (TESTING.md checklist for this feature type)
   ↓
Fix Errors
   ↓
Re-test
   ↓
Self Review       (Section 8 questions)
   ↓
Regression Testing (TESTING.md Section 3)
   ↓
Update Documentation (Section 7)
   ↓
Update Progress   (PROGRESS.md)
   ↓
Repeat until everything passes — only then move to the next task
```

If any step fails, you go back up the loop — you do not skip forward and mark the task done anyway.

## 5. Testing Workflow

Follow `TESTING.md` exactly: use its Test Case Template before coding, its per-feature-type checklist during verification, and its regression rules before closing out any task. A task is not "done" until every applicable checklist item has been actually run, not assumed.

## 6. Hallucination Prevention System

You must never invent:
- APIs or methods that don't exist in the actual installed package version
- Supabase features (RLS syntax, Storage behavior, Auth methods) you're not certain of
- Next.js APIs or file conventions
- Database columns not listed in `DATABASE.md`
- Environment variables not listed in `.env.example`
- Routes not listed in `API_RULES.md`
- Libraries not listed in `ARCHITECTURE.md` Section 2
- Functions/utilities you assume exist but haven't verified are actually in the codebase
- Requirements the user never asked for (check `PRD.md` Section 6 — Out of Scope — before adding anything not requested)

Whenever uncertain about any of the above, in this order:
1. Search the existing project for how it's already done elsewhere
2. Read the relevant project documentation file
3. Read related source files directly
4. Check official documentation (Next.js docs, Supabase docs, package README) if still uncertain
5. Only proceed once verified — if you cannot verify, say so explicitly rather than guessing

**Never guess. A wrong "I'm not sure but here's my best guess" silently shipped is worse than stopping to say "I need to verify X before continuing."**

## 7. Documentation Workflow

After implementing and verifying a feature, update, in this order:
1. `PROGRESS.md` — move the task to Completed with date, files changed, tests performed, result
2. `TODO.md` — check the box
3. `CHANGELOG.md` — add an entry if this completes a deployable unit of work
4. `DECISIONS.md` — add an ADR entry if you made any non-trivial technical choice along the way
5. `KNOWN_ISSUES.md` — log anything you noticed but deliberately didn't fix now
6. Any of `DATABASE.md` / `API_RULES.md` / `ARCHITECTURE.md` / `UI_GUIDELINES.md` that the feature actually changed — these must stay accurate, not just the code

## 8. Self-Review System

After every implementation, before declaring it done, answer honestly:
- Did I satisfy every requirement in the plan (Section 2), not just the obvious happy path?
- Did I introduce duplicate code that should reuse something existing?
- Did I break anything that was previously working? (check via regression testing)
- Can this be simplified? (re-check against `CODING_STANDARDS.md` Section 1)
- Is every relevant doc updated (Section 7)?
- Did I actually run this manually, or am I assuming it works?
- Did I check edge cases (empty input, wrong role, slow network, mobile width)?

If the answer to any of these is "no" or "not sure," you are not done — continue working.

## 9. Debug Workflow

When something fails:
1. Reproduce it reliably first — don't fix based on a guess of what's wrong
2. Read the actual error message/stack trace in full
3. Check `KNOWN_ISSUES.md` — has this been seen before?
4. Isolate: is it the client, the API route, the database policy, or the auth session?
5. Fix the smallest thing that resolves the root cause — not a broad rewrite
6. Re-run the full verification loop (Section 4) for anything you touched while debugging

## 10. Infinite Loop Protection

If the same fix has already failed twice for the same issue:
- **Stop.**
- Explicitly state what was tried and why it didn't work
- Do not attempt the identical fix a third time
- Step back and reconsider the approach at a higher level — is the plan (Section 2) itself wrong? Is there a wrong assumption about how a library/Supabase feature works? Re-verify via Section 6 before trying again

## 11. Completion Workflow

A task is only complete when ALL of the following are true simultaneously:
- [ ] Every Acceptance Criterion from the plan (Section 2) is met
- [ ] Build, lint, and type-check all pass with zero errors
- [ ] Every applicable `TESTING.md` checklist item has been run and passed
- [ ] Regression check performed on related existing features
- [ ] All relevant documentation files updated (Section 7)
- [ ] `PROGRESS.md` reflects the true current state

Do not stop partway through a feature and call it "mostly done" — either it meets every item above, or the task is still in progress and `PROGRESS.md` should say so honestly (including in "Blocked Tasks" if genuinely stuck, with the specific blocker written out).

## 12. Regression Prevention

Before modifying any existing file:
- Identify what else depends on it (search for imports/usages)
- Understand the existing behavior fully before changing it
- Preserve all currently-working functionality unless the task explicitly requires changing it (and if so, note it in `DECISIONS.md`)

After modifying:
- Re-verify every feature that touches the same table/route/component
- Fix any regression before moving on — a regression is not a "known issue" to defer, it's a break in something that already worked

## 13. Long-Term Maintainability

Every session should leave the codebase at least as clean as it found it: consistent naming (`CODING_STANDARDS.md`), no duplicate logic, no dead code, folder structure matching `ARCHITECTURE.md`, and documentation that matches reality. This project should be just as easy to pick up on commit #400 as it is on commit #4.
