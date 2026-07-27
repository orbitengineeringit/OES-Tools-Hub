import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableRowSkeleton } from '@/components/admin/TableRowSkeleton'

interface Employee {
  id: string
  full_name: string | null
  photo_url: string | null
  department: string | null
  designation: string | null
  role: 'admin' | 'employee'
  is_active: boolean
  created_at: string
}

async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, department, designation, role, is_active, created_at')
    .order('full_name', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Employee[]
}

export function AdminEmployeesPage() {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['admin', 'employees'],
    queryFn: fetchEmployees,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Employees</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          All employee accounts registered in the system.
        </p>
      </div>

      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Designation</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableRowSkeleton rows={5} cols={5} />
          </Table>
        ) : employees.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-slate-400 text-sm">No employee profiles yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Designation</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => {
                const initials = (emp.full_name ?? '?')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={emp.photo_url ?? undefined} alt={emp.full_name ?? 'Employee'} />
                          <AvatarFallback className="text-xs font-bold text-white bg-slate-800">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold text-slate-100">{emp.full_name ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-400">
                      {emp.department ?? '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-slate-400">
                      {emp.designation ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.role === 'admin' ? 'default' : 'secondary'} className={emp.role === 'admin' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : ''}>
                        {emp.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.is_active ? 'default' : 'destructive'} className={emp.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : ''}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
