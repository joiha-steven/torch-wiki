'use client'

import type { RefObject } from 'react'
import FlashlightCard from '@/components/FlashlightCard'
import FlashlightCardSkeleton from '@/components/FlashlightCardSkeleton'
import type { Flashlight } from '@/lib/types'

// Presentational results grid. The data-fetching + infinite-scroll observer stay
// in BrowsePage; this component just renders state and exposes the sentinel ref.
export default function BrowseGrid({
  loading,
  items,
  totalCount,
  compareSet,
  onToggleCompare,
  loadingMore,
  sentinelRef,
  siteStats,
}: {
  loading: boolean
  items: Flashlight[]
  totalCount: number
  compareSet: Set<string>
  onToggleCompare: (id: string) => void
  loadingMore: boolean
  sentinelRef: RefObject<HTMLDivElement | null>
  siteStats?: { flashlights: number; brands: number; users: number }
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <FlashlightCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <div className="flex items-center justify-center h-64 text-ink-3 text-sm">No flashlights found.</div>
  }

  return (
    <>
      <p className="hidden md:block text-[13px] text-ink-2 mb-[22px]">
        <b className="text-ink font-semibold">{totalCount.toLocaleString()}</b> flashlight{totalCount !== 1 ? 's' : ''}
        {siteStats && (
          <>
            <span className="text-line-strong mx-1.5">·</span>
            <b className="text-ink font-semibold">{siteStats.brands.toLocaleString()}</b> brands
            <span className="text-line-strong mx-1.5">·</span>
            <b className="text-ink font-semibold">{siteStats.users.toLocaleString()}</b> users
          </>
        )}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((f, i) => (
          <FlashlightCard
            key={f.id}
            flashlight={f}
            isSelected={compareSet.has(f.id)}
            onToggleCompare={onToggleCompare}
            priority={i < 4}
            eager={i < 12}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="mt-8 flex justify-center h-8">
        {loadingMore && (
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Loading…
          </div>
        )}
      </div>
    </>
  )
}
