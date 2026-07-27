'use client'

import { memo, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

interface ToolCardProps {
  id: string
  title: string
  description?: string | null
  url: string
  image_url?: string | null
  category?: string | null
  index?: number
}

// ── Exported entrance variants for parent grid orchestration ──────────────
// DashboardClient wraps each card in <motion.div variants={cardEntranceVariants}>
// so the grid can control stagger timing centrally (Agent B pattern)
export const cardEntranceVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
      mass: 0.9,
    },
  },
}

// ── Spring configs (Agent B values — snappy, one micro-overshoot, premium) ─
const CARD_SPRING = { type: 'spring' as const, stiffness: 340, damping: 22, mass: 0.8 }
const QUICK_SPRING = { type: 'spring' as const, stiffness: 420, damping: 20 }

export const ToolCard = memo(function ToolCard({
  title,
  description,
  url,
  image_url,
  category,
  index = 0,
}: ToolCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // ── 3D cursor-tracked tilt (Agent C) ────────────────────────────────────
  // Mouse position mapped to ±5° rotation — spring smooths the movement
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30,
  })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  })

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (shouldReduceMotion || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleHoverEnd() {
    // Spring back to flat when mouse leaves
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  const firstLetter = title[0]?.toUpperCase() ?? '?'

  return (
    // ── Gradient border wrapper (Agent B trick) ──────────────────────────
    // A 1px gradient border from orbit-cyan → orbit-navy looks dimensional.
    // Two stacked absolute divs handle the resting → hover opacity transition
    // (CSS can't transition between different gradients, so we fade between layers)
    <div style={{ borderRadius: '20px', padding: '1px', position: 'relative' }}>
      {/* Resting border (always visible, low opacity) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '20px',
          pointerEvents: 'none',
          background:
            'linear-gradient(135deg, rgba(29,180,210,0.3) 0%, rgba(11,61,110,0.15) 100%)',
        }}
      />
      {/* Hover border (fades in — high opacity cyan→navy glow) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '20px',
          pointerEvents: 'none',
          background:
            'linear-gradient(135deg, rgba(29,180,210,0.75) 0%, rgba(11,61,110,0.45) 100%)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* ── The Card ────────────────────────────────────────────────────── */}
      <motion.a
        ref={cardRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${title}`}
        onHoverStart={() => !shouldReduceMotion && setIsHovered(true)}
        onHoverEnd={handleHoverEnd}
        onMouseMove={handleMouseMove}
        // Hover: spring lift + dual shadow (Agent B: foreground cyan + depth navy)
        // Entrance handled by parent motion.div in DashboardClient (Agent B pattern)
        whileHover={
          shouldReduceMotion
            ? {}
            : {
                y: -8,
                scale: 1.025,
                boxShadow:
                  '0 24px 60px -8px rgba(29,180,210,0.38), 0 8px 24px -4px rgba(11,61,110,0.12)',
              }
        }
        transition={CARD_SPRING}
        style={{
          // 3D tilt — Agent C signature move
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          perspective: 1000,
          // Layout
          willChange: 'transform',
          minHeight: '360px',
          borderRadius: '19px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: '0 4px 16px -4px rgba(0,0,0,0.07)',
        }}
        className="group block"
      >
        {/* Inner glass sheen — subtle highlight at top of white card */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-30 pointer-events-none"
          style={{
            height: '80px',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Cyan top-edge accent bar — expands from center on hover (Agent C) */}
        <motion.div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 z-40 pointer-events-none"
          style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--orbit-cyan), transparent)',
            transformOrigin: 'center',
          }}
          animate={
            isHovered && !shouldReduceMotion
              ? { opacity: 1, scaleX: 1 }
              : { opacity: 0, scaleX: 0 }
          }
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />

        {/* ── IMAGE HERO (220px — Agent B value) ──────────────────────── */}
        <div
          className="relative overflow-hidden shrink-0"
          style={{ height: '220px' }}
          aria-hidden="true"
        >
          {image_url ? (
            // Image zooms on hover — spring physics (Agent B)
            <motion.div
              className="absolute inset-0"
              animate={{ scale: isHovered && !shouldReduceMotion ? 1.07 : 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            >
              <Image
                src={image_url}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={index < 3}
              />
            </motion.div>
          ) : (
            // No-image fallback: Orbit navy→cyan gradient with oversized initial letter
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, var(--orbit-navy) 0%, var(--orbit-cyan) 100%)',
              }}
            >
              <span
                className="font-black text-white select-none"
                style={{ fontSize: '7rem', opacity: 0.15, lineHeight: 1 }}
              >
                {firstLetter}
              </span>
            </div>
          )}

          {/* Brand color wash — ties any tool image to Orbit cyan palette (Agent A) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(29,180,210,0.08)', mixBlendMode: 'color' }}
          />

          {/* Gradient dissolve — image breathes into white card body (Agent B)
              No harsh clipPath diagonal. Smooth 90px gradient fade. */}
          <div
            className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
            style={{
              height: '90px',
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 65%, rgba(255,255,255,1) 100%)',
            }}
          />

          {/* Category badge — spring pop entrance with delay after card settles (Agent B) */}
          {category && (
            <motion.div
              initial={{ opacity: 0, scale: 0.72, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 480,
                damping: 28,
                delay: shouldReduceMotion ? 0 : index * 0.07 + 0.2,
              }}
              className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-white"
              style={{
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                background: 'rgba(29,180,210,0.22)',
                border: '1px solid rgba(29,180,210,0.4)',
                boxShadow: '0 0 12px rgba(29,180,210,0.2)',
              }}
            >
              {category}
            </motion.div>
          )}

          {/* Arrow indicator — rotates in from -45° to 0° on hover (Agent B) */}
          <motion.div
            className="absolute top-3 right-3 z-20 h-7 w-7 rounded-full flex items-center justify-center"
            animate={
              isHovered && !shouldReduceMotion
                ? { opacity: 1, scale: 1, rotate: 0 }
                : { opacity: 0, scale: 0.6, rotate: -45 }
            }
            transition={QUICK_SPRING}
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(29,180,210,0.28)',
              border: '1px solid rgba(29,180,210,0.45)',
            }}
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-white" />
          </motion.div>
        </div>

        {/* ── CARD BODY ────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 gap-3 px-4 pb-4 pt-2">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h2 className="font-bold text-base text-foreground leading-snug line-clamp-1">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* ── Launch button — gradient + shimmer + glow + arrow spring ─ */}
          <div className="mt-auto relative h-10 w-full rounded-full overflow-hidden">
            {/* Gradient background pill (Agent A/B) */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={
                isHovered && !shouldReduceMotion
                  ? { boxShadow: '0 8px 24px -4px rgba(29,180,210,0.55)', scale: 1.02 }
                  : { boxShadow: '0 4px 12px -4px rgba(29,180,210,0.30)', scale: 1 }
              }
              transition={CARD_SPRING}
              style={{
                background:
                  'linear-gradient(135deg, var(--orbit-cyan) 0%, var(--orbit-cyan-dark) 100%)',
              }}
            />
            {/* Inset top highlight — glassy depth */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            />
            {/* Shimmer sweep — fires once on hover (Agent A + C) */}
            <motion.div
              aria-hidden="true"
              className="absolute top-0 bottom-0 w-1/3 pointer-events-none z-10"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
              }}
              animate={isHovered ? { x: ['-100%', '400%'] } : { x: '-100%' }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
            {/* Button label + animated arrow */}
            <div className="relative z-20 flex items-center justify-center gap-2 h-full text-sm font-semibold text-white">
              <span>Launch</span>
              <motion.span
                animate={isHovered && !shouldReduceMotion ? { x: 4 } : { x: 0 }}
                transition={CARD_SPRING}
                className="inline-block"
              >
                →
              </motion.span>
            </div>
          </div>
        </div>
      </motion.a>
    </div>
  )
})
