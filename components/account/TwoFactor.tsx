'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Shield, ShieldCheck, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { inp, type MfaStep } from './shared'

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

export default function TwoFactor({ email }: { email: string }) {
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
    const { data: { user: authedUser } } = await supabase.auth.getUser()
    if (authedUser) await supabase.from('recovery_codes').delete().eq('user_id', authedUser.id)
    setStatus('off'); setFactorId(null); setStep('idle'); setDisablePwd('')
    setLoading(false)
  }

  async function copyAll() {
    await navigator.clipboard.writeText(codes.join('\n'))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading') return <div className="flex items-center gap-2 text-ink-3 text-sm"><Loader2 size={14} className="animate-spin" />Loading…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-2">Two-Factor Authentication</h3>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status === 'on' ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-white/[0.05] text-ink-3'}`}>
          {status === 'on' ? <><ShieldCheck size={12} /> Enabled</> : <><Shield size={12} /> Disabled</>}
        </span>
      </div>

      {/* Off → enable */}
      {status === 'off' && step === 'idle' && (
        <div className="space-y-3">
          <p className="text-sm text-ink-3">Add an extra layer of security to your account using an authenticator app (Google Authenticator, Authy, etc.).</p>
          <button onClick={startEnable} disabled={loading} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#33363c] dark:hover:bg-[#3e4148] text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
            {loading && <Loader2 size={13} className="animate-spin" />}
            Enable 2FA
          </button>
        </div>
      )}

      {/* Step: QR code */}
      {step === 'qr' && (
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-ink-2">Scan this QR code with your authenticator app:</p>
          <div className="bg-panel border border-line rounded-xl p-4 w-fit"
            dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <details className="text-xs text-ink-3 cursor-pointer">
            <summary>Can&apos;t scan? Enter code manually</summary>
            <code className="block mt-2 bg-slate-100 dark:bg-white/[0.05] rounded px-3 py-2 font-mono text-ink-2 break-all select-all">{secret}</code>
          </details>
          <button onClick={() => setStep('verify')} className="bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium px-5 py-2 rounded-lg">
            Next →
          </button>
        </div>
      )}

      {/* Step: verify TOTP */}
      {step === 'verify' && (
        <div className="space-y-3 max-w-sm">
          <p className="text-sm text-ink-2">Enter the 6-digit code from your authenticator app to confirm:</p>
          <input type="text" inputMode="numeric" maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
            className={inp} placeholder="000000" autoFocus />
          {verifyErr && <p className="text-xs text-red-500">{verifyErr}</p>}
          <div className="flex gap-2">
            <button onClick={() => setStep('qr')} className="text-sm text-ink-3 hover:text-ink-2 px-3 py-2">← Back</button>
            <button onClick={verifyTotp} disabled={totpCode.length !== 6 || loading}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#33363c] dark:hover:bg-[#3e4148] disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">
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
          <div className="bg-slate-900 dark:bg-[#33363c] rounded-xl p-4 font-mono text-sm text-slate-200 grid grid-cols-2 gap-1.5">
            {codes.map(c => <span key={c}>{c}</span>)}
          </div>
          <button onClick={copyAll} className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink border border-line rounded-lg px-3 py-2 bg-panel">
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy all'}
          </button>
          <button onClick={() => setStep('idle')} className="bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium px-5 py-2 rounded-lg">
            I&apos;ve saved these codes ✓
          </button>
        </div>
      )}

      {/* On → manage */}
      {status === 'on' && (step === 'idle' || step === 'disabling') && (
        <div className="space-y-4">
          <p className="text-sm text-ink-3">Your account is protected with an authenticator app.</p>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl px-4 py-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-ink-2">Recovery codes</p>
              <p className="text-xs text-ink-3">{unusedCount} unused codes remaining</p>
            </div>
            <button onClick={generateNewCodes} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink border border-line rounded-lg px-3 py-1.5 bg-panel disabled:opacity-50">
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
                <button type="button" onClick={() => setStep('idle')} className="text-sm text-ink-3 hover:text-ink-2 px-3 py-2">Cancel</button>
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
