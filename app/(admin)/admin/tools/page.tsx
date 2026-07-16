'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ExternalLink, ImagePlus, Loader2 } from 'lucide-react'
import { TableRowSkeleton } from '@/components/admin/TableRowSkeleton'

import { type Tool, type ToolCreate } from '@/lib/validation/tool'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ToolForm } from '@/components/forms/ToolForm'

// ────────────────────────────────────────────────────────────
// API helpers
// ────────────────────────────────────────────────────────────

async function fetchTools(): Promise<Tool[]> {
  const res = await fetch('/api/admin/tools')
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch tools')
  return json.data as Tool[]
}

async function createTool(values: ToolCreate): Promise<Tool> {
  const res = await fetch('/api/admin/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to create tool')
  return json.data as Tool
}

async function updateTool({ id, values }: { id: string; values: ToolCreate }): Promise<Tool> {
  const res = await fetch(`/api/admin/tools/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to update tool')
  return json.data as Tool
}

async function apiDeleteTool(id: string): Promise<void> {
  const res = await fetch(`/api/admin/tools/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to delete tool')
}

// ────────────────────────────────────────────────────────────
// Image upload button (per-row inline)
// ────────────────────────────────────────────────────────────

function ToolImageUpload({ toolId, onUploaded }: { toolId: string; onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG or WebP allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5 MB or smaller.')
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/admin/tools/${toolId}/image`, { method: 'POST', body: fd })
    const json = await res.json()
    setUploading(false)
    e.target.value = ''
    if (!json.success) {
      toast.error(json.error?.message ?? 'Upload failed.')
      return
    }
    toast.success('Image updated.')
    onUploaded()
  }

  return (
    <label className="cursor-pointer" title="Upload image">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
        disabled={uploading}
        aria-label={`Upload image for tool ${toolId}`}
      />
      {uploading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <ImagePlus className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
      )}
    </label>
  )
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function AdminToolsPage() {
  const queryClient = useQueryClient()

  // Dialog state — renamed to avoid shadowing API function names
  const [createOpen, setCreateOpen] = useState(false)
  const [toolToEdit, setToolToEdit] = useState<Tool | null>(null)
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null)

  // Data fetching
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['admin', 'tools'],
    queryFn: fetchTools,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
      setCreateOpen(false)
      toast.success('Tool created — use the image icon in the row to add a cover image.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: updateTool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
      setToolToEdit(null)
      toast.success('Tool updated.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: apiDeleteTool,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tools</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage the tools available to your team.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add tool
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
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
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-muted-foreground text-sm">No tools yet.</p>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add your first tool
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
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
                  {/* Thumbnail */}
                  <TableCell>
                    <div className="h-9 w-9 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                      {tool.image_url ? (
                        <Image
                          src={tool.image_url}
                          alt={tool.title}
                          width={36}
                          height={36}
                          sizes="36px"
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs font-medium">
                          {tool.title[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Title + URL */}
                  <TableCell>
                    <div className="font-medium text-sm">{tool.title}</div>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 mt-0.5 w-fit"
                    >
                      {new URL(tool.url).hostname}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="hidden md:table-cell">
                    {tool.category ? (
                      <Badge variant="secondary">{tool.category}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={tool.is_active ? 'default' : 'secondary'}>
                      {tool.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ToolImageUpload toolId={tool.id} onUploaded={invalidateTools} />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setToolToEdit(tool)}
                        title="Edit"
                        aria-label={`Edit ${tool.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setToolToDelete(tool)}
                        title="Delete"
                        aria-label={`Delete ${tool.title}`}
                        className="text-destructive hover:text-destructive"
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add tool</DialogTitle>
          </DialogHeader>
          <ToolForm
            isSubmitting={createMutation.isPending}
            onSubmit={(values) => createMutation.mutateAsync(values)}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!toolToEdit} onOpenChange={(open) => !open && setToolToEdit(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit tool</DialogTitle>
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

      {/* Delete confirmation */}
      <AlertDialog open={!!toolToDelete} onOpenChange={(open) => !open && setToolToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{toolToDelete?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the tool and all employee access grants for it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToolToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toolToDelete && deleteMutation.mutate(toolToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
