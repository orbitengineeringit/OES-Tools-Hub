import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Employee {
  id: string
  full_name: string | null
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

async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, department, role, is_active')
    .order('full_name', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Employee[]
}

async function fetchAllTools(): Promise<Tool[]> {
  const { data, error } = await supabase
    .from('tools')
    .select('id, title, category, is_active')
    .order('title', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Tool[]
}

async function fetchGrants(userId: string): Promise<Grant[]> {
  const { data, error } = await supabase
    .from('tool_access')
    .select('id, tool_id, user_id')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data as Grant[]
}

async function grantAccess(toolId: string, userId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const { error } = await supabase
    .from('tool_access')
    .insert({
      tool_id: toolId,
      user_id: userId,
      granted_by: session?.user.id,
    })

  if (error) throw new Error(error.message)

  if (session?.user.id) {
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'grant_access',
      target_type: 'tool_access',
      target_id: toolId,
      details: { tool_id: toolId, target_user_id: userId },
    })
  }
}

async function revokeAccess(grantId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const { error } = await supabase
    .from('tool_access')
    .delete()
    .eq('id', grantId)

  if (error) throw new Error(error.message)

  if (session?.user.id) {
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'revoke_access',
      target_type: 'tool_access',
      target_id: grantId,
      details: { grant_id: grantId },
    })
  }
}

export function AdminAccessPage() {
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
    mutationFn: ({ toolId, userId }: { toolId: string; userId: string }) => grantAccess(toolId, userId),
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
  const grantByToolId = useMemo(() => new Map(grants.map((g) => [g.tool_id, g])), [grants])

  const handleGrant = useCallback((toolId: string, userId: string) => {
    grantMutation.mutate({ toolId, userId })
  }, [grantMutation])

  const handleRevoke = useCallback((grantId: string) => {
    revokeMutation.mutate(grantId)
  }, [revokeMutation])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Access Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Grant or revoke tool access for individual employees.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <p className="text-sm font-semibold text-slate-900">Select an employee</p>
        {loadingEmployees ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading employees…
          </div>
        ) : (
          <Select value={selectedUserId} onValueChange={(val) => setSelectedUserId(val ?? '')}>
            <SelectTrigger className="w-full sm:w-72 bg-white border-slate-300 text-slate-900">
              {selectedUserId && selectedEmployee ? (
                <span className="truncate">
                  {selectedEmployee.full_name ?? selectedEmployee.id}
                  {!selectedEmployee.is_active && ' (inactive)'}
                </span>
              ) : (
                <SelectValue placeholder="Choose employee…" />
              )}
            </SelectTrigger>
            <SelectContent className="bg-white text-slate-900 border-slate-200">
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name ?? emp.id}
                  {!emp.is_active && ' (inactive)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedUserId && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
            {selectedEmployee && (
              <>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={selectedEmployee.photo_url ?? undefined} alt={selectedEmployee.full_name ?? 'Employee'} />
                  <AvatarFallback className="text-xs font-bold text-white bg-[#0B3D6E]">
                    {(selectedEmployee.full_name ?? '?')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-slate-900">{selectedEmployee.full_name ?? '—'}</span>
                <span className="text-xs text-slate-500">
                  — {grants.length} of {activeTools.length} tools granted
                </span>
              </>
            )}
            {isMutating && <Loader2 className="h-4 w-4 animate-spin text-[#1DB4D2] ml-auto" />}
          </div>

          {loadingGrants || loadingTools ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : activeTools.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-slate-500">No active tools to assign.</p>
            </div>
          ) : (
            <div className="py-2">
              {activeTools.map((tool) => {
                const grant = grantByToolId.get(tool.id)
                const checked = !!grant

                return (
                  <label
                    key={tool.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
                      checked ? 'bg-[#1DB4D2]/10' : 'hover:bg-slate-50'
                    } ${isMutating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isMutating}
                      onChange={() => {
                        if (isMutating) return
                        if (checked && grant) {
                          handleRevoke(grant.id)
                        } else {
                          handleGrant(tool.id, selectedUserId)
                        }
                      }}
                      className="h-4 w-4 rounded accent-[#1DB4D2] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-900">{tool.title}</span>
                      {tool.category && (
                        <Badge variant="outline" className="ml-2 text-xs border-slate-200 text-slate-700 bg-slate-100">
                          {tool.category}
                        </Badge>
                      )}
                    </div>
                    {checked && <ShieldCheck className="h-4 w-4 text-[#1DB4D2] shrink-0" />}
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!selectedUserId && !loadingEmployees && (
        <div className="flex flex-col items-center justify-center h-40 border border-dashed border-slate-300 rounded-xl bg-white gap-2 shadow-xs">
          <ShieldCheck className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">Select an employee to manage their tool access.</p>
        </div>
      )}
    </div>
  )
}
