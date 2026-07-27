import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LayoutGrid } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ToolCard, cardEntranceVariants } from '@/components/employee/ToolCard'
import { ToolCardSkeleton } from '@/components/employee/ToolCardSkeleton'

interface AssignedTool {
  id: string
  title: string
  description: string | null
  url: string
  image_url: string | null
  category: string | null
}

async function fetchMyTools(): Promise<AssignedTool[]> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  // 1. Get tool IDs granted to current user
  const { data: accessRows, error: accessErr } = await supabase
    .from('tool_access')
    .select('tool_id')
    .eq('user_id', session.user.id)

  if (accessErr || !accessRows || accessRows.length === 0) return []

  const toolIds = accessRows.map((r) => r.tool_id)

  // 2. Fetch tools details
  const { data: tools, error: toolsErr } = await supabase
    .from('tools')
    .select('*')
    .in('id', toolIds)
    .eq('is_active', true)
    .order('title', { ascending: true })

  if (toolsErr || !tools) return []
  return tools as AssignedTool[]
}

const headerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
}

const skeletonGridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

export function DashboardPage() {
  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools', 'mine'],
    queryFn: fetchMyTools,
    staleTime: 30_000,
  })

  const toolCount = tools?.length ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div variants={headerVariants} initial="hidden" animate="visible" className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400">
            My Tools
          </span>
        </h1>
        <p className="text-slate-400 text-sm">
          {isLoading
            ? 'Loading your tools…'
            : toolCount > 0
              ? `You have access to ${toolCount} tool${toolCount === 1 ? '' : 's'}.`
              : 'Your tools will appear here once an admin assigns them to you.'}
        </p>
      </motion.div>

      {/* Loading state */}
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

      {/* Empty state */}
      {!isLoading && toolCount === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center gap-6 rounded-2xl p-8"
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
                'linear-gradient(135deg, #0B3D6E 0%, #1DB4D2 100%)',
              boxShadow: '0 0 32px rgba(29,180,210,0.25)',
            }}
          >
            <LayoutGrid className="h-7 w-7 text-white" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-100">No tools assigned yet</p>
            <p className="text-xs text-slate-400">
              An admin will grant you access to tools — check back soon.
            </p>
          </div>
        </motion.div>
      )}

      {/* Tool grid */}
      {!isLoading && toolCount > 0 && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {tools!.map((tool, index) => (
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
