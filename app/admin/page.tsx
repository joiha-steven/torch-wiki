'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import AdminDashboard from './AdminDashboard'

export default function AdminPage() {
  const { user, loading, isAdmin, isModerator } = useAuth()
  const router = useRouter()
  const [mfaChecked, setMfaChecked] = useState(false)
  const [hasMfa, setHasMfa]         = useState(false)

  // Access is decided by the profiles flags (set in auth-context from the DB).
  // The bootstrap ADMIN_EMAIL match is enforced server-side in the API routes
  // only, so the admin email is never exposed in the client bundle.
  const hasAccess = isAdmin || isModerator

  useEffect(() => {
    if (!loading && !hasAccess) router.replace('/')
  }, [loading, hasAccess, router])

  // Check 2FA enrollment once access is confirmed
  useEffect(() => {
    if (!user || loading || !hasAccess) return
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.some(f => f.status === 'verified') ?? false
      setHasMfa(verified)
      setMfaChecked(true)
    })
  }, [user, loading, hasAccess])

  if (loading || !hasAccess) return null

  // Block access until 2FA check completes
  if (!mfaChecked) return null

  // Require 2FA enrolled
  if (!hasMfa) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-panel rounded-xl border border-line p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-2xl">🔐</div>
          <h1 className="font-bold text-ink">Two-factor authentication required</h1>
          <p className="text-sm text-ink-3">
            You must enable 2FA on your account before accessing the admin panel.
          </p>
          <button
            onClick={() => router.push('/account')}
            className="w-full bg-brand-500 hover:bg-brand-400 text-black font-medium text-sm py-2.5 rounded-lg"
          >
            Go to My Account
          </button>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}
