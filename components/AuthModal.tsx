'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type Tab = 'signin' | 'signup' | 'forgot'

export default function AuthModal() {
  const { closeAuthModal } = useAuth()
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function reset(nextTab: Tab) {
    setTab(nextTab)
    setError('')
    setMessage('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (tab === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else closeAuthModal()

    } else if (tab === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link.')

    } else if (tab === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError(error.message)
      else setMessage('Password reset link sent — check your email.')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={closeAuthModal} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <button onClick={closeAuthModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-slate-900 mb-5">
          {tab === 'signin' ? 'Sign in' : tab === 'signup' ? 'Create account' : 'Reset password'}
        </h2>

        {tab !== 'forgot' && (
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-5">
            <button
              onClick={() => reset('signin')}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
                tab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => reset('signup')}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
                tab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="you@example.com"
            />
          </div>

          {tab !== 'forgot' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
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
          )}

          {tab === 'signin' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => reset('forgot')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
          {message && <p className="text-xs text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Please wait…'
              : tab === 'signin' ? 'Sign in'
              : tab === 'signup' ? 'Create account'
              : 'Send reset link'}
          </button>

          {tab === 'forgot' && (
            <button
              type="button"
              onClick={() => reset('signin')}
              className="w-full text-xs text-slate-400 hover:text-slate-600 pt-1"
            >
              Back to sign in
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
