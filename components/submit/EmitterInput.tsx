'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { input } from '@/components/submit/shared'

// Comma-separated emitter input with a suggestion dropdown sourced from the
// emitters already in the database (get_distinct_emitters). Suggesting the
// canonical names as the user types keeps the list consistent and avoids typos /
// near-duplicates fragmenting the browse filter.

// Module-level cache so the list is fetched once per session, shared across
// every mount of the form.
let cache: string[] | null = null
let inflight: Promise<string[]> | null = null
function loadEmitters(): Promise<string[]> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = (async () => {
      try {
        const { data } = await supabase.rpc('get_distinct_emitters')
        cache = ((data ?? []) as { emitter: string }[]).map(r => r.emitter).filter(Boolean)
        return cache
      } catch { return [] }
    })()
  }
  return inflight
}

export default function EmitterInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [all, setAll] = useState<string[]>(cache ?? [])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => { loadEmitters().then(setAll) }, [])
  useEffect(() => () => clearTimeout(blurTimer.current), [])

  // The token being typed = text after the last comma; earlier tokens are locked in.
  const parts = value.split(',')
  const current = parts[parts.length - 1].trim()
  const chosen = parts.slice(0, -1).map(p => p.trim().toLowerCase()).filter(Boolean)

  const suggestions = all
    .filter(e => !chosen.includes(e.toLowerCase()))
    .filter(e => current === '' || e.toLowerCase().includes(current.toLowerCase()))
    .slice(0, 10)

  const pick = (s: string) => {
    const before = parts.slice(0, -1).map(p => p.trim()).filter(Boolean)
    onChange([...before, s].join(', ') + ', ')
    setOpen(false)
    setActive(0)
  }

  const showList = open && suggestions.length > 0

  return (
    <div className="relative">
      <input
        className={input}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120) }}
        onKeyDown={e => {
          if (!showList) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
          else if (e.key === 'Enter' && suggestions[active]) { e.preventDefault(); pick(suggestions[active]) }
          else if (e.key === 'Escape') { setOpen(false) }
        }}
        placeholder="e.g. Cree XHP-50.2, Luminus SBT-90.3"
        autoComplete="off"
        role="combobox"
        aria-controls="emitter-suggestions"
        aria-expanded={showList}
        aria-autocomplete="list"
      />
      {showList && (
        <ul id="emitter-suggestions" role="listbox" className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-line bg-panel py-1 text-[13px]">
          {suggestions.map((s, i) => (
            <li key={s} role="option" aria-selected={i === active}>
              <button
                type="button"
                // onMouseDown (not onClick) so it fires before the input's blur closes the list.
                onMouseDown={e => { e.preventDefault(); pick(s) }}
                onMouseEnter={() => setActive(i)}
                className={`block w-full text-left px-3 py-1.5 ${i === active ? 'bg-surface text-ink' : 'text-ink-2'}`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
