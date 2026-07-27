import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { LayoutGrid } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ToolCard, cardEntranceVariants } from '@/components/employee/ToolCard'
import { ToolCardSkeleton } from '@/components/employee/ToolCardSkeleton'

interface ToolAccessJoin {
  tool_id: string
  tools: {
    id: string
    title: string
    description: string | null
    url: string
    image_url: string | null
    category: string | null
    is_active: boolean
  } | null
}

async function fetchMyTools() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user.id) return []

  const { data, error } = await supabase
    .from('tool_access')
    .select(`
      tool_id,
      tools (
        id,
        title,
        description,
        url,
        image_url,
        category,
        is_active
      )
    `)
    .eq('user_id', session.user.id)

  if (error) throw new Error(error.message)
  
  const rawList = (data as unknown as ToolAccessJoin[]) ?? []
  return rawList
    .map((item) => item.tools)
    .filter((tool): tool is NonNullable<typeof tool> => tool !== null && tool.is_active)
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
}

export function DashboardPage() {
  const shouldReduceMotion = useReducedMotion()
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['employee', 'tools'],
    queryFn: fetchMyTools,
  })

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="space-y-1">
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #0B3D6E 0%, #1DB4D2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          My Tools
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Access your assigned tools and internal software hub.
        </p>
      </div>

      {/* Tools Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center h-64 rounded-3xl p-8 text-center"
          style={{
            background: 'rgba(29,180,210,0.03)',
            border: '1px dashed rgba(29,180,210,0.25)',
          }}
        >
          <div
            className="p-4 rounded-2xl mb-3"
            style={{
              background: 'rgba(29,180,210,0.1)',
              color: '#1DB4D2',
            }}
          >
            <LayoutGrid className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No tools assigned yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            You don&apos;t have access to any tools right now. Please contact your IT administrator to grant tool permissions.
          </p>
        </div>
      ) : (
        <motion.div
          variants={shouldReduceMotion ? undefined : gridVariants}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {tools.map((tool, index) => (
            <motion.div key={tool.id} variants={shouldReduceMotion ? undefined : cardEntranceVariants}>
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
