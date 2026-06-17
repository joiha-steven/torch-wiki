'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { inp, nickError, type Tab } from '@/components/account/shared'
import ChangePassword from '@/components/account/ChangePassword'
import TwoFactor from '@/components/account/TwoFactor'
import { useHashTab } from '@/lib/use-hash-tab'

const ACCOUNT_TABS = ['profile', 'security'] as const

export default function AccountPage() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useHashTab<Tab>(ACCOUNT_TABS, 'profile')

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

  // Public collection toggle (default off)
  const [showCollection, setShowCollection] = useState(false)
  const [collSaving, setCollSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('nickname, show_collection').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.nickname) { setNickname(data.nickname); setSavedNickname(data.nickname) }
        if (data) setShowCollection(!!data.show_collection)
      })
  }, [user])

  async function toggleCollection() {
    const next = !showCollection
    setShowCollection(next); setCollSaving(true)
    const { error } = await supabase.from('profiles')
      .upsert({ id: user!.id, show_collection: next, updated_at: new Date().toISOString() })
    if (error) setShowCollection(!next)  // revert on failure
    setCollSaving(false)
  }

  // Debounced availability check - synchronous setState here drives the inline
  // "checking/available/taken" hint; intentional for this debounce pattern.
  useEffect(() => {
    const val = nickname.trim()
    // Skip: empty, has validation error, or same as already-saved value
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="min-h-screen">
      <Header />
      <div className="flex justify-center pt-24"><Loader2 size={18} className="animate-spin text-ink-3" /></div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen">
      <Header />
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="text-ink-3 text-sm">Sign in to view your account.</p>
      </div>
    </div>
  )

  const TABS: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-[1232px] mx-auto px-7 py-8">

        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.02em]">My Account</h1>
          <p className="mt-2 text-[13px] text-ink-2">Manage your profile and security settings.</p>
        </div>

        <div className="flex gap-1 bg-panel border border-line rounded-2xl p-1 w-fit mx-auto mb-8">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${tab === t.key ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="max-w-2xl mx-auto bg-panel rounded-2xl border border-line p-6 sm:p-7 space-y-6">

          {tab === 'profile' && (
            <>
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-ink-3">Email</label>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-ink">{user.email}</p>
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
                    <p className="text-xs text-ink-3">A verification link will be sent to the new address.</p>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => { setShowEmailForm(false); setEmailErr('') }}
                        className="text-xs text-ink-3 hover:text-ink-2 px-3 py-2">Cancel</button>
                      <button type="submit" disabled={emailSaving}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#33363c] dark:hover:bg-[#3e4148] disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg">
                        {emailSaving && <Loader2 size={12} className="animate-spin" />}
                        Send verification link
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="border-t border-line" />

              {/* Nickname */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ink-3 mb-1">Nickname</label>

                  {savedNickname ? (
                    /* Already set - locked */
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-ink">{savedNickname}</p>
                      <span className="text-xs text-ink-3 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 rounded">Permanent</span>
                    </div>
                  ) : (
                    /* Not set yet - allow choosing */
                    <form onSubmit={saveNickname} className="space-y-3">
                      <div className="relative max-w-xs">
                        <input
                          className={inp + ' pr-24'}
                          value={nickname}
                          onChange={e => { setNickname(e.target.value); setNickErr(nickError(e.target.value)); setNickAvail(null) }}
                          placeholder="e.g. flashlight_nerd"
                          maxLength={20}
                          autoComplete="off"
                        />
                        {nickAvail === 'checking' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3 flex items-center gap-1">
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
                      <p className="text-xs text-ink-3">Letters, numbers, - and _ only. No spaces.</p>
                      {nickErr && <p className="text-xs text-red-500">{nickErr}</p>}

                      {/* Warning - shown only when nickname is valid & available */}
                      {nickname && !nickErr && nickAvail === 'available' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 max-w-xs">
                          <p className="text-xs text-amber-800 font-medium">⚠ This cannot be changed later.</p>
                          <p className="text-xs text-amber-700 mt-0.5">Choose carefully - your nickname is permanent once saved.</p>
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

              <div className="border-t border-line" />

              {/* Public collection toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-ink-3">Public collection</label>
                <div className="flex items-center justify-between gap-4 max-w-sm">
                  <p className="text-sm text-ink-2">
                    Show your collection on your public profile. Only the flashlight and quantity are shown - never purchase price or date.
                  </p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showCollection}
                    onClick={toggleCollection}
                    disabled={collSaving}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${showCollection ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/[0.07]'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-panel rounded-full shadow-sm transition-transform ${showCollection ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                {!savedNickname && (
                  <p className="text-xs text-amber-600">Set a nickname first - your public profile lives at <span className="font-mono">/u/your-nickname</span>.</p>
                )}
              </div>
            </>
          )}

          {tab === 'security' && (
            <>
              <ChangePassword email={user.email!} />
              <div className="border-t border-line pt-6">
                <TwoFactor email={user.email!} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
