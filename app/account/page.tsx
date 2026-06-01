'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Copy, Check, Eye, EyeOff, Shield, ShieldCheck, Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

type Tab = 'profile' | 'security'
type MfaStep = 'idle' | 'qr' | 'verify' | 'codes' | 'disabling'

const inp = 'w-full h-10 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white'

// Nickname: letters, numbers, - and _ only, 3–30 chars
function nickError(v: string) {
  if (!v) return null
  if (v.length < 3) return 'Minimum 3 characters'
  if (v.length > 30) return 'Maximum 30 characters'
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) return 'Only letters, numbers, - and _ allowed'
  return null
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text.toUpperCase().trim())
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateCodes(n = 10) {
  return Array.from({ length: n }, () => {
    const seg = () => Math.random().toString(36).slice(2, 7).toUpperCase()
    return `${seg()}-${seg()}`
  })
}

// ── Password section ────────────────────────────────────────────────────────
function ChangePassword({ email }: { email: string }) {
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [conf, setConf] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== conf) { setErr('Passwords do not match'); return }
    if (next.length < 6) { setErr('Minimum 6 characters'); return }
    setErr(''); setLoading(true)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: cur })
    if (signInErr) { setErr('Current password is incorrect'); setLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: next })
    if (error) setErr(error.message)
    else { setOk(true); setCur(''); setNext(''); setConf('') }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Change Password</h3>
      {ok && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">Password updated.</p>}
      <form onSubmit={submit} className="space-y-3 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Current password</label>
          <div className="relative">
            <input type={showCur ? 'text' : 'password'} value={cur} onChange={e => setCur(e.target.value)} required className={inp + ' pr-9'} placeholder="••••••" />
            <button type="button" onClick={() => setShowCur(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">New password</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} required minLength={6} className={inp + ' pr-9'} placeholder="••••••" />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Confirm new password</label>
          <input type="password" value={conf} onChange={e => setConf(e.target.value)} required minLength={6} className={inp} placeholder="••••••" />
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        <button type="submit" disabled={loading} className="bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2">
          {loading && <Loader2 size={13} className="animate-spin" />}
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}

// ── 2FA section ─────────────────────────────────────────────────────────────
function TwoFactor({ email }: { email: string }) {
  const [status, setStatus] = useState<'loading' | 'off' | 'on'>('loading')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [step, setStep] = useState<MfaStep>('idle')
  const [qrSvg, setQrSvg] = useState('')
  const [secret, setSecret] = useState('')
  const [enrollId, setEnrollId] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [verifyErr, setVerifyErr] = useState('')
  const [codes, setCodes] = useState<string[]>([])
  const [unusedCount, setUnusedCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [disablePwd, setDisablePwd] = useState('')
  const [disableErr, setDisableErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.find(f => f.status === 'verified')
      if (totp) { setStatus('on'); setFactorId(totp.id) }
      else setStatus('off')
    })
  }, [])

  useEffect(() => {
    if (status !== 'on') return
    supabase.from('recovery_codes').select('id', { count: 'exact' }).is('used_at', null)
      .then(({ count }) => setUnusedCount(count ?? 0))
  }, [status])

  async function startEnable() {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'torch.EDC.wiki' })
    if (error || !data) { setLoading(false); return }
    setEnrollId(data.id)
    setQrSvg(data.totp.qr_code)
    setSecret(data.totp.secret)
    setStep('qr')
    setLoading(false)
  }

  async function verifyTotp() {
    setVerifyErr(''); setLoading(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollId, code: totpCode })
    if (error) { setVerifyErr(error.message); setLoading(false); return }

    // Generate & store recovery codes
    const plain = generateCodes(10)
    const hashes = await Promise.all(plain.map(sha256))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('recovery_codes').delete().eq('user_id', user.id)
      await supabase.from('recovery_codes').insert(hashes.map(h => ({ user_id: user.id, code_hash: h })))
    }
    setCodes(plain)
    setFactorId(enrollId)
    setStatus('on')
    setStep('codes')
    setLoading(false)
  }

  async function generateNewCodes() {
    setLoading(true)
    const plain = generateCodes(10)
    const hashes = await Promise.all(plain.map(sha256))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('recovery_codes').delete().eq('user_id', user.id)
      await supabase.from('recovery_codes').insert(hashes.map(h => ({ user_id: user.id, code_hash: h })))
    }
    setCodes(plain)
    setUnusedCount(plain.length)
    setStep('codes')
    setLoading(false)
  }

  async function disable() {
    setDisableErr(''); setLoading(true)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: disablePwd })
    if (signInErr) { setDisableErr('Incorrect password'); setLoading(false); return }
    if (factorId) await supabase.auth.mfa.unenroll({ factorId })
    await supabase.from('recovery_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000') // delete all
    setStatus('off'); setFactorId(null); setStep('idle'); setDisablePwd('')
    setLoading(false)
  }

  async function copyAll() {
    await navigator.clipboard.writeText(codes.join('\n'))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading') return <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" />Loading…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Two-Factor Authentication</h3>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status === 'on' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {status === 'on' ? <><ShieldCheck size={12} /> Enabled</> : <><Shield size={12} /> Disabled</>}
        </span>
      </div>

      {/* Off → enable */}
      {status === 'off' && step === 'idle' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Add an extra layer of security to your account using an authenticator app (Google Authenticator, Authy, etc.).</p>
          <button onClick={startEnable} disabled={loading} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
            {loading && <Loader2 size={13} className="animate-spin" />}
            Enable 2FA
          </button>
        </div>
      )}

      {/* Step: QR code */}
      {step === 'qr' && (
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-slate-600">Scan this QR code with your authenticator app:</p>
          <div className="bg-white border border-slate-200 rounded-xl p-4 w-fit"
            dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <details className="text-xs text-slate-400 cursor-pointer">
            <summary>Can't scan? Enter code manually</summary>
            <code className="block mt-2 bg-slate-100 rounded px-3 py-2 font-mono text-slate-700 break-all select-all">{secret}</code>
          </details>
          <button onClick={() => setStep('verify')} className="bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium px-5 py-2 rounded-lg">
            Next →
          </button>
        </div>
      )}

      {/* Step: verify TOTP */}
      {step === 'verify' && (
        <div className="space-y-3 max-w-sm">
          <p className="text-sm text-slate-600">Enter the 6-digit code from your authenticator app to confirm:</p>
          <input type="text" inputMode="numeric" maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
            className={inp} placeholder="000000" autoFocus />
          {verifyErr && <p className="text-xs text-red-500">{verifyErr}</p>}
          <div className="flex gap-2">
            <button onClick={() => setStep('qr')} className="text-sm text-slate-400 hover:text-slate-700 px-3 py-2">← Back</button>
            <button onClick={verifyTotp} disabled={totpCode.length !== 6 || loading}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">
              {loading && <Loader2 size={13} className="animate-spin" />}
              Verify & enable
            </button>
          </div>
        </div>
      )}

      {/* Step: show recovery codes */}
      {step === 'codes' && (
        <div className="space-y-4 max-w-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-amber-800 mb-1">Save these recovery codes</p>
            <p className="text-xs text-amber-700">Each code can only be used once. If you lose your authenticator, these are the only way to access your account.</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-slate-200 grid grid-cols-2 gap-1.5">
            {codes.map(c => <span key={c}>{c}</span>)}
          </div>
          <button onClick={copyAll} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white">
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy all'}
          </button>
          <button onClick={() => setStep('idle')} className="bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium px-5 py-2 rounded-lg">
            I've saved these codes ✓
          </button>
        </div>
      )}

      {/* On → manage */}
      {status === 'on' && (step === 'idle' || step === 'disabling') && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Your account is protected with an authenticator app.</p>

          <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-600">Recovery codes</p>
              <p className="text-xs text-slate-400">{unusedCount} unused codes remaining</p>
            </div>
            <button onClick={generateNewCodes} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 bg-white disabled:opacity-50">
              {loading ? <Loader2 size={12} className="animate-spin" /> : null}
              Regenerate
            </button>
          </div>

          {/* Disable */}
          {step === 'idle' && (
            <button onClick={() => setStep('disabling')} className="text-sm text-red-500 hover:text-red-700">
              Disable 2FA
            </button>
          )}
          {step === 'disabling' && (
            <div className="space-y-3 max-w-sm border border-red-100 rounded-xl p-4 bg-red-50">
              <p className="text-sm font-medium text-red-800">Confirm your password to disable 2FA</p>
              <input type="password" value={disablePwd} onChange={e => setDisablePwd(e.target.value)}
                className={inp} placeholder="Current password" />
              {disableErr && <p className="text-xs text-red-500">{disableErr}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('idle')} className="text-sm text-slate-400 hover:text-slate-700 px-3 py-2">Cancel</button>
                <button type="button" onClick={disable} disabled={!disablePwd || loading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Disable
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('profile')

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail || !newEmail.includes('@')) { setEmailErr('Enter a valid email.'); return }
    if (newEmail === user?.email) { setEmailErr('Same as current email.'); return }
    setEmailErr(''); setEmailSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) setEmailErr(error.message)
    else { setEmailMsg(`Verification link sent to ${newEmail}. Click it to confirm the change.`); setNewEmail(''); setShowEmailForm(false) }
    setEmailSaving(false)
  }

  // Nickname
  const [nickname, setNickname] = useState('')
  const [nickSaved, setNickSaved] = useState(false)
  const [nickSaving, setNickSaving] = useState(false)
  const [nickErr, setNickErr] = useState<string | null>(null)
  const [nickAvail, setNickAvail] = useState<'available' | 'taken' | 'checking' | null>(null)
  const [savedNickname, setSavedNickname] = useState('')  // the value already in DB

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('nickname').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.nickname) { setNickname(data.nickname); setSavedNickname(data.nickname) }
      })
  }, [user])

  // Debounced availability check
  useEffect(() => {
    const val = nickname.trim()
    // Skip: empty, has validation error, or same as already-saved value
    if (!val || nickError(val) || val === savedNickname) { setNickAvail(null); return }
    setNickAvail('checking')
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles').select('id').eq('nickname', val).neq('id', user!.id).limit(1)
      setNickAvail(data && data.length > 0 ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(timer)
  }, [nickname, savedNickname, user])

  async function saveNickname(e: React.FormEvent) {
    e.preventDefault()
    const err = nickError(nickname)
    if (err) { setNickErr(err); return }
    if (nickAvail === 'taken') { setNickErr('This nickname is already taken.'); return }
    setNickErr(null); setNickSaving(true)
    const { error } = await supabase.from('profiles').upsert({ id: user!.id, nickname: nickname || null, updated_at: new Date().toISOString() })
    if (error) setNickErr(error.message.includes('unique') ? 'This nickname is already taken.' : error.message)
    else { setNickSaved(true); setSavedNickname(nickname); setNickAvail(null); setTimeout(() => setNickSaved(false), 2500) }
    setNickSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex justify-center pt-24"><Loader2 size={18} className="animate-spin text-slate-400" /></div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="text-slate-500 text-sm">Sign in to view your account.</p>
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Back to browse</Link>
      </div>
    </div>
  )

  const TABS: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">

          {tab === 'profile' && (
            <>
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500">Email</label>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-800">{user.email}</p>
                  {!showEmailForm && (
                    <button type="button" onClick={() => { setShowEmailForm(true); setEmailMsg('') }}
                      className="text-xs text-brand-600 hover:underline">
                      Change
                    </button>
                  )}
                </div>
                {emailMsg && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{emailMsg}</p>}
                {showEmailForm && (
                  <form onSubmit={changeEmail} className="space-y-2 pt-1 max-w-xs">
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                      className={inp} placeholder="New email address" autoFocus required />
                    {emailErr && <p className="text-xs text-red-500">{emailErr}</p>}
                    <p className="text-xs text-slate-400">A verification link will be sent to the new address.</p>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => { setShowEmailForm(false); setEmailErr('') }}
                        className="text-xs text-slate-400 hover:text-slate-700 px-3 py-2">Cancel</button>
                      <button type="submit" disabled={emailSaving}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg">
                        {emailSaving && <Loader2 size={12} className="animate-spin" />}
                        Send verification link
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="border-t border-slate-100" />

              {/* Nickname */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nickname</label>

                  {savedNickname ? (
                    /* Already set — locked */
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-slate-900">{savedNickname}</p>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Permanent</span>
                    </div>
                  ) : (
                    /* Not set yet — allow choosing */
                    <form onSubmit={saveNickname} className="space-y-3">
                      <div className="relative max-w-xs">
                        <input
                          className={inp + ' pr-24'}
                          value={nickname}
                          onChange={e => { setNickname(e.target.value); setNickErr(nickError(e.target.value)); setNickAvail(null) }}
                          placeholder="e.g. flashlight_nerd"
                          maxLength={30}
                          autoComplete="off"
                        />
                        {nickAvail === 'checking' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 flex items-center gap-1">
                            <Loader2 size={11} className="animate-spin" /> Checking…
                          </span>
                        )}
                        {nickAvail === 'available' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium flex items-center gap-1">
                            <Check size={12} /> Available
                          </span>
                        )}
                        {nickAvail === 'taken' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500 font-medium">
                            Taken
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">Letters, numbers, - and _ only. No spaces.</p>
                      {nickErr && <p className="text-xs text-red-500">{nickErr}</p>}

                      {/* Warning — shown only when nickname is valid & available */}
                      {nickname && !nickErr && nickAvail === 'available' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 max-w-xs">
                          <p className="text-xs text-amber-800 font-medium">⚠ This cannot be changed later.</p>
                          <p className="text-xs text-amber-700 mt-0.5">Choose carefully — your nickname is permanent once saved.</p>
                        </div>
                      )}

                      <button type="submit"
                        disabled={nickSaving || !!nickErr || !nickname || nickAvail !== 'available'}
                        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black text-sm font-medium px-5 py-2 rounded-lg">
                        {nickSaving && <Loader2 size={13} className="animate-spin" />}
                        {nickSaved ? '✓ Saved' : 'Save nickname'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'security' && (
            <>
              <ChangePassword email={user.email!} />
              <div className="border-t border-slate-100 pt-6">
                <TwoFactor email={user.email!} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
