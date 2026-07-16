import { SplitAuthLayout } from '@/components/auth/SplitAuthLayout'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <SplitAuthLayout>{children}</SplitAuthLayout>
}
