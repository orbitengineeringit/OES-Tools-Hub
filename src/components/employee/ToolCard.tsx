import { memo, useRef, useState } from 'react'
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
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  const firstLetter = title[0]?.toUpperCase() ?? '?'

  return (
    <motion.a
      ref={cardRef}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${title}`}
      onHoverStart={() => !shouldReduceMotion && setIsHovered(true)}
      onHoverEnd={handleHoverEnd}
      onMouseMove={handleMouseMove}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -8,
              scale: 1.02,
              boxShadow:
                '0 20px 40px -8px rgba(0,0,0,0.1), 0 8px 16px -4px rgba(29,180,210,0.12)',
            }
      }
      transition={CARD_SPRING}
      style={{
        rotateX: shouldReduceMotion ? 0 : rotateX,
        rotateY: shouldReduceMotion ? 0 : rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        willChange: 'transform',
      }}
      className="group flex flex-col relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm cursor-pointer min-h-[360px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-30 pointer-events-none"
        style={{
          height: '80px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
        }}
      />

        <motion.div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 z-40 pointer-events-none"
          style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #1DB4D2, transparent)',
            transformOrigin: 'center',
          }}
          animate={
            isHovered && !shouldReduceMotion
              ? { opacity: 1, scaleX: 1 }
              : { opacity: 0, scaleX: 0 }
          }
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />

        <div
          className="relative overflow-hidden shrink-0"
          style={{ height: '220px' }}
          aria-hidden="true"
        >
          {image_url ? (
            <motion.div
              className="absolute inset-0"
              animate={{ scale: isHovered && !shouldReduceMotion ? 1.07 : 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            >
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, #0B3D6E 0%, #1DB4D2 100%)',
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

          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(29,180,210,0.08)', mixBlendMode: 'color' }}
          />

          <div
            className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
            style={{
              height: '90px',
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 65%, rgba(255,255,255,1) 100%)',
            }}
          />

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

        <div className="flex flex-col flex-1 gap-3 px-4 pb-4 pt-2">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h2 className="font-bold text-base text-slate-900 leading-snug line-clamp-1">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>

          <div className="mt-auto relative h-10 w-full rounded-full overflow-hidden">
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
                  'linear-gradient(135deg, #1DB4D2 0%, #158FAA 100%)',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            />
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
  )
})
