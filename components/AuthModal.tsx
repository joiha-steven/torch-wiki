'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { trackEvent, AnalyticsEvent } from '@/lib/analytics'
import { SITE_URL } from '@/lib/seo'

type Tab = 'signin' | 'signup' | 'forgot' | 'mfa' | 'recovery'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!
const ATTEMPTS_KEY = 'login_attempts'
const LOCK_KEY     = 'login_locked_until'
const MAX_ATTEMPTS = 5
const LOCK_MS      = 10 * 60 * 1000

async function verifyCaptcha(token: string) {
  const res = await fetch('/api/captcha-verify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  return (await res.json()).success as boolean
}

export default function AuthModal() {
  const { closeAuthModal } = useAuth()
  const [tab, setTab]           = useState<Tab>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [message, setMessage]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [lockSeconds, setLockSeconds]   = useState(0)

  // MFA state
  const [totpCode, setTotpCode]         = useState('')
  const [mfaFactorId, setMfaFactorId]   = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')

  const turnstileRef = useRef<TurnstileInstance>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown ticker
  useEffect(() => {
    function tick() {
      const until = parseInt(localStorage.getItem(LOCK_KEY) || '0')
      const rem = Math.max(0, Math.ceil((until - Date.now()) / 1000))
      setLockSeconds(rem)
      if (rem === 0 && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function reset(next: Tab) {
    setTab(next); setError(''); setMessage('')
    setCaptchaToken(null); turnstileRef.current?.reset()
    setTotpCode(''); setRecoveryCode('')
  }

  // ── Sign in ────────────────────────────────────────────────────────────────
  async function handleSignin() {
    if (lockSeconds > 0) {
      setError(`Too many attempts. Wait ${Math.ceil(lockSeconds / 60)} min.`)
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0') + 1
      localStorage.setItem(ATTEMPTS_KEY, String(attempts))
      if (attempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_MS
        localStorage.setItem(LOCK_KEY, String(until))
        setLockSeconds(Math.ceil(LOCK_MS / 1000))
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          const rem = Math.max(0, Math.ceil((until - Date.now()) / 1000))
          setLockSeconds(rem)
          if (rem === 0) { clearInterval(timerRef.current!); timerRef.current = null }
        }, 1000)
        setError('Too many failed attempts. Locked for 10 minutes.')
      } else {
        setError(`${err.message} (${MAX_ATTEMPTS - attempts} attempt${MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} left)`)
      }
      setLoading(false)
      return
    }

    // Clear failed attempts
    localStorage.removeItem(ATTEMPTS_KEY)
    localStorage.removeItem(LOCK_KEY)

    // Check if MFA is required
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.find(f => f.status === 'verified')
      if (totp) { setMfaFactorId(totp.id); setTab('mfa'); setLoading(false); return }
    }

    setLoading(false)
    closeAuthModal()
  }

  // ── MFA verify ────────────────────────────────────────────────────────────
  async function handleMfa() {
    setLoading(true); setError('')
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
    if (!challenge) { setError('Failed to start challenge.'); setLoading(false); return }
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId, challengeId: challenge.id, code: totpCode,
    })
    if (error) { setError('Incorrect code. Try again.'); setLoading(false); return }
    setLoading(false)
    closeAuthModal()
  }

  // ── Recovery code ─────────────────────────────────────────────────────────
  async function handleRecovery() {
    setLoading(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/recover-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ recoveryCode }),
    })
    const data = await res.json()
    if (!data.success) { setError(data.error || 'Invalid recovery code.'); setLoading(false); return }
    // MFA removed - refresh session
    await supabase.auth.refreshSession()
    setLoading(false)
    closeAuthModal()
  }

  // ── Signup ────────────────────────────────────────────────────────────────
  async function handleSignup() {
    if (!captchaToken) { setError('Please complete the captcha.'); return }
    setLoading(true)
    if (!await verifyCaptcha(captchaToken)) {
      setError('Captcha failed.'); turnstileRef.current?.reset(); setCaptchaToken(null); setLoading(false); return
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: SITE_URL },
    })
    if (error) setError(error.message)
    else { setMessage('Check your email for a confirmation link.'); trackEvent(AnalyticsEvent.Signup) }
    turnstileRef.current?.reset(); setCaptchaToken(null)
    setLoading(false)
  }

  // ── Forgot ────────────────────────────────────────────────────────────────
  async function handleForgot() {
    if (!captchaToken) { setError('Please complete the captcha.'); return }
    setLoading(true)
    if (!await verifyCaptcha(captchaToken)) {
      setError('Captcha failed.'); turnstileRef.current?.reset(); setCaptchaToken(null); setLoading(false); return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`,
    })
    if (error) setError(error.message)
    else setMessage('Password reset link sent - check your email.')
    turnstileRef.current?.reset(); setCaptchaToken(null)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setMessage('')
    if (tab === 'signin')   await handleSignin()
    else if (tab === 'signup')   await handleSignup()
    else if (tab === 'forgot')   await handleForgot()
    else if (tab === 'mfa')      await handleMfa()
    else if (tab === 'recovery') await handleRecovery()
  }

  const isLocked = lockSeconds > 0
  // Signup / forgot succeeded - show a confirmation instead of the form so the
  // lingering email field + captcha don't read as "not done yet".
  const submitted = (tab === 'signup' || tab === 'forgot') && !!message

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={closeAuthModal} />
      <div className="relative bg-panel rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <button onClick={closeAuthModal} className="absolute top-4 right-4 text-ink-3 hover:text-ink-2"><X size={18} /></button>

        <h2 className="text-lg font-bold text-ink mb-5">
          {tab === 'signin' ? 'Sign in'
            : tab === 'signup' ? 'Create account'
            : tab === 'forgot' ? 'Reset password'
            : tab === 'mfa' ? 'Two-factor authentication'
            : 'Recovery code'}
        </h2>

        {/* Signin / Signup tabs */}
        {(tab === 'signin' || tab === 'signup') && (
          <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.05] rounded-lg p-1 mb-5">
            <button onClick={() => reset('signin')}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${tab === 'signin' ? 'bg-panel text-ink shadow-sm' : 'text-ink-3 hover:text-ink-2'}`}>
              Sign in
            </button>
            <button onClick={() => reset('signup')}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${tab === 'signup' ? 'bg-panel text-ink shadow-sm' : 'text-ink-3 hover:text-ink-2'}`}>
              Sign up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* ── MFA step ── */}
          {tab === 'mfa' && (
            <>
              <p className="text-sm text-ink-3">Enter the 6-digit code from your authenticator app.</p>
              <input type="text" inputMode="numeric" maxLength={6} value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full h-10 border border-line rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 text-center tracking-widest text-lg font-mono"
                placeholder="000000" autoFocus />
            </>
          )}

          {/* ── Recovery step ── */}
          {tab === 'recovery' && (
            <>
              <p className="text-sm text-ink-3">Enter one of your saved recovery codes to regain access. The code will be marked as used and your 2FA will be removed.</p>
              <input type="text" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value.toUpperCase())}
                className="w-full h-10 border border-line rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 font-mono"
                placeholder="XXXXX-XXXXX" autoFocus />
            </>
          )}

          {/* ── Email + password ── */}
          {(tab === 'signin' || tab === 'signup' || tab === 'forgot') && !submitted && (
            <>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full h-10 border border-line rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  placeholder="you@example.com" />
              </div>
              {tab !== 'forgot' && (
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                    className="w-full h-10 border border-line rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    placeholder="••••••" />
                </div>
              )}
              {tab === 'signin' && (
                <div className="text-right">
                  <button type="button" onClick={() => reset('forgot')} className="text-xs text-ink-3 hover:text-ink-2">
                    Forgot password?
                  </button>
                </div>
              )}
              {(tab === 'signup' || tab === 'forgot') && (
                <Turnstile ref={turnstileRef} siteKey={SITE_KEY}
                  onSuccess={t => setCaptchaToken(t)} onExpire={() => setCaptchaToken(null)}
                  options={{ theme: 'light', size: 'flexible' }} />
              )}
            </>
          )}

          {/* ── Success confirmation (signup / forgot) ── */}
          {submitted && (
            <div className="text-center space-y-2 py-2">
              <div className="mx-auto w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={20} className="text-green-600" />
              </div>
              <p className="text-sm font-medium text-ink">{message}</p>
              <p className="text-xs text-ink-3">
                Didn&apos;t get it? Check your spam folder, or use a different email below.
              </p>
            </div>
          )}

          {/* Lock countdown */}
          {isLocked && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Too many failed attempts. Try again in {Math.floor(lockSeconds / 60)}:{String(lockSeconds % 60).padStart(2, '0')}.
            </p>
          )}

          {error   && <p className="text-xs text-red-500">{error}</p>}
          {message && !submitted && <p className="text-xs text-green-600">{message}</p>}

          {!submitted && (
            <button type="submit"
              disabled={
                loading || isLocked ||
                (tab === 'mfa' && totpCode.length !== 6) ||
                (tab === 'recovery' && !recoveryCode.trim()) ||
                ((tab === 'signup' || tab === 'forgot') && !captchaToken)
              }
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Please wait…'
                : tab === 'signin'   ? 'Sign in'
                : tab === 'signup'   ? 'Create account'
                : tab === 'forgot'   ? 'Send reset link'
                : tab === 'mfa'      ? 'Verify'
                : 'Use recovery code'}
            </button>
          )}

          {/* Footer links */}
          {submitted && (
            <button type="button"
              onClick={() => { setMessage(''); setCaptchaToken(null); turnstileRef.current?.reset() }}
              className="w-full text-xs text-ink-3 hover:text-ink-2 pt-1">
              ← Use a different email
            </button>
          )}
          {tab === 'mfa' && (
            <button type="button" onClick={() => { setTab('recovery'); setError('') }}
              className="w-full text-xs text-ink-3 hover:text-ink-2 pt-1">
              Lost your authenticator? Use a recovery code →
            </button>
          )}
          {tab === 'recovery' && (
            <button type="button" onClick={() => { setTab('mfa'); setError('') }}
              className="w-full text-xs text-ink-3 hover:text-ink-2 pt-1">
              ← Back to authenticator code
            </button>
          )}
          {tab === 'forgot' && (
            <button type="button" onClick={() => reset('signin')} className="w-full text-xs text-ink-3 hover:text-ink-2 pt-1">
              Back to sign in
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
