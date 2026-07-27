import { Routes, Route, Navigate } from 'react-router-dom'
import { SplitAuthLayout } from '@/components/auth/SplitAuthLayout'
import { EmployeeLayout } from '@/layouts/EmployeeLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage'

import { DashboardPage } from '@/pages/employee/DashboardPage'
import { ProfilePage } from '@/pages/employee/ProfilePage'

import { AdminToolsPage } from '@/pages/admin/AdminToolsPage'
import { AdminEmployeesPage } from '@/pages/admin/AdminEmployeesPage'
import { AdminAccessPage } from '@/pages/admin/AdminAccessPage'
import { AdminAuditLogPage } from '@/pages/admin/AdminAuditLogPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth routes */}
      <Route path="/login" element={<SplitAuthLayout><LoginPage /></SplitAuthLayout>} />
      <Route path="/signup" element={<SplitAuthLayout><SignupPage /></SplitAuthLayout>} />
      <Route path="/forgot-password" element={<SplitAuthLayout><ForgotPasswordPage /></SplitAuthLayout>} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Employee routes */}
      <Route path="/dashboard" element={<EmployeeLayout><DashboardPage /></EmployeeLayout>} />
      <Route path="/profile" element={<EmployeeLayout><ProfilePage /></EmployeeLayout>} />

      {/* Admin routes */}
      <Route path="/admin/tools" element={<AdminLayout><AdminToolsPage /></AdminLayout>} />
      <Route path="/admin/employees" element={<AdminLayout><AdminEmployeesPage /></AdminLayout>} />
      <Route path="/admin/access" element={<AdminLayout><AdminAccessPage /></AdminLayout>} />
      <Route path="/admin/audit-log" element={<AdminLayout><AdminAuditLogPage /></AdminLayout>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
