'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import AdminDashboard from './AdminDashboard'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ''

export default function AdminRootPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  // isAdmin (from profiles.is_admin) is primary; email fallback for bootstrapping
  const hasAccess = isAdmin || (!!ADMIN_EMAIL && user?.email === ADMIN_EMAIL)

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.replace('/')
    }
  }, [loading, hasAccess, router])

  if (loading) return null
  if (!hasAccess) return null

  return <AdminDashboard />
}
