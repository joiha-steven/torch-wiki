'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { authHeader } from './shared'

type BrandRow = { name: string; count: number }
type Mode = 'products' | 'reassign'

export default function BrandDeletePanel() {
  const [brands, setBrands]     = useState<BrandRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState<BrandRow | null>(null)
  const [mode, setMode]         = useState<Mode>('products')
  const [target, setTarget]     = useState('')
  const [confirm, setConfirm]   = useState(false)
  const [busy, setBusy]         = useState(false)
  const [msg, setMsg]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('flashlights').select('brand').is('deleted_at', null)
    const counts = new Map<string, number>()
    for (const r of (data ?? []) as { brand: string | null }[]) {
      if (r.brand) counts.set(r.brand, (counts.get(r.brand) ?? 0) + 1)
    }
    setBrands([...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)))
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  function reset() { setSelected(null); setConfirm(false); setMode('products'); setTarget('') }

  async function submit() {
    if (!selected) return
    if (mode === 'reassign' && !target) { setMsg('Pick a brand to reassign to.'); return }
    setBusy(true)
    const res = await fetch('/api/admin/brand-trash', {
      method: 'POST', headers: await authHeader(),
      body: JSON.stringify({ name: selected.name, action: 'trash', mode, targetBrand: mode === 'reassign' ? target : undefined }),
    })
    setBusy(false); setConfirm(false)
    if (res.ok) {
      setMsg(mode === 'reassign'
        ? `Moved ${selected.count} products to "${target}" and trashed "${selected.name}".`
        : `Moved "${selected.name}" and its ${selected.count} products to Trash.`)
      reset(); setQuery(''); load()
      setTimeout(() => setMsg(''), 6000)
    } else {
      const d = await res.json().catch(() => ({}))
      setMsg(d.error ?? 'Failed to delete.')
    }
  }

  const filtered = query.trim()
    ? brands.filter(b => b.name.toLowerCase().includes(query.trim().toLowerCase()))
    : brands

  if (loading) return <div className="flex justify-center py-16 text-ink-3"><Loader2 size={20} className="animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {msg && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{msg}</p>}

      {!selected && (
        <>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search a brand to delete…"
              className="w-full h-10 border border-line rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-panel"
            />
          </div>
          <div className="space-y-1">
            {filtered.map(b => (
              <button key={b.name} onClick={() => { setSelected(b); setMsg('') }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-left">
                <span className="text-sm text-ink">{b.name}</span>
                <span className="text-xs text-ink-3">{b.count} product{b.count !== 1 ? 's' : ''}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-ink-3 text-sm py-8 text-center">No brands found.</p>}
          </div>
        </>
      )}

      {selected && (
        <div className="bg-panel border border-line rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-ink">{selected.name}</h3>
            <p className="text-[13px] text-ink-3">{selected.count} product{selected.count !== 1 ? 's' : ''} under this brand</p>
          </div>

          {/* What to do with the products */}
          <div className="space-y-2">
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-line cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
              <input type="radio" name="mode" className="rb mt-0.5" checked={mode === 'products'} onChange={() => setMode('products')} />
              <span className="text-[13px] text-ink-2">
                <span className="font-medium text-ink">Move products to Trash too</span><br />
                The brand and all {selected.count} of its products are unpublished and deleted after 30 days.
              </span>
            </label>
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-line cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
              <input type="radio" name="mode" className="rb mt-0.5" checked={mode === 'reassign'} onChange={() => setMode('reassign')} />
              <span className="text-[13px] text-ink-2 w-full">
                <span className="font-medium text-ink">Reassign products to another brand</span><br />
                Keep the products, move them under an existing brand, then remove this one.
                {mode === 'reassign' && (
                  <select value={target} onChange={e => setTarget(e.target.value)}
                    className="mt-2 w-full h-9 border border-line rounded-lg px-2 text-sm bg-panel">
                    <option value="">Select a brand…</option>
                    {brands.filter(b => b.name !== selected.name).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                )}
              </span>
            </label>
          </div>

          {!confirm ? (
            <div className="flex gap-3 justify-end">
              <button onClick={reset} className="text-sm border border-line text-ink-2 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">Back</button>
              <button onClick={() => setConfirm(true)} disabled={mode === 'reassign' && !target}
                className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg">
                <Trash2 size={14} /> Delete brand
              </button>
            </div>
          ) : (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50/60 dark:bg-red-500/5 p-4">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] text-ink-2 leading-relaxed mb-3">
                  {mode === 'reassign'
                    ? <>Move {selected.count} products to <span className="font-medium text-ink">{target}</span> and remove <span className="font-medium text-ink">{selected.name}</span>?</>
                    : <>Move <span className="font-medium text-ink">{selected.name}</span> and its {selected.count} products to Trash? They are permanently deleted after 30 days; restore any time before then.</>}
                </p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirm(false)} disabled={busy}
                    className="text-sm border border-line text-ink-2 px-4 py-2 rounded-lg hover:bg-panel disabled:opacity-50">Cancel</button>
                  <button onClick={submit} disabled={busy}
                    className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                    {busy && <Loader2 size={13} className="animate-spin" />} Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
