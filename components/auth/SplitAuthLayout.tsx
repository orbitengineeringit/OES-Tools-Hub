/**
 * SplitAuthLayout — floating card on gray+blue background.
 *
 * Reference match (Orbit login design):
 *
 * PAGE: Gray bg + large blue diagonal covering bottom-right area.
 * CARD: White rounded card, centered.
 *       - Left side: white form area
 *       - Right side: blue illustration with DIAGONAL left edge
 *         (narrower at top, wider at bottom — clip-path on the illustration)
 *
 * ≥ lg (1024px): side-by-side — left form 42%, right illustration 60% (overlapping via absolute).
 * < lg (1024px): stacked — illustration banner on top, form below. Nothing hidden.
 */

import Image from 'next/image'

interface SplitAuthLayoutProps {
  children: React.ReactNode
}

export function SplitAuthLayout({ children }: SplitAuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#d5dce6]">

      {/* ── BEHIND-CARD BLUE DIAGONAL ──────────────────────────────
          Large blue shape behind the card. Visible at bottom-left
          and edges. Diagonal runs from ~50% at top to ~15% at bottom.
          Desktop only — on mobile the card is full-width so this isn't visible. */}
      <div
        className="absolute inset-0 z-0 hidden lg:block"
        style={{
          background: '#3478F6',
          clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 15% 100%)',
        }}
      />

      {/* ── FLOATING CARD ──────────────────────────────────────────
          White card, centered. On desktop the illustration is clipped
          with a diagonal left edge. On mobile/tablet the card stacks
          vertically: illustration banner on top, form below. */}
      <div
        className="relative z-10 w-[90%] max-w-[1080px] bg-white rounded-2xl overflow-hidden mx-4 my-6 lg:my-8 flex flex-col lg:block"
        style={{ minHeight: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
      >

        {/* ── MOBILE/TABLET ILLUSTRATION BANNER (< lg) ─────────────
            Shown only on smaller screens as a top banner with the
            same illustration. Clipped with a bottom-angled edge. */}
        <div
          className="relative w-full lg:hidden overflow-hidden"
          style={{ height: '220px' }}
          aria-hidden="true"
        >
          {/* Blue fallback behind the image */}
          <div className="absolute inset-0" style={{ background: '#3478F6' }} />
          <Image
            src="/illustrations/auth-hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Angled bottom edge overlay — creates a smooth diagonal transition
              from the image into the white form area below */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 z-10"
            style={{
              background: 'white',
              clipPath: 'polygon(0 100%, 100% 60%, 100% 100%, 0% 100%)',
            }}
          />
        </div>

        {/* ── FORM CONTENT ─────────────────────────────────────────
            On desktop: sits in the left 42%. On mobile: full width below the banner. */}
        <div className="lg:w-[42%] flex items-center px-8 py-10 sm:px-12 lg:px-14 min-h-[400px] lg:min-h-[560px] flex-1">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* ── DESKTOP ILLUSTRATION — absolutely positioned on right side ──
            Clip-path gives the left edge a DIAGONAL shape:
            - Top: narrower (starts at ~20% from its left edge)
            - Bottom: wider (starts at 0% = full left edge)
            This matches the reference exactly. Hidden on mobile (banner used instead). */}
        <div
          className="hidden lg:block absolute top-0 right-0 bottom-0 w-[60%]"
          aria-hidden="true"
          style={{
            clipPath: 'polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        >
          {/* Blue fallback behind the image */}
          <div className="absolute inset-0" style={{ background: '#3478F6' }} />
          <Image
            src="/illustrations/auth-hero.jpg"
            alt=""
            fill
            priority
            sizes="60vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  )
}
