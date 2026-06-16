'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RotateCcw, Trash2, AlertTriangle } from 'lucide-react'
import { authHeader } from './shared'

type TrashedBrand = { name: string; logo_url: string | null; deleted_at: string; productCount: number }

const RETENTION_DAYS = 30

function daysLeft(deletedAt: string) {
  const expiry = new Date(deletedAt).getTime() + RETENTION_DAYS * 86_400_000
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86_400_000))
}

export default function BrandTrashPanel() {
  const [items, setItems]   = useState<TrashedBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [confirmPurge, setConfirmPurge] = useState<TrashedBrand | null>(null)
  const [msg, setMsg]       = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/brand-trash', { headers: await authHeader() })
    const d = res.ok ? await res.json() : { items: [] }
    setItems((d.items ?? []) as TrashedBrand[])
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  async function act(item: TrashedBrand, action: 'restore' | 'purge') {
    setActing(item.name + action)
    const res = await fetch('/api/admin/brand-trash', {
      method: 'POST', headers: await authHeader(),
      body: JSON.stringify({ name: item.name, action }),
    })
    setActing(null); setConfirmPurge(null)
    if (res.ok) {
      flash(action === 'restore' ? `Restored "${item.name}".` : `Permanently deleted "${item.name}".`)
      load()
    } else {
      const d = await res.json().catch(() => ({}))
      flash(d.error ?? 'Action failed.')
    }
  }

  if (loading) return <div className="flex justify-center py-16 text-ink-3"><Loader2 size={20} className="animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {msg && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{msg}</p>}
      <p className="text-xs text-ink-3">
        Deleted brands are kept here for {RETENTION_DAYS} days, then permanently removed (brand + logo, plus any
        still-trashed products). Restore brings the brand and its trashed products back.
      </p>

      {items.length === 0 ? (
        <p className="text-ink-3 text-sm py-16 text-center">Brand trash is empty.</p>
      ) : items.map(item => {
        const left = daysLeft(item.deleted_at)
        return (
          <div key={item.name} className="bg-panel border border-line rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink truncate">{item.name}</p>
              <p className="text-[11px] text-ink-3 mt-0.5">
                {item.productCount} product{item.productCount !== 1 ? 's' : ''} · {left > 0 ? `deletes in ${left} day${left !== 1 ? 's' : ''}` : 'deleting soon'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => act(item, 'restore')} disabled={!!acting} title="Restore"
                className="flex items-center gap-1 text-xs text-ink-2 border border-line rounded-lg px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40">
                {acting === item.name + 'restore' ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Restore
              </button>
              <button onClick={() => setConfirmPurge(item)} disabled={!!acting} title="Delete permanently"
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}

      {confirmPurge && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setConfirmPurge(null)}>
          <div className="bg-panel rounded-xl border border-line p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-500"><AlertTriangle size={18} /><h2 className="font-bold text-ink">Delete permanently?</h2></div>
            <p className="text-sm text-ink-3">
              <span className="font-medium text-ink-2">{confirmPurge.name}</span> (and any still-trashed products + logo)
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
