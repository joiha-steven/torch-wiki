'use client'

import { LayoutGrid, List } from 'lucide-react'

export type BrowseView = 'grid' | 'list'

// Grid/List segmented toggle for the browse results. Active = inverted (ink) pill.
export default function ViewToggle({ view, onChange }: { view: BrowseView; onChange: (v: BrowseView) => void }) {
  const btn = (v: BrowseView, Icon: typeof LayoutGrid, label: string) => (
    <button
      onClick={() => onChange(v)}
      aria-label={label}
      aria-pressed={view === v}
      className={`w-7 h-7 grid place-items-center rounded-md transition-colors ${
        view === v ? 'bg-ink text-surface' : 'text-ink-3 hover:text-ink hover:bg-black/5 dark:hover:bg-white/10'
      }`}
    >
      <Icon size={15} />
    </button>
  )
  return (
    <div className="flex items-center gap-1 border border-line rounded-lg p-0.5 bg-panel shrink-0">
      {btn('grid', LayoutGrid, 'Grid view')}
      {btn('list', List, 'List view')}
    </div>
  )
}
