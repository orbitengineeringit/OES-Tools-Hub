'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LayoutGrid } from 'lucide-react'
import { ToolCard, cardEntranceVariants } from '@/components/employee/ToolCard'
import { ToolCardSkeleton } from '@/components/employee/ToolCardSkeleton'

// ── Types ──────────────────────────────────────────────────────────────────

interface AssignedTool {
  id: string
  title: string
  description: string | null
  url: string
  image_url: string | null
  category: string | null
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function fetchMyTools(): Promise<AssignedTool[]> {
  const res = await fetch('/api/tools/mine')
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch tools')
  return json.data as AssignedTool[]
}

// ── Animation variants (static refs — preserve reference equality) ─────────

const headerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

// Parent grid orchestrates stagger — each card inherits cardEntranceVariants (Agent B pattern)
const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
}

// Skeleton grid — simple fade in
const skeletonGridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

// ── Component ──────────────────────────────────────────────────────────────

export function DashboardClient() {
  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools', 'mine'],
    queryFn: fetchMyTools,
    // Treat data as fresh for 30s so navigation back doesn't flicker
    staleTime: 30_000,
  })

  const toolCount = tools?.length ?? 0

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div variants={headerVariants} initial="hidden" animate="visible" className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          <span
            style={{
              background: 'linear-gradient(135deg, var(--foreground) 0%, var(--orbit-cyan) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            My Tools
          </span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {isLoading
            ? 'Loading your tools…'
            : toolCount > 0
              ? `You have access to ${toolCount} tool${toolCount === 1 ? '' : 's'}.`
              : 'Your tools will appear here once an admin assigns them to you.'}
        </p>
      </motion.div>

      {/* ── Loading state — skeleton grid matching real card shape ─────── */}
      {isLoading && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={skeletonGridVariants}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </motion.div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!isLoading && toolCount === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center gap-6 rounded-2xl"
          style={{
            minHeight: '320px',
            border: '1px dashed rgba(29,180,210,0.25)',
            background: 'rgba(29,180,210,0.03)',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, var(--orbit-navy) 0%, var(--orbit-cyan) 100%)',
              boxShadow: '0 0 32px rgba(29,180,210,0.25)',
            }}
          >
            <LayoutGrid className="h-7 w-7 text-white" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">No tools assigned yet</p>
            <p className="text-xs text-muted-foreground">
              An admin will grant you access to tools — check back soon.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Tool grid — parent orchestrates stagger, each card inherits variants ── */}
      {!isLoading && toolCount > 0 && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {tools!.map((tool, index) => (
            // motion.div wrapper owns the entrance animation (cardEntranceVariants)
            // ToolCard itself only handles hover + 3D tilt — clean separation
            <motion.div key={tool.id} variants={cardEntranceVariants}>
              <ToolCard
                id={tool.id}
                title={tool.title}
                description={tool.description}
                url={tool.url}
                image_url={tool.image_url}
                category={tool.category}
                index={index}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
