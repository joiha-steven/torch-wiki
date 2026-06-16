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
  // When the account has 2FA on, the recovery link only grants an AAL1 session;
  // updating the password needs AAL2, so we ask for a TOTP code to step up first.
  const [needsMfa, setNeedsMfa] = useState(false)
  const [factorId, setFactorId] = useState('')
  const [totpCode, setTotpCode] = useState('')

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

    if (needsMfa) {
      // Step up to AAL2 with the 6-digit code, then fall through to updateUser.
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
      if (!challenge) { setError('Could not start verification. Try again.'); setLoading(false); return }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId, challengeId: challenge.id, code: totpCode,
      })
      if (vErr) { setError('Incorrect code. Try again.'); setLoading(false); return }
    } else {
      // Does this account require a 2FA step-up before changing the password?
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const totp = factors?.totp?.find(f => f.status === 'verified')
        if (totp) { setFactorId(totp.id); setNeedsMfa(true); setLoading(false); return }
      }
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-panel rounded-2xl shadow-lg border border-line w-full max-w-sm p-6">
        <Link href="/" className="block text-base font-bold mb-6" style={{ color: '#eba00b' }}>
          <span style={{ color: '#eba00b' }}>torch.</span><span className="text-white">EDC.wiki</span>
        </Link>

        <h1 className="text-lg font-bold text-ink mb-5">Set new password</h1>

        {!ready ? (
          <p className="text-sm text-ink-3">Verifying reset link…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="••••••"
              />
            </div>

            {needsMfa && (
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Authentication code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-brand-300"
                  placeholder="000000"
                />
                <p className="mt-1.5 text-[11px] text-ink-3">
                  Two-factor is on for this account. Enter the 6-digit code from your authenticator app to confirm.
                </p>
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || (needsMfa && totpCode.length !== 6)}
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Saving…' : needsMfa ? 'Verify & update password' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
