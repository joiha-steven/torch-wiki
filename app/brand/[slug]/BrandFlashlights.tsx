'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Flashlight } from '@/lib/types'
import FlashlightCard from '@/components/FlashlightCard'

// Group flashlights into year buckets, newest year first, "Year unknown" last.
function groupByYear(items: Flashlight[]) {
  const map = new Map<number | null, Flashlight[]>()
  for (const f of items) {
    const key = f.year ?? null
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }
  return [...map.entries()].sort((a, b) => {
    if (a[0] === null) return 1
    if (b[0] === null) return -1
    return b[0] - a[0]
  })
}

export default function BrandFlashlights({ items }: { items: Flashlight[] }) {
  const router = useRouter()
  const [compareIds, setCompareIds] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('compareIds')
    if (stored) setCompareIds(JSON.parse(stored))
  }, [])

  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
      localStorage.setItem('compareIds', JSON.stringify(next))
      return next
    })
  }, [])
  const compareSet = useMemo(() => new Set(compareIds), [compareIds])

  const groups = groupByYear(items)

  return (
    <>
      <div className="space-y-10">
        {groups.map(([year, lights]) => (
          <section key={year ?? 'unknown'}>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="font-mono text-[15px] font-semibold text-ink">{year ?? 'Year unknown'}</h2>
              <span className="text-[12px] text-ink-3">{lights.length} model{lights.length !== 1 ? 's' : ''}</span>
              <span className="flex-1 h-px bg-line" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {lights.map(f => (
                <FlashlightCard
                  key={f.id}
                  flashlight={f}
                  isSelected={compareSet.has(f.id)}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {compareIds.length > 0 && (
        <div
          className="floating-nav fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-[22px] text-[#f3f3f0]"
          style={{ width: 'min(1320px, calc(100% - 32px))' }}
        >
          <div className="flex items-center justify-between px-[22px] h-14">
            <span className="text-[#f3f3f0]/70 text-sm">{compareIds.length} selected</span>
            <div className="flex items-center gap-4">
              <button onClick={() => { setCompareIds([]); localStorage.removeItem('compareIds') }} className="text-[#f3f3f0]/60 hover:text-[#f3f3f0] text-xs">Clear</button>
              <button
                onClick={() => { localStorage.setItem('compareIds', JSON.stringify(compareIds)); router.push('/compare') }}
                disabled={compareIds.length < 2}
                className="bg-brand-500 hover:brightness-95 disabled:opacity-40 text-[#1d1604] text-xs px-4 py-2 rounded-full font-semibold transition-[filter]"
              >
                Compare ({compareIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
