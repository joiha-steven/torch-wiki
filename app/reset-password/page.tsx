'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts the session in the URL hash after clicking reset link
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 w-full max-w-sm p-6">
        <Link href="/" className="block text-base font-bold mb-6" style={{ color: '#FFBE00' }}>
          <span style={{ color: '#FFBE00' }}>torch.</span><span className="text-white">EDC.wiki</span>
        </Link>

        <h1 className="text-lg font-bold text-slate-900 mb-5">Set new password</h1>

        {!ready ? (
          <p className="text-sm text-slate-500">Verifying reset link…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Confirm password</label>
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
          </form>
        )}
      </div>
    </div>
  )
}
