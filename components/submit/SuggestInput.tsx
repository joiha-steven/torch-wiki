'use client'

import { useRef, useState } from 'react'
import { input } from '@/components/submit/shared'

// Single-value text input with a suggestion dropdown drawn from `options`
// (existing values in the DB). Unlike EmitterInput this holds one value, not a
// comma list - used for Brand and Model so contributors reuse an existing name
// (and can see at a glance whether one already exists) while still being free to
// type a brand-new one. Filtering is done here against the current text.
export default function SuggestInput({
  value,
  onChange,
  options,
  placeholder,
  onBlur,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  onBlur?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const q = value.trim().toLowerCase()
  // Hide the list once the text already exactly matches a known option.
  const exact = options.some(o => o.toLowerCase() === q)
  const suggestions = q && !exact
    ? options.filter(o => o.toLowerCase().includes(q)).slice(0, 8)
    : []

  const pick = (s: string) => {
    onChange(s)
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
        onBlur={() => { blurTimer.current = setTimeout(() => { setOpen(false); onBlur?.() }, 120) }}
        onKeyDown={e => {
          if (!showList) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
          else if (e.key === 'Enter' && suggestions[active]) { e.preventDefault(); pick(suggestions[active]) }
          else if (e.key === 'Escape') { setOpen(false) }
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
      />
      {showList && (
        <ul role="listbox" className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-line bg-panel py-1 text-[13px]">
          {suggestions.map((s, i) => (
            <li key={s} role="option" aria-selected={i === active}>
              <button
                type="button"
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
