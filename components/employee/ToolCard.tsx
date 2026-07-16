'use client'

import { memo } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ToolCardProps {
  id: string
  title: string
  description?: string | null
  url: string
  image_url?: string | null
  category?: string | null
  // Animation index used by the parent grid to stagger card entrances
  index?: number
}

export const ToolCard = memo(function ToolCard({
  title,
  description,
  url,
  image_url,
  category,
  index = 0,
}: ToolCardProps) {
  const shouldReduceMotion = useReducedMotion()

  // Entrance animation: fade + slight upward slide, staggered by index (UI_GUIDELINES.md §5)
  const entranceVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: 'easeOut' as const,
        delay: shouldReduceMotion ? 0 : index * 0.05,
      },
    },
  }

  // Hover: lift 2px + stronger shadow, 150ms ease-out (UI_GUIDELINES.md §5)
  // Only transform/opacity are animated — never width/height (performance rule)
  const hoverAnimation = shouldReduceMotion
    ? {}
    : { y: -2, boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)' }

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${title}`}
      // Entrance
      variants={entranceVariants}
      initial="hidden"
      animate="visible"
      // Hover lift
      whileHover={hoverAnimation}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="group flex flex-col gap-3 bg-white rounded-xl border border-border p-4 hover:border-primary/40 cursor-pointer"
      style={{ willChange: 'transform' }}
    >
      {/* Header: thumbnail + external link icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
          {image_url ? (
            <Image
              src={image_url}
              alt={title}
              width={40}
              height={40}
              sizes="40px"
              className="object-cover h-full w-full"
            />
          ) : (
            <span className="text-muted-foreground font-semibold text-sm">
              {title[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
      </div>

      {/* Title + description */}
      <div className="space-y-1 min-w-0">
        <h2 className="font-semibold text-sm text-foreground leading-snug line-clamp-1">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Category badge */}
      {category && (
        <div className="mt-auto">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>
      )}
    </motion.a>
  )
})
