'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import AdminDashboard from './AdminDashboard'

const ADMIN_EMAIL = 'hung.tran@joiha.com'

export default function AdminRootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace('/')
    }
  }, [user, loading, router])

  if (loading) return null
  if (!user || user.email !== ADMIN_EMAIL) return null

  return <AdminDashboard />
}
