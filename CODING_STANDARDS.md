# CODING_STANDARDS — Company AI Tools Hub

## 1. The Optimization Rule (read this first)

If a single built-in language feature, a single library function, or one clear line of code already solves the problem, use it. Do not wrap it in a helper function, a class, or an abstraction layer "for future flexibility." Add abstraction only when the same logic is genuinely needed in 3+ places — not before.

**Bad (over-engineered for no reason):**
```ts
function isEmailValid(email: string): boolean {
  const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim();
  const result = emailRegexPattern.test(trimmedEmail);
  return result;
}
if (isEmailValid(userEmail)) { ... }
```

**Good (same result, no unnecessary ceremony — and in practice, this validation lives in a Zod schema anyway, see Section 4):**
```ts
const isValidEmail = z.string().email().safeParse(email).success;
```

Before finishing any file: re-read it and delete anything that isn't earning its place — unused variables, unnecessary wrapper functions, comments that just restate the code.

## 2. Naming Conventions

- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- Components: `PascalCase`, one component's primary export per file, matching the filename
- Variables/functions: `camelCase`
- Types/interfaces: `PascalCase`, no `I` prefix (`Profile`, not `IProfile`)
- Boolean variables: prefixed `is`/`has`/`should` (`isLoading`, `hasAccess`)
- Constants that never change: `UPPER_SNAKE_CASE`

## 3. File & Folder Rules

- One component per file
- Co-locate a component's tiny helper functions in the same file unless reused elsewhere; only promote to `/lib` once actually shared
- Route Handlers live at `app/api/**/route.ts` and contain only orchestration — actual query logic can live in a small colocated function, but nothing sprawling

## 4. Validation

- Every entity has exactly one Zod schema in `lib/validation/{entity}.ts`
- Infer TypeScript types from Zod schemas (`type Profile = z.infer<typeof ProfileSchema>`) rather than hand-writing a parallel interface — one definition, not two that can drift

## 5. React/Next.js Conventions

- Server Components by default; add `"use client"` only when the file actually needs interactivity/state/browser APIs
- Data fetching for lists/details on the client goes through TanStack Query hooks (`useQuery`/`useMutation`) — no raw `useEffect` + `fetch` + `useState` chains
- Keep components under ~150 lines as a soft guideline; if it's growing past that, it's probably doing two things and should split

## 6. Comments

- Comment *why*, not *what* — the code already says what it does
- No commented-out old code left in a file — delete it, it's in git history if needed

## 7. Imports

Order: (1) external packages, (2) internal absolute imports (`@/lib`, `@/components`), (3) relative imports, (4) types. One blank line between groups.

## 8. Git Commit Messages

`type(scope): short description`, e.g. `feat(admin): add tool creation form`, `fix(auth): correct session redirect loop`. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.

## 9. Error Handling

- Never swallow an error silently (`catch {}` with nothing in it is not allowed)
- User-facing errors are short and actionable; technical detail goes to server logs only (see `API_RULES.md` Section 6)

## 10. Consistency Over Cleverness

If two ways to solve something are equally good, pick whichever pattern already exists elsewhere in the codebase, so the whole project reads like it was written by one disciplined engineer — not a patchwork of AI sessions with different habits.
