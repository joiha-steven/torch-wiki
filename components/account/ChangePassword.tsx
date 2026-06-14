'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { inp } from './shared'

export default function ChangePassword({ email }: { email: string }) {
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
      <h3 className="text-sm font-semibold text-ink-2">Change Password</h3>
      {ok && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">Password updated.</p>}
      <form onSubmit={submit} className="space-y-3 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-ink-3 mb-1">Current password</label>
          <div className="relative">
            <input type={showCur ? 'text' : 'password'} value={cur} onChange={e => setCur(e.target.value)} required className={inp + ' pr-9'} placeholder="••••••" />
            <button type="button" onClick={() => setShowCur(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3">
              {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-3 mb-1">New password</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} required minLength={6} className={inp + ' pr-9'} placeholder="••••••" />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3">
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-3 mb-1">Confirm new password</label>
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
