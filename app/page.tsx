import { redirect } from 'next/navigation'

// The app is always behind login (PRD.md Section 6: no public pages).
// Root route redirects to login; authenticated flows start from /login → /dashboard.
export default function RootPage() {
  redirect('/login')
}
