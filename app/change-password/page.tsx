'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: current,
    })
    if (signInError) { setError('Current password is incorrect'); setLoading(false); return }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Please sign in first.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 w-full max-w-sm p-6">
        <Link href="/" className="block text-base font-bold mb-6" style={{ color: '#eba00b' }}>
          <span style={{ color: '#eba00b' }}>torch.</span><span className="text-white">EDC.wiki</span>
        </Link>

        <h1 className="text-lg font-bold text-slate-900 mb-1">Change Password</h1>
        <p className="text-xs text-slate-400 mb-5">{user.email}</p>

        {done ? (
          <p className="text-sm text-green-600">Password updated. Redirecting…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Current password</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="••••••"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
            <Link href="/" className="block text-center text-xs text-slate-400 hover:text-slate-600 pt-1">
              Cancel
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
