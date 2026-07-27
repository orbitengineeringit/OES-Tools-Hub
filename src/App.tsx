import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { SplitAuthLayout } from '@/components/auth/SplitAuthLayout'
import { EmployeeLayout } from '@/layouts/EmployeeLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

// Lazy-loaded routes for code splitting
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage').then(m => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const AuthCallbackPage = lazy(() => import('@/pages/auth/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })))

const DashboardPage = lazy(() => import('@/pages/employee/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProfilePage = lazy(() => import('@/pages/employee/ProfilePage').then(m => ({ default: m.ProfilePage })))

const AdminToolsPage = lazy(() => import('@/pages/admin/AdminToolsPage').then(m => ({ default: m.AdminToolsPage })))
const AdminEmployeesPage = lazy(() => import('@/pages/admin/AdminEmployeesPage').then(m => ({ default: m.AdminEmployeesPage })))
const AdminAccessPage = lazy(() => import('@/pages/admin/AdminAccessPage').then(m => ({ default: m.AdminAccessPage })))
const AdminAuditLogPage = lazy(() => import('@/pages/admin/AdminAuditLogPage').then(m => ({ default: m.AdminAuditLogPage })))

function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[#1DB4D2]" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  )
}
