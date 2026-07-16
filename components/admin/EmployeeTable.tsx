'use client'

import { memo } from 'react'
import { useQuery } from '@tanstack/react-query'

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
  const res = await fetch('/api/admin/employees')
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch employees')
  return json.data as Employee[]
}

export const EmployeeTable = memo(function EmployeeTable() {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['admin', 'employees'],
    queryFn: fetchEmployees,
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-border overflow-hidden">
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
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-white rounded-xl border border-border">
        <p className="text-muted-foreground text-sm">No employee profiles yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
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
                      <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{emp.full_name ?? '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {emp.department ?? '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {emp.designation ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={emp.role === 'admin' ? 'default' : 'secondary'}>
                    {emp.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={emp.is_active ? 'default' : 'destructive'}>
                    {emp.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
})
