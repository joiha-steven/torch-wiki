'use client'

import { useState, useEffect } from 'react'
import { Loader2, UserPlus, Trash2 } from 'lucide-react'
import { authHeader } from './shared'

type AdminUser = { id: string; email: string; nickname: string | null }

export default function TeamPanel() {
  const [admins, setAdmins]     = useState<AdminUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding]     = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [msg, setMsg]           = useState('')
  const [err, setErr]           = useState('')

  async function loadAdmins() {
    setLoading(true)
    const res = await fetch('/api/admin/list-moderators', { headers: await authHeader() })
    const data = await res.json()
    setAdmins(data.moderators ?? [])
    setLoading(false)
  }

  // loadAdmins() flips the loading spinner on; standard data-fetch-on-mount pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAdmins() }, [])

  function flash(message: string, isErr = false) {
    isErr ? setErr(message) : setMsg(message)
    setTimeout(() => isErr ? setErr('') : setMsg(''), 3500)
  }

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAdding(true); setErr('')
    const res = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: await authHeader(),
      body: JSON.stringify({ email: newEmail.trim(), is_moderator: true }),
    })
    const data = await res.json()
    if (!res.ok) { flash(data.error, true) }
    else { setNewEmail(''); flash(`${data.email} is now a moderator.`); loadAdmins() }
    setAdding(false)
  }

  async function removeAdmin(admin: AdminUser) {
    setRemoving(admin.id)
    const res = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: await authHeader(),
      body: JSON.stringify({ email: admin.email, is_moderator: false }),
    })
    const data = await res.json()
    if (!res.ok) flash(data.error, true)
    else { flash(`${admin.email} removed.`); loadAdmins() }
    setRemoving(null)
  }

  return (
    <div className="bg-panel rounded-xl border border-line p-6 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-ink">Moderators</h2>
        <p className="text-xs text-ink-3 mt-0.5">Moderators can review submissions and reports, but can&apos;t change settings</p>
      </div>

      {/* Current admins */}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-300" /></div>
      ) : admins.length === 0 ? (
        <p className="text-xs text-ink-3">No admins found.</p>
      ) : (
        <ul className="divide-y divide-line">
          {admins.map(a => (
            <li key={a.id} className="flex items-center justify-between py-2.5 gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink truncate">{a.email}</p>
                {a.nickname && <p className="text-xs text-ink-3">{a.nickname}</p>}
              </div>
              <button
                onClick={() => removeAdmin(a)}
                disabled={removing === a.id}
                className="shrink-0 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
                title="Remove moderator"
              >
                {removing === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new admin */}
      <form onSubmit={addAdmin} className="flex gap-2 pt-1">
        <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="Email address"
          className="flex-1 h-9 border border-line rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-panel"
        />
        <button type="submit" disabled={adding || !newEmail.trim()}
          className="flex items-center gap-1.5 h-9 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-[#33363c] dark:hover:bg-[#3e4148] text-white text-sm rounded-lg disabled:opacity-50 shrink-0">
          {adding ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
          Add
        </button>
      </form>

      {msg && <p className="text-xs text-green-600">{msg}</p>}
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  )
}
