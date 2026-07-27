import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AuditLogEntry {
  id: string
  action: string
  target: string | null
  meta: Record<string, unknown> | null
  created_at: string
  actor_id: string
  actor_name?: string
}

interface AuditLogPage {
  items: AuditLogEntry[]
  total: number
}

const PAGE_SIZE = 20

async function fetchAuditLog(page: number): Promise<AuditLogPage> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, count, error } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  const items = data as AuditLogEntry[]
  const actorIds = Array.from(new Set(items.map((i) => i.actor_id).filter(Boolean)))

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', actorIds)

    const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? [])
    items.forEach((item) => {
      item.actor_name = profileMap.get(item.actor_id) ?? 'Admin'
    })
  }

  return {
    items,
    total: count ?? items.length,
  }
}

const ACTION_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  'tool.created': 'default',
  'tool.updated': 'secondary',
  'tool.deleted': 'destructive',
  'grant_access': 'default',
  'revoke_access': 'destructive',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function AdminAuditLogPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log', page],
    queryFn: () => fetchAuditLog(page),
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Log</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Read-only history of administrative actions.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (data?.items ?? []).length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-slate-500 text-sm">No audit entries yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900">
                    {entry.actor_name ?? <span className="text-slate-400">Admin</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_COLORS[entry.action] ?? 'secondary'}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {entry.target ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-slate-300 text-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">Page {page} / {totalPages}</span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-slate-300 text-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
