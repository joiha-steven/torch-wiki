'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Trash2, ShieldOff, ShieldCheck, KeyRound } from 'lucide-react'
import { authHeader } from './shared'

type UserRow = {
  id: string; email: string; nickname: string | null
  is_admin: boolean; is_moderator: boolean; banned: boolean
  has_2fa: boolean
  created_at: string; last_sign_in: string | null
}

export default function UsersPanel() {
  const [query, setQuery]       = useState('')
  const [users, setUsers]       = useState<UserRow[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadErr, setLoadErr]     = useState('')
  const [acting, setActing]       = useState<string | null>(null)
  const [msg, setMsg]             = useState('')
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null)

  // Latest query, readable from event handlers (e.g. act) without re-creating callbacks.
  const queryRef = useRef(query)
  useEffect(() => { queryRef.current = query }, [query])

  const load = useCallback(async (q: string, p: number, append = false) => {
    append ? setLoadingMore(true) : setLoading(true)
    if (!append) setLoadErr('')
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&page=${p}`, {
        headers: await authHeader(),
      })
      const data = await res.json()
      if (!res.ok) { setLoadErr(data.error ?? 'Failed to load users.'); return }
      setUsers(prev => append ? [...prev, ...(data.users ?? [])] : (data.users ?? []))
      setTotal(data.total ?? 0)
    } catch {
      setLoadErr('Network error.')
    } finally {
      append ? setLoadingMore(false) : setLoading(false)
    }
  }, [])

  // Search: debounce, reset to page 1, replace list
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(queryRef.current, 1, false) }, query ? 400 : 0)
    return () => clearTimeout(t)
  }, [query, load])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function act(userId: string, action: string) {
    setActing(userId + action)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: await authHeader(),
      body: JSON.stringify({ targetId: userId, action }),
    })
    const data = await res.json()
    if (!res.ok) flash(data.error)
    else flash(data.message ?? 'Done.')
    setActing(null)
    setConfirmDelete(null)
    // Reload from scratch to reflect changes
    setPage(1)
    load(queryRef.current, 1, false)
  }

  function fmt(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text" value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Search by email or nickname…"
        className="w-full h-10 border border-line rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-panel"
      />

      {msg     && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{msg}</p>}
      {loadErr && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{loadErr}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-slate-300" /></div>
      ) : users.length === 0 && !loadErr ? (
        <p className="text-ink-3 text-sm py-12 text-center">No users found.</p>
      ) : (
        <>
          <p className="text-xs text-ink-3">Showing {users.length} of {total} user{total !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className={`bg-panel rounded-xl border px-5 py-3.5 flex items-center gap-4 ${u.banned ? 'border-red-100 bg-red-50/30' : 'border-line'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink truncate">{u.email}</span>
                    {u.is_admin     && <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium">Admin</span>}
                    {u.is_moderator && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Moderator</span>}
                    {u.banned       && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Banned</span>}
                    {u.has_2fa
                      ? <span className="inline-flex items-center gap-0.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium"><ShieldCheck size={10} /> 2FA</span>
                      : <span className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 text-ink-3 px-1.5 py-0.5 rounded font-medium"><ShieldOff size={10} /> No 2FA</span>}
                  </div>
                  <p className="text-xs text-ink-3 mt-0.5">
                    {u.nickname ? `@${u.nickname} · ` : ''}Joined {fmt(u.created_at)} · Last seen {fmt(u.last_sign_in)}
                  </p>
                </div>

                {/* Actions — skip if admin */}
                {!u.is_admin && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Reset password */}
                    <button
                      onClick={() => act(u.id, 'reset_password')}
                      disabled={!!acting}
                      title="Send password reset email"
                      className="p-2 text-ink-3 hover:text-ink-2 hover:bg-slate-100 dark:bg-white/[0.05] rounded-lg transition-colors disabled:opacity-40"
                    >
                      {acting === u.id + 'reset_password' ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                    </button>
                    {/* Ban / Unban */}
                    <button
                      onClick={() => act(u.id, u.banned ? 'unban' : 'ban')}
                      disabled={!!acting}
                      title={u.banned ? 'Unban user' : 'Ban user'}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${u.banned ? 'text-green-500 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`}
                    >
                      {acting === u.id + (u.banned ? 'unban' : 'ban')
                        ? <Loader2 size={14} className="animate-spin" />
                        : u.banned ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => setConfirmDelete(u)}
                      disabled={!!acting}
                      title="Delete account"
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load more */}
          {users.length < total && (
            <button
              onClick={() => { const next = page + 1; setPage(next); load(queryRef.current, next, true) }}
              disabled={loadingMore}
              className="w-full py-2.5 border border-line rounded-lg text-sm text-ink-3 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5 disabled:opacity-50 flex items-center justify-center gap-2 bg-panel"
            >
              {loadingMore && <Loader2 size={13} className="animate-spin" />}
              {loadingMore ? 'Loading…' : `Load more (${total - users.length} remaining)`}
            </button>
          )}
        </>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-panel rounded-xl border border-line p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-ink">Delete account?</h2>
            <p className="text-sm text-ink-3">
              This will permanently delete <span className="font-medium text-ink-2">{confirmDelete.email}</span> and all their data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-line text-ink-2 text-sm py-2 rounded-lg hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5">Cancel</button>
              <button onClick={() => act(confirmDelete.id, 'delete')} disabled={!!acting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {acting ? <Loader2 size={13} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
