'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LayoutGrid } from 'lucide-react'
import { ToolCard } from '@/components/employee/ToolCard'
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

// Header entrance animation variant (static reference avoids re-render allocations)
const headerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

// ── Component ──────────────────────────────────────────────────────────────

export function DashboardClient() {
  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools', 'mine'],
    queryFn: fetchMyTools,
    // Treat data as fresh for 30s so navigation back doesn't flicker
    staleTime: 30_000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={headerVariants} initial="hidden" animate="visible">
        <h1 className="text-2xl font-semibold text-foreground">My Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isLoading
            ? 'Loading your tools…'
            : (tools?.length ?? 0) > 0
              ? `You have access to ${tools!.length} tool${tools!.length === 1 ? '' : 's'}.`
              : 'Your tools will appear here once an admin assigns them to you.'}
        </p>
      </motion.div>

      {/* Loading state — skeleton grid matching real card shape */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (tools?.length ?? 0) === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center h-56 border border-dashed border-border rounded-xl bg-white gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <LayoutGrid className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No tools assigned yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              An admin will grant you access to tools — check back soon.
            </p>
          </div>
        </motion.div>
      )}

      {/* Tool grid */}
      {!isLoading && (tools?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools!.map((tool, index) => (
            <ToolCard
              key={tool.id}
              id={tool.id}
              title={tool.title}
              description={tool.description}
              url={tool.url}
              image_url={tool.image_url}
              category={tool.category}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
