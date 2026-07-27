import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { type Tool, type ToolCreate } from '@/lib/validation/tool'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableRowSkeleton } from '@/components/admin/TableRowSkeleton'
import { ToolForm } from '@/components/forms/ToolForm'

async function fetchTools(): Promise<Tool[]> {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Tool[]
}

async function createTool(values: ToolCreate): Promise<Tool> {
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('tools')
    .insert({
      ...values,
      created_by: session?.user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Tool
}

async function updateTool({ id, values }: { id: string; values: ToolCreate }): Promise<Tool> {
  const { data, error } = await supabase
    .from('tools')
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Tool
}

async function deleteTool(id: string): Promise<void> {
  const { error } = await supabase
    .from('tools')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

function safeHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname
  } catch {
    return urlStr
  }
}

export function AdminToolsPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [toolToEdit, setToolToEdit] = useState<Tool | null>(null)
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null)

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['admin', 'tools'],
    queryFn: fetchTools,
  })

  const createMutation = useMutation({
    mutationFn: createTool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
      setCreateOpen(false)
      toast.success('Tool created successfully.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: updateTool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
      setToolToEdit(null)
      toast.success('Tool updated successfully.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
      setToolToDelete(null)
      toast.success('Tool deleted.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function invalidateTools() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tools</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage the tools available to your team.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 text-white font-semibold cursor-pointer shadow-xs"
          style={{ background: 'linear-gradient(135deg, #1DB4D2 0%, #158FAA 100%)' }}
        >
          <Plus className="h-4 w-4" />
          Add tool
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableRowSkeleton rows={5} cols={5} />
          </Table>
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 p-6">
            <p className="text-slate-500 text-sm">No tools yet.</p>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 border-slate-300">
              <Plus className="h-3.5 w-3.5" />
              Add your first tool
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell>
                    <div className="h-9 w-9 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                      {tool.image_url ? (
                        <img
                          src={tool.image_url}
                          alt={tool.title}
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <span className="text-slate-500 text-xs font-semibold">
                          {tool.title[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-semibold text-sm text-slate-900">{tool.title}</div>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1DB4D2] hover:underline flex items-center gap-0.5 mt-0.5 w-fit"
                    >
                      {safeHostname(tool.url)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {tool.category ? (
                      <Badge variant="secondary" className="text-slate-700 bg-slate-100 border-slate-200">{tool.category}</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={tool.is_active ? 'default' : 'secondary'} className={tool.is_active ? 'bg-[#1DB4D2]/15 text-[#158FAA] border-[#1DB4D2]/30' : ''}>
                      {tool.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setToolToEdit(tool)}
                        title="Edit"
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setToolToDelete(tool)}
                        title="Delete"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Add tool</DialogTitle>
          </DialogHeader>
          <ToolForm
            isSubmitting={createMutation.isPending}
            onSubmit={(values) => createMutation.mutateAsync(values)}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!toolToEdit} onOpenChange={(open) => !open && setToolToEdit(null)}>
        <DialogContent className="sm:max-w-lg bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Edit tool</DialogTitle>
          </DialogHeader>
          {toolToEdit && (
            <ToolForm
              tool={toolToEdit}
              isSubmitting={updateMutation.isPending}
              onSubmit={(values) => updateMutation.mutateAsync({ id: toolToEdit.id, values })}
              onCancel={() => setToolToEdit(null)}
              onImageUploaded={invalidateTools}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toolToDelete} onOpenChange={(open) => !open && setToolToDelete(null)}>
        <AlertDialogContent className="bg-white text-slate-900 border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 font-bold">Delete &ldquo;{toolToDelete?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will permanently remove the tool and all employee access grants for it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToolToDelete(null)} className="border-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toolToDelete && deleteMutation.mutate(toolToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700 font-semibold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
