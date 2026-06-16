'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { authHeader } from './shared'

type Hit = {
  id: string; brand: string; model: string; slug: string
  image_url: string | null; category: string | null
  max_lumens: number | null; price_usd: number | null; year: number | null
}

export default function DeletePanel() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Hit[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Hit | null>(null)
  const [confirm, setConfirm]   = useState(false)
  const [busy, setBusy]         = useState(false)
  const [msg, setMsg]           = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const q = query.trim()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!q) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('flashlights')
        .select('id,brand,model,slug,image_url,category,max_lumens,price_usd,year')
        .or(`model.ilike.%${q}%,brand.ilike.%${q}%`)
        .is('deleted_at', null)
        .order('brand')
        .limit(20)
      setResults((data ?? []) as Hit[])
      setSearching(false)
    }, 350)
  }, [query])

  async function moveToTrash() {
    if (!selected) return
    setBusy(true)
    const res = await fetch('/api/admin/trash', {
      method: 'POST', headers: await authHeader(),
      body: JSON.stringify({ id: selected.id, action: 'trash' }),
    })
    setBusy(false); setConfirm(false)
    if (res.ok) {
      setMsg(`Moved "${selected.brand} ${selected.model}" to Trash.`)
      setSelected(null); setQuery(''); setResults([])
      setTimeout(() => setMsg(''), 5000)
    } else {
      const d = await res.json().catch(() => ({}))
      setMsg(d.error ?? 'Failed to delete.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {msg && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{msg}</p>}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          type="text" value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setConfirm(false) }}
          placeholder="Search a flashlight to delete (brand or model)…"
          className="w-full h-10 border border-line rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-panel"
        />
      </div>

      {/* Results */}
      {!selected && (
        searching ? (
          <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-ink-3" /></div>
        ) : results.length > 0 ? (
          <div className="space-y-1">
            {results.map(r => (
              <button key={r.id} onClick={() => setSelected(r)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-left">
                <div className="w-9 h-9 rounded bg-plate shrink-0 overflow-hidden grid place-items-center">
                  {r.image_url
                    ? <Image src={r.image_url} alt="" width={36} height={36} className="object-contain w-full h-full" />
                    : <span className="text-[9px] text-ink-3">N/A</span>}
                </div>
                <span className="text-sm text-ink"><span className="text-ink-3">{r.brand}</span> {r.model}</span>
              </button>
            ))}
          </div>
        ) : query.trim() ? (
          <p className="text-ink-3 text-sm py-8 text-center">No flashlights found.</p>
        ) : null
      )}

      {/* Preview + confirm */}
      {selected && (
        <div className="bg-panel border border-line rounded-2xl p-5 space-y-4">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg bg-plate shrink-0 overflow-hidden grid place-items-center">
              {selected.image_url
                ? <Image src={selected.image_url} alt={selected.model} width={96} height={96} className="object-contain w-full h-full" />
                : <span className="text-[10px] text-ink-3">No image</span>}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-3">{selected.brand}</p>
              <h3 className="text-lg font-bold text-ink leading-tight">{selected.model}</h3>
              <p className="text-[13px] text-ink-3 mt-1">
                {[selected.category, selected.max_lumens ? `${selected.max_lumens.toLocaleString()} lm` : null,
                  selected.price_usd ? `$${selected.price_usd}` : null, selected.year]
                  .filter(Boolean).join(' · ')}
              </p>
              <a href={`/${selected.slug}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:text-brand-500 font-medium">View page ↗</a>
            </div>
          </div>

          {!confirm ? (
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSelected(null)}
                className="text-sm border border-line text-ink-2 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">Back</button>
              <button onClick={() => setConfirm(true)}
                className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                <Trash2 size={14} /> Move to Trash
              </button>
            </div>
          ) : (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50/60 dark:bg-red-500/5 p-4">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] text-ink-2 leading-relaxed mb-3">
                  This unpublishes <span className="font-medium text-ink">{selected.brand} {selected.model}</span> and
                  moves it to Trash. It is permanently deleted (database + images) after 30 days; you can restore it
                  before then.
                </p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirm(false)} disabled={busy}
                    className="text-sm border border-line text-ink-2 px-4 py-2 rounded-lg hover:bg-panel disabled:opacity-50">Cancel</button>
                  <button onClick={moveToTrash} disabled={busy}
                    className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                    {busy && <Loader2 size={13} className="animate-spin" />} Confirm delete
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
