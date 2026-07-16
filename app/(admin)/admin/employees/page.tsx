import { EmployeeTable } from '@/components/admin/EmployeeTable'

export default function AdminEmployeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          All employee accounts registered in the system.
        </p>
      </div>
      <EmployeeTable />
    </div>
  )
}
