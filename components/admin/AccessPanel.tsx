'use client'

import { useState, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface Employee {
  id: string
  full_name: string | null
  email?: string | null
  photo_url: string | null
  department: string | null
  role: 'admin' | 'employee'
  is_active: boolean
}

interface Tool {
  id: string
  title: string
  category: string | null
  is_active: boolean
}

interface Grant {
  id: string
  tool_id: string
  user_id: string
}

// ────────────────────────────────────────────────────────────
// API helpers
// ────────────────────────────────────────────────────────────

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch('/api/admin/employees')
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch employees')
  return json.data as Employee[]
}

async function fetchAllTools(): Promise<Tool[]> {
  const res = await fetch('/api/admin/tools')
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch tools')
  return json.data as Tool[]
}

async function fetchGrants(userId: string): Promise<Grant[]> {
  const res = await fetch(`/api/admin/access?user_id=${userId}`)
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch grants')
  return json.data as Grant[]
}

async function grantAccess(toolId: string, userId: string): Promise<Grant> {
  const res = await fetch('/api/admin/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool_id: toolId, user_id: userId }),
  })
  if (!res.ok && res.status !== 409) throw new Error(`HTTP Error ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to grant access')
  return json.data as Grant
}

async function revokeAccess(grantId: string): Promise<void> {
  const res = await fetch(`/api/admin/access/${grantId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to revoke access')
}
// ────────────────────────────────────────────────────────────
// Tool checklist row
// ────────────────────────────────────────────────────────────

interface ToolRowProps {
  tool: Tool
  grant: Grant | undefined
  userId: string
  onGrant: (toolId: string, userId: string) => void
  onRevoke: (grantId: string) => void
  disabled: boolean
}

const ToolRow = memo(function ToolRow({ tool, grant, userId, onGrant, onRevoke, disabled }: ToolRowProps) {
  const checked = !!grant

  function toggle() {
    if (disabled) return
    if (checked && grant) {
      onRevoke(grant.id)
    } else {
      onGrant(tool.id, userId)
    }
  }

  return (
    <label
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer select-none transition-colors ${
        checked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        disabled={disabled}
        className="h-4 w-4 rounded accent-primary"
        aria-label={`${checked ? 'Revoke' : 'Grant'} access to ${tool.title}`}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{tool.title}</span>
        {tool.category && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {tool.category}
          </Badge>
        )}
      </div>
      {checked && (
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-label="Access granted" />
      )}
    </label>
  )
})

// ────────────────────────────────────────────────────────────
// Main AccessPanel
// ────────────────────────────────────────────────────────────

export function AccessPanel() {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['admin', 'employees'],
    queryFn: fetchEmployees,
  })

  const { data: allTools = [], isLoading: loadingTools } = useQuery({
    queryKey: ['admin', 'tools'],
    queryFn: fetchAllTools,
  })

  const { data: grants = [], isLoading: loadingGrants } = useQuery({
    queryKey: ['admin', 'access', selectedUserId],
    queryFn: () => fetchGrants(selectedUserId),
    enabled: !!selectedUserId,
  })

  const grantMutation = useMutation({
    mutationFn: ({ toolId, userId }: { toolId: string; userId: string }) =>
      grantAccess(toolId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access', selectedUserId] })
      toast.success('Access granted.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const revokeMutation = useMutation({
    mutationFn: revokeAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access', selectedUserId] })
      toast.success('Access revoked.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isMutating = grantMutation.isPending || revokeMutation.isPending

  const selectedEmployee = employees.find((e) => e.id === selectedUserId)
  const activeTools = allTools.filter((t) => t.is_active)

  // Build a quick lookup: tool_id → grant
  const grantByToolId = new Map(grants.map((g) => [g.tool_id, g]))

  return (
    <div className="space-y-6">
      {/* Employee selector */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Select an employee</p>
        {loadingEmployees ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading employees…
          </div>
        ) : (
          <Select value={selectedUserId} onValueChange={(val) => setSelectedUserId(val ?? '')}>
            <SelectTrigger className="w-full sm:w-72" id="access-employee-select">
              {/* Render label explicitly — Radix SelectValue mirrors the portal item's text
                  but the portal unmounts when closed, causing the trigger to fall back to
                  displaying the raw `value` (UUID). Compute the display string ourselves. */}
              {selectedUserId && selectedEmployee ? (
                <span className="truncate">
                  {selectedEmployee.full_name
                    ?? selectedEmployee.email
                    ?? selectedEmployee.id}
                  {!selectedEmployee.is_active && ' (inactive)'}
                </span>
              ) : (
                <SelectValue placeholder="Choose employee…" />
              )}
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name ?? emp.email ?? emp.id}
                  {!emp.is_active && ' (inactive)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tool checklist for selected employee */}
      {selectedUserId && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
            {selectedEmployee && (
              <>
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={selectedEmployee.photo_url ?? undefined}
                    alt={selectedEmployee.full_name ?? 'Employee'}
                  />
                  <AvatarFallback className="text-xs">
                    {(selectedEmployee.full_name ?? '?')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{selectedEmployee.full_name ?? '—'}</span>
                <span className="text-xs text-muted-foreground">
                  — {grants.length} of {activeTools.length} tools granted
                </span>
              </>
            )}
            {isMutating && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />
            )}
          </div>

          {/* Tool list */}
          {loadingGrants || loadingTools ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeTools.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">No active tools to assign.</p>
            </div>
          ) : (
            <div className="py-2">
              {activeTools.map((tool) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  grant={grantByToolId.get(tool.id)}
                  userId={selectedUserId}
                  onGrant={(toolId, userId) => grantMutation.mutate({ toolId, userId })}
                  onRevoke={(grantId) => revokeMutation.mutate(grantId)}
                  disabled={isMutating}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state — no employee selected */}
      {!selectedUserId && !loadingEmployees && (
        <div className="flex flex-col items-center justify-center h-40 border border-dashed border-border rounded-xl bg-white gap-2">
          <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Select an employee to manage their tool access.</p>
        </div>
      )}
    </div>
  )
}
