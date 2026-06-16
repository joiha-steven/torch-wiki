'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Loader2, RotateCcw, Trash2, AlertTriangle } from 'lucide-react'
import { authHeader } from './shared'

type TrashItem = {
  id: string; brand: string; model: string; slug: string
  image_url: string | null; category: string | null
  max_lumens: number | null; deleted_at: string
}

const RETENTION_DAYS = 30

function daysLeft(deletedAt: string) {
  const expiry = new Date(deletedAt).getTime() + RETENTION_DAYS * 86_400_000
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86_400_000))
}

export default function TrashPanel() {
  const [items, setItems]   = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [confirmPurge, setConfirmPurge] = useState<TrashItem | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const [msg, setMsg]       = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/trash', { headers: await authHeader() })
    const d = res.ok ? await res.json() : { items: [] }
    setItems((d.items ?? []) as TrashItem[])
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  async function act(item: TrashItem, action: 'restore' | 'purge') {
    setActing(item.id + action)
    const res = await fetch('/api/admin/trash', {
      method: 'POST', headers: await authHeader(),
      body: JSON.stringify({ id: item.id, action }),
    })
    setActing(null); setConfirmPurge(null)
    if (res.ok) {
      flash(action === 'restore' ? `Restored "${item.brand} ${item.model}".` : `Permanently deleted "${item.brand} ${item.model}".`)
      load()
    } else {
      const d = await res.json().catch(() => ({}))
      flash(d.error ?? 'Action failed.')
    }
  }

  async function emptyTrash() {
    setActing('all')
    const res = await fetch('/api/admin/trash', {
      method: 'POST', headers: await authHeader(), body: JSON.stringify({ action: 'purge_all' }),
    })
    setActing(null); setConfirmAll(false)
    const d = await res.json().catch(() => ({}))
    if (res.ok) { flash(`Permanently deleted ${d.count ?? 0} flashlight${d.count !== 1 ? 's' : ''}.`); load() }
    else flash(d.error ?? 'Action failed.')
  }

  if (loading) return <div className="flex justify-center py-16 text-ink-3"><Loader2 size={20} className="animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {msg && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{msg}</p>}
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-ink-3">
          Deleted flashlights are unpublished and kept here for {RETENTION_DAYS} days, then permanently removed
          (database + images). Restore to bring one back.
        </p>
        {items.length > 0 && (
          <button onClick={() => setConfirmAll(true)} disabled={!!acting}
            className="shrink-0 flex items-center gap-1.5 text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50">
            <Trash2 size={13} /> Empty trash
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-ink-3 text-sm py-16 text-center">Trash is empty.</p>
      ) : items.map(item => {
        const left = daysLeft(item.deleted_at)
        return (
          <div key={item.id} className="bg-panel border border-line rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded bg-plate shrink-0 overflow-hidden grid place-items-center">
              {item.image_url
                ? <Image src={item.image_url} alt="" width={44} height={44} className="object-contain w-full h-full" />
                : <span className="text-[9px] text-ink-3">N/A</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink truncate"><span className="text-ink-3">{item.brand}</span> {item.model}</p>
              <p className="text-[11px] text-ink-3 mt-0.5">
                {left > 0 ? `Deletes permanently in ${left} day${left !== 1 ? 's' : ''}` : 'Deleting soon'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => act(item, 'restore')} disabled={!!acting} title="Restore"
                className="flex items-center gap-1 text-xs text-ink-2 border border-line rounded-lg px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40">
                {acting === item.id + 'restore' ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Restore
              </button>
              <button onClick={() => setConfirmPurge(item)} disabled={!!acting} title="Delete permanently"
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}

      {/* Empty-trash confirm */}
      {confirmAll && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setConfirmAll(false)}>
          <div className="bg-panel rounded-xl border border-line p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-500"><AlertTriangle size={18} /><h2 className="font-bold text-ink">Empty the trash?</h2></div>
            <p className="text-sm text-ink-3">
              All <span className="font-medium text-ink-2">{items.length}</span> trashed flashlight{items.length !== 1 ? 's' : ''} and their images
              will be erased from the database and storage right now. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAll(false)}
                className="flex-1 border border-line text-ink-2 text-sm py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">Cancel</button>
              <button onClick={emptyTrash} disabled={!!acting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {acting === 'all' ? <Loader2 size={13} className="animate-spin" /> : null} Delete all forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent-delete confirm */}
      {confirmPurge && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setConfirmPurge(null)}>
          <div className="bg-panel rounded-xl border border-line p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-500"><AlertTriangle size={18} /><h2 className="font-bold text-ink">Delete permanently?</h2></div>
            <p className="text-sm text-ink-3">
              <span className="font-medium text-ink-2">{confirmPurge.brand} {confirmPurge.model}</span> and all its images
              will be erased from the database and storage. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPurge(null)}
                className="flex-1 border border-line text-ink-2 text-sm py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">Cancel</button>
              <button onClick={() => act(confirmPurge, 'purge')} disabled={!!acting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {acting ? <Loader2 size={13} className="animate-spin" /> : null} Delete forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
