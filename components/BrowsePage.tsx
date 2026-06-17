'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { Flashlight as FlashlightType, FilterState } from '@/lib/types'
import {
  PAGE_SIZE_DESKTOP,
  PAGE_SIZE_MOBILE,
  DEFAULT_FILTERS,
  buildQuery,
  madeInBrandNames,
  fetchBrowseMeta,
  fetchFacetRows,
  type BrandMeta,
  type BrowseMeta,
  type SiteStats,
  type FacetRow,
} from '@/lib/browse'
import FilterPanel from './FilterPanel'
import BrowseHeader from './browse/BrowseHeader'
import ViewToggle, { type BrowseView } from './browse/ViewToggle'
import BrowseGrid from './browse/BrowseGrid'
import CompareBar from './browse/CompareBar'

type Props = {
  // Seeded by the server component (app/page.tsx) so the first grid + filter
  // lists render from the HTML, with no client round-trip on first paint.
  initialItems?: FlashlightType[]
  initialCount?: number
  initialMeta?: BrowseMeta
}

export default function BrowsePage({ initialItems, initialCount, initialMeta }: Props = {}) {
  const router = useRouter()
  const hasServerData = initialItems !== undefined
  const [items, setItems] = useState<FlashlightType[]>(initialItems ?? [])
  const [totalCount, setTotalCount] = useState(initialCount ?? 0)
  const [loading, setLoading] = useState(!hasServerData)
  const [loadingMore, setLoadingMore] = useState(false)
  // Decide the page size once, from the viewport at mount (mobile loads fewer).
  const [pageSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP
  )
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  // Grid vs list view. Default 'grid'; read the saved choice after mount (SSR-safe,
  // same pattern as compareIds) so server + first client render match.
  const [view, setView] = useState<BrowseView>('grid')
  const changeView = useCallback((v: BrowseView) => {
    setView(v)
    try { localStorage.setItem('browseView', v) } catch {}
  }, [])
  const [availableBrands, setAvailableBrands] = useState<string[]>(initialMeta?.brands ?? [])
  const [availableEmitters, setAvailableEmitters] = useState<string[]>(initialMeta?.emitters ?? [])
  const [brandsMeta, setBrandsMeta] = useState<BrandMeta[]>(initialMeta?.brandsMeta ?? [])
  const [siteStats, setSiteStats] = useState<SiteStats | null>(initialMeta?.stats ?? null)
  // Per-row facet data for hiding zero-result filter options (loaded once, after paint).
  const [facetRows, setFacetRows] = useState<FacetRow[]>([])
  const fetchId = useRef(0)
  // The filter-change effect fires once on mount; when the server already seeded
  // the first page (default filters) skip that first fetch so we don't re-query
  // identical data across the network right after hydration.
  const skipNextFetch = useRef(hasServerData)

  // Load brand + emitter lists when the server didn't seed them (e.g. client
  // navigation). Cached in localStorage for 5 minutes.
  useEffect(() => {
    if (initialMeta) return
    const CACHE_KEY = 'meta_cache'
    const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

    async function loadMeta() {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
        if (cached && Date.now() - cached.ts < CACHE_TTL && cached.stats && cached.brandsMeta) {
          setAvailableBrands(cached.brands)
          setAvailableEmitters(cached.emitters)
          setBrandsMeta(cached.brandsMeta)
          setSiteStats(cached.stats)
          return
        }
      } catch {}

      const { brands, emitters, brandsMeta, stats } = await fetchBrowseMeta()
      setAvailableBrands(brands)
      setAvailableEmitters(emitters)
      setBrandsMeta(brandsMeta)
      setSiteStats(stats)
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ brands, emitters, brandsMeta, stats, ts: Date.now() })) } catch {}
    }
    loadMeta()
  }, [initialMeta])

  // Load compare IDs
  useEffect(() => {
    try {
      const stored = localStorage.getItem('compareIds')
      // localStorage is client-only, so this read must happen in an effect (SSR-safe).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setCompareIds(JSON.parse(stored))
    } catch {}
  }, [])

  // Load saved grid/list view (after mount → no hydration mismatch)
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem('browseView') === 'list') setView('list')
    } catch {}
  }, [])

  // Remember the active filters for this session, so navigating to a light and
  // hitting Back restores them instead of resetting. Restore after mount (SSR-safe);
  // the filter-change effect below then refetches for the restored filters.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('browseFilters')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setFilters(JSON.parse(stored))
    } catch {}
  }, [])
  const skipFirstFilterWrite = useRef(true)
  useEffect(() => {
    if (skipFirstFilterWrite.current) { skipFirstFilterWrite.current = false; return }
    try { sessionStorage.setItem('browseFilters', JSON.stringify(filters)) } catch {}
  }, [filters])

  // Load facet data once (after first paint - doesn't block the seeded grid).
  useEffect(() => {
    fetchFacetRows().then(setFacetRows).catch(() => {})
  }, [])

  // Fetch on filter change - debounce search by 300ms. Skips the first run after
  // a server-seeded mount (filters are still default → same data we already have).
  useEffect(() => {
    if (skipNextFetch.current) { skipNextFetch.current = false; return }
    const id = ++fetchId.current
    const delay = filters.search ? 300 : 0
    const madeInBrands = madeInBrandNames(filters, brandsMeta)
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data, count } = await buildQuery(filters, 0, pageSize - 1, madeInBrands)
      if (fetchId.current !== id) return
      setItems((data ?? []) as FlashlightType[])
      setTotalCount(count ?? 0)
      setLoading(false)
    }, delay)
    return () => clearTimeout(timer)
  }, [filters, brandsMeta, pageSize])

  async function loadMore() {
    setLoadingMore(true)
    // Offset from what we already have (the first page may be a server-seeded 32,
    // larger than the client pageSize) so infinite-scroll pages never overlap.
    const from = items.length
    const { data } = await buildQuery(filters, from, from + pageSize - 1, madeInBrandNames(filters, brandsMeta))
    setItems(prev => [...prev, ...((data ?? []) as FlashlightType[])])
    setLoadingMore(false)
  }

  // Stable identity so memoised cards don't all re-render on every toggle.
  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
      localStorage.setItem('compareIds', JSON.stringify(next))
      return next
    })
  }, [])
  // O(1) membership lookup; only the cards whose flag flips will re-render.
  const compareSet = useMemo(() => new Set(compareIds), [compareIds])

  const hasMore = items.length < totalCount
  const availableMadeIn = Array.from(new Set(brandsMeta.map(b => b.made_in).filter(Boolean) as string[])).sort()

  // Facet narrowing - which filter options still have results given the OTHER
  // active filters (each facet ignores its own selection so multi-select keeps
  // working). Computed client-side from facetRows; null until that data loads,
  // in which case the rail shows the full lists (unchanged behaviour).
  const facets = useMemo(() => {
    if (facetRows.length === 0) return null
    const madeInSet = filters.madeIn.length
      ? new Set(madeInBrandNames(filters, brandsMeta) ?? [])
      : null
    const overlaps = (a: string[] | null, b: string[]) => !!a && a.some(x => b.includes(x))
    const match = (r: FacetRow, exclude: string) => {
      if (exclude !== 'brand' && filters.brands.length && !(r.brand && filters.brands.includes(r.brand))) return false
      if (exclude !== 'brand' && madeInSet && !(r.brand && madeInSet.has(r.brand))) return false
      if (exclude !== 'category' && filters.categories.length && !(r.category && filters.categories.includes(r.category))) return false
      if (exclude !== 'battery' && filters.batteryTypes.length && !overlaps(r.battery_types, filters.batteryTypes)) return false
      if (exclude !== 'emitter' && filters.emitters.length && !overlaps(r.emitters, filters.emitters)) return false
      if (filters.minLumens > 0 && !(r.max_lumens != null && r.max_lumens >= filters.minLumens)) return false
      if (filters.maxLumens < 50000 && !(r.max_lumens != null && r.max_lumens <= filters.maxLumens)) return false
      if (filters.minPrice > 0 && !(r.price_usd != null && r.price_usd >= filters.minPrice)) return false
      if (filters.maxPrice < 99999 && !(r.price_usd != null && r.price_usd <= filters.maxPrice)) return false
      if (filters.chargingType !== null && r.charging_type !== filters.chargingType) return false
      return true
    }
    const cat = new Set<string>(), bat = new Set<string>(), emi = new Set<string>(), brd = new Set<string>()
    for (const r of facetRows) {
      if (match(r, 'category') && r.category) cat.add(r.category)
      if (match(r, 'brand') && r.brand) brd.add(r.brand)
      if (match(r, 'battery')) (r.battery_types ?? []).forEach(x => bat.add(x))
      if (match(r, 'emitter')) (r.emitters ?? []).forEach(x => emi.add(x))
    }
    return { cat, bat, emi, brd }
  }, [facetRows, filters, brandsMeta])

  // Narrow the rail lists to available options (always keep a currently-selected
  // value visible so it can be unchecked). Before facets load, show everything.
  const brandsToShow = facets ? availableBrands.filter(b => facets.brd.has(b) || filters.brands.includes(b)) : availableBrands
  const emittersToShow = facets ? availableEmitters.filter(e => facets.emi.has(e) || filters.emitters.includes(e)) : availableEmitters
  const categoriesToShow = facets ? Array.from(new Set([...facets.cat, ...filters.categories])) : undefined
  const batteryTypesToShow = facets ? Array.from(new Set([...facets.bat, ...filters.batteryTypes])) : undefined

  // Infinite scroll - observe sentinel div at bottom of list
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(loadingMore)
  const hasMoreRef = useRef(hasMore)
  // Holds the latest loadMore (which closes over current filters/items) so the
  // observer never fires a stale one after a filter change.
  const loadMoreRef = useRef(loadMore)
  // Sync the refs the observer reads - in an effect, never during render.
  useEffect(() => {
    loadingMoreRef.current = loadingMore
    hasMoreRef.current = hasMore
    loadMoreRef.current = loadMore
  })

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          loadMoreRef.current()
        }
      },
      { rootMargin: '200px' } // start loading 200px before reaching the bottom
    )
    observer.observe(el)
    return () => observer.disconnect()
    // Re-attach when the list grows AND whenever `loading` flips: a filter fetch
    // swaps the grid for skeletons (sentinel unmounts) then remounts it as a NEW
    // node - without `loading` here the observer would stay bound to the old,
    // detached node and infinite scroll would silently stop.
  }, [items.length, loading])

  return (
    <div className="min-h-screen">
      <BrowseHeader
        search={filters.search}
        onSearchChange={(v) => setFilters(f => ({ ...f, search: v }))}
      />

      <div className="max-w-[1250px] mx-auto px-7 py-7 flex gap-10">
        <div className="hidden md:block">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            availableBrands={brandsToShow}
            availableEmitters={emittersToShow}
            availableMadeIn={availableMadeIn}
            availableCategories={categoriesToShow}
            availableBatteryTypes={batteryTypesToShow}
          />
        </div>

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-end gap-2 mb-5 md:hidden">
            <span className="text-[12px] text-ink-2 text-right">
              <b className="text-ink font-semibold">{totalCount.toLocaleString()}</b> flashlight{totalCount !== 1 ? 's' : ''}
              {siteStats && (
                <>
                  <span className="text-line-strong mx-1">·</span>
                  <b className="text-ink font-semibold">{siteStats.brands.toLocaleString()}</b> brands
                  <span className="text-line-strong mx-1">·</span>
                  <b className="text-ink font-semibold">{siteStats.users.toLocaleString()}</b> users
                </>
              )}
            </span>
            <ViewToggle view={view} onChange={changeView} />
            <button
              onClick={() => setFilterOpen(true)}
              className="flex items-center gap-2 text-sm border border-line-strong rounded-lg px-3 py-1.5 bg-panel"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>

          <BrowseGrid
            loading={loading}
            items={items}
            totalCount={totalCount}
            compareSet={compareSet}
            onToggleCompare={toggleCompare}
            loadingMore={loadingMore}
            sentinelRef={sentinelRef}
            siteStats={siteStats ?? undefined}
            view={view}
            onViewChange={changeView}
          />
        </main>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-panel shadow-xl overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-ink">Filters</span>
              <button onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={18} className="text-ink-3" /></button>
            </div>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableBrands={brandsToShow}
              availableEmitters={emittersToShow}
              availableMadeIn={availableMadeIn}
              availableCategories={categoriesToShow}
              availableBatteryTypes={batteryTypesToShow}
            />
          </div>
        </div>
      )}

      <CompareBar
        count={compareIds.length}
        onClear={() => { setCompareIds([]); localStorage.removeItem('compareIds') }}
        onCompare={() => { localStorage.setItem('compareIds', JSON.stringify(compareIds)); router.push('/compare') }}
      />
    </div>
  )
}
