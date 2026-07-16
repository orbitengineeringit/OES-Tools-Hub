# UI_GUIDELINES — Company AI Tools Hub

## 1. Theme

- Base: white/near-white background (`#FFFFFF` / `#FAFAFA`), dark text (`#1A1A1A`) for high contrast
- Accent color: **Orbit cyan `#1DB4D2`** — extracted from `public/logo.png`. Single source of truth: `--orbit-cyan` in `app/globals.css`. Update there only; cascades everywhere via `--primary`.
- Neutral grays from Tailwind's default gray scale for borders/muted text — do not introduce a second gray scale

## 2. Typography

- One font family (system font stack or a single Google Font, e.g. Inter) — do not mix fonts
- Scale: `text-sm` (labels/meta), `text-base` (body), `text-lg`/`text-xl` (card titles), `text-2xl`+ (page headers)
- Font weight: `font-semibold` for headings, `font-normal` for body — avoid more than 2 weights on one screen

## 3. Spacing & Layout

- Use Tailwind's default spacing scale exclusively (4px increments) — no arbitrary pixel values like `mt-[13px]`
- Page container: max-width with centered content (`max-w-7xl mx-auto px-4`)
- Card grid: CSS grid, responsive columns:
  - mobile (< 640px): 1 column
  - tablet (640–1024px): 2 columns
  - desktop (> 1024px): 3–4 columns depending on sidebar presence

## 4. Tool Card Component Spec

Every tool card has, in this exact visual order:
1. Image (16:9 or 4:3, `object-cover`, rounded top corners, lazy-loaded)
2. Category badge (small pill, top-left overlay on the image or just below it)
3. Title (`text-lg font-semibold`, truncate at 2 lines max)
4. Description (`text-sm text-gray-600`, truncate at 2–3 lines)
5. "Launch" button (accent color, opens `url` in a new tab via `window.open(url, '_blank', 'noopener,noreferrer')`)

Hover state: subtle lift (`translate-y-[-2px]`) + shadow increase, animated with Framer Motion (150–200ms ease-out) — not CSS-only, so it stays consistent with other motion in the app.

## 5. Motion Guidelines

- Page/section entrance: fade + slight upward slide, 200–300ms, stagger children by ~50ms for grids
- Hover/interactive feedback: 100–150ms, ease-out
- Never animate layout-shifting properties (width/height) for hover states — use `transform` and `opacity` only, for performance
- Respect `prefers-reduced-motion` — disable non-essential animation for users who've set that OS preference

## 6. Responsive Rules

- No fixed pixel widths on containers — use `max-w-*` + `w-full`
- Test at 320px, 375px, 768px, 1024px, 1440px before marking any screen "done" (see `TESTING.md`)
- Admin tables collapse to stacked cards below 640px rather than horizontally scrolling

## 7. Accessibility Baseline

- All interactive elements reachable and operable via keyboard (Tab/Enter/Space)
- Color contrast meets WCAG AA for text on background
- All images (`tool.image_url`, profile photo) have meaningful `alt` text — never empty `alt=""` unless the image is purely decorative
- Form inputs always have an associated `<label>`, not just a placeholder

## 8. Component Source

Use `shadcn/ui` primitives (Button, Card, Dialog, Input, Table, Badge, Avatar) as the base for everything — do not hand-roll a component that shadcn already provides. Compose, don't reinvent.

## 9. Empty & Loading States

- Loading: skeleton cards matching the real card's shape/size — never a generic spinner for list content
- Empty (employee with zero assigned tools): a centered message + simple icon, tone: friendly and clear ("No tools assigned yet — check back soon"), never a blank white screen

## 10. Orbit Brand Identity

### 10.1 Color Palette

Extracted from `public/logo.png` (the Orbit planet/swoosh mark). Do not guess or substitute — always reference these exact hex values:

| Token | CSS variable | Hex | Usage |
|---|---|---|---|
| Orbit Cyan | `--orbit-cyan` | `#1DB4D2` | Primary buttons, links, input focus ring, nav active state, auth submit button |
| Orbit Cyan Dark | `--orbit-cyan-dark` | `#158FAA` | Hover/pressed state for Orbit Cyan elements |
| Orbit Navy | `--orbit-navy` | `#0B3D6E` | Auth right-panel base background, dark accent surfaces |
| Orbit Panel BG | `--orbit-panel-bg` | `#0E4E8A` | Auth right-panel secondary clip-path block |

All four tokens are defined in `:root` in `app/globals.css` and exposed to Tailwind via `@theme inline` as `--color-orbit-*`. Use `var(--orbit-cyan)` in inline styles where Tailwind classes won't reach (e.g. `style={{ background: 'var(--orbit-cyan)' }}`). Do **not** hardcode `#1DB4D2` inline — always reference the CSS variable.

### 10.2 Logo Usage

- File: `public/logo.png` (the canonical Orbit logo — planet sphere + ring + "ORBIT" wordmark)
- Always use `<Image src="/logo.png" alt="Orbit logo" ...>` from `next/image`
- Navbars: `width={28} height={28} className="object-contain"`
- Auth card header: `width={44} height={44} className="object-contain"`
- On dark/coloured backgrounds (e.g. right panel): add `className="brightness-0 invert"` to render as white
- Never use the "AI" text square placeholder — that has been removed

### 10.3 SplitAuthLayout

All auth pages (login, signup, forgot-password) use `<SplitAuthLayout>` from `components/auth/SplitAuthLayout.tsx` via `app/(auth)/layout.tsx`.

Layout structure:
```
min-h-screen flex items-center justify-center bg-[#d5dce6]
└─ FLOATING CARD (white, rounded-2xl, max-w-[1080px])
   ├─ MOBILE ILLUSTRATION BANNER (lg:hidden)
   │   220px tall, full-width, auth-hero.jpg
   │   + angled bottom-edge clip-path transition to white
   ├─ FORM CONTENT (lg:w-[42%], flex-1 on mobile)
   │   white bg, centred, max-w-sm form container
   │   → render children (the page's form content) here
   └─ DESKTOP ILLUSTRATION (hidden lg:block, absolute right 60%)
       Blue (#3478F6) base background
       + auth-hero.jpg with diagonal clip-path left edge
```

Responsive behaviour:
- **≥ 1024px (lg):** side-by-side — left form 42%, right illustration 60% (absolute positioned with diagonal clip-path)
- **< 1024px:** stacked vertically — illustration banner (220px) on top with angled bottom edge, form below. **Nothing is hidden** — the illustration is fully visible on all screen sizes

### 10.4 Illustration Placeholder Convention

- File: `public/illustrations/auth-hero.jpg` (placeholder generated 2026-07-15)
- Rendered via a plain `<img>` tag (not `next/image`) in `SplitAuthLayout.tsx`
- **Drop-in rule:** replace `public/illustrations/auth-hero.jpg` with your own image — no code changes needed. The layout renders whatever is at that exact path.
- If the file is missing, the auth right panel's coloured background is still fully visible; only the illustration itself is absent (not a broken layout)
- If you rename or change the format, update the `src` in `SplitAuthLayout.tsx` only — it's one line

### 10.5 Auth Form Input Style

Auth page inputs do NOT use shadcn `<Input>` — they use native `<input>` with the following class pattern for precise icon placement and pill-style button:
```
h-11 rounded-xl border border-border bg-white pl-4 pr-11 text-sm
placeholder:text-muted-foreground/50 outline-none
focus:ring-2 focus:ring-[#1DB4D2] focus:border-transparent transition-shadow
```
Icon: `position: absolute`, right-aligned inside the input wrapper, `h-4 w-4 text-muted-foreground/40`.
Submit button: `h-12 rounded-full font-bold text-sm uppercase tracking-widest text-white` + Orbit Cyan background via inline style.

### 10.6 Google OAuth Button

Both login and signup pages include a "Sign in/up with Google" button above the email/password form, separated by an "OR" divider.

**Google button style:**
```
w-full h-12 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-700
flex items-center justify-center gap-3
hover:bg-gray-50 hover:shadow-md hover:border-gray-400 active:scale-[0.98]
```
Icon: `GoogleIcon` from `components/icons/GoogleIcon.tsx` — inline SVG of the official Google "G" multicolor logo, sized at `h-5 w-5`.

**OR divider:**
```
<div className="flex items-center gap-4">
  <div className="flex-1 h-px bg-gray-300" />
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">or</span>
  <div className="flex-1 h-px bg-gray-300" />
</div>
```

**OAuth flow:** `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '${origin}/auth/callback' } })` — triggers full-page redirect to Google. Callback at `/auth/callback` (Route Handler) exchanges code for session + ensures profile.

**Suspense requirement:** Both login and signup page components use `useSearchParams()` for OAuth error handling, so the inner form component must be wrapped in `<Suspense>` (Next.js 15 requirement for static pre-rendering).
