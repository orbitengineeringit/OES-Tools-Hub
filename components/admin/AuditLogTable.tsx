'use client'

import { useState, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
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
  actor: { id: string; full_name: string | null } | null
}

interface AuditLogPage {
  items: AuditLogEntry[]
  total: number
  page: number
  limit: number
}

async function fetchAuditLog(page: number, limit: number): Promise<AuditLogPage> {
  const res = await fetch(`/api/admin/audit-log?page=${page}&limit=${limit}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch audit log')
  return json.data as AuditLogPage
}

const ACTION_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  'tool.created': 'default',
  'tool.updated': 'secondary',
  'tool.deleted': 'destructive',
  'access.granted': 'default',
  'access.revoked': 'destructive',
  'employee.deactivated': 'destructive',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const PAGE_SIZE = 20

export const AuditLogTable = memo(function AuditLogTable() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log', page],
    queryFn: () => fetchAuditLog(page, PAGE_SIZE),
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (data?.items ?? []).length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground text-sm">No audit entries yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.actor?.full_name ?? <span className="text-muted-foreground">Unknown</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_COLORS[entry.action] ?? 'secondary'}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.target ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">Page {page} / {totalPages}</span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})
