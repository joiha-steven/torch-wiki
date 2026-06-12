'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Flashlight as FlashlightType, FilterState } from '@/lib/types'
import FilterPanel from './FilterPanel'
import BrowseHeader from './browse/BrowseHeader'
import BrowseGrid from './browse/BrowseGrid'
import CompareBar from './browse/CompareBar'

// Mobile shows a 2-column grid — load a small first batch so the initial paint
// is light, then let infinite-scroll fill the rest. Desktop loads a full page.
const PAGE_SIZE_DESKTOP = 32
const PAGE_SIZE_MOBILE = 12

const DEFAULT_FILTERS: FilterState = {
  search: '',
  brands: [],
  categories: [],
  batteryTypes: [],
  emitters: [],
  madeIn: [],
  minLumens: 0,
  maxLumens: 50000,
  minPrice: 0,
  maxPrice: 99999,
  chargingType: null,
  sortBy: 'random',
}

// madeInBrands: when the "Made in" filter is active, the precomputed list of brand
// names whose made_in matches the selection (made_in lives on the brands table).
function buildQuery(filters: FilterState, from: number, to: number, madeInBrands: string[] | null = null) {
  let q = supabase.from('flashlights').select('*', { count: 'exact' })

  if (filters.brands.length > 0) q = q.in('brand', filters.brands)
  if (madeInBrands !== null) q = q.in('brand', madeInBrands)
  if (filters.categories.length > 0) q = q.in('category', filters.categories)
  if (filters.batteryTypes.length > 0) q = q.overlaps('battery_types', filters.batteryTypes)
  if (filters.emitters.length > 0) q = q.overlaps('emitters', filters.emitters)
  if (filters.minLumens > 0) q = q.gte('max_lumens', filters.minLumens)
  if (filters.maxLumens < 50000) q = q.lte('max_lumens', filters.maxLumens)
  if (filters.minPrice > 0) q = q.gte('price_usd', filters.minPrice)
  if (filters.maxPrice < 99999) q = q.lte('price_usd', filters.maxPrice)
  if (filters.chargingType !== null) q = q.eq('charging_type', filters.chargingType)
  if (filters.search.trim()) {
    // Split into words — each word must match brand OR model (AND between words)
    // "surefire 6px" → (brand|model has "surefire") AND (brand|model has "6px")
    const words = filters.search.trim().split(/\s+/).filter(Boolean)
    for (const word of words) {
      q = q.or(`model.ilike.%${word}%,brand.ilike.%${word}%`)
    }
  }

  switch (filters.sortBy) {
    // Order by the (random v4) uuid — a stable shuffle that isn't biased by name,
    // and paginates consistently across infinite-scroll pages.
    case 'random':      q = q.order('id', { ascending: true }); break
    case 'lumens_desc': q = q.order('max_lumens', { ascending: false, nullsFirst: false }); break
    case 'lumens_asc':  q = q.order('max_lumens', { ascending: true,  nullsFirst: false }); break
    case 'price_asc':   q = q.order('price_usd',  { ascending: true,  nullsFirst: false }); break
    case 'price_desc':  q = q.order('price_usd',  { ascending: false, nullsFirst: false }); break
    case 'throw_desc':  q = q.order('beam_distance_m', { ascending: false, nullsFirst: false }); break
    case 'weight_asc':  q = q.order('weight_g',   { ascending: true,  nullsFirst: false }); break
    default:            q = q.order('model', { ascending: true })
  }

  return q.range(from, to)
}

// Resolve the "Made in" filter (a brands-table attribute) to the set of brand names to match on.
// Returns null when the filter is inactive (no constraint).
function madeInBrandNames(filters: FilterState, brandsMeta: { name: string; made_in: string | null }[]): string[] | null {
  if (filters.madeIn.length === 0) return null
  return brandsMeta.filter(b => b.made_in && filters.madeIn.includes(b.made_in)).map(b => b.name)
}

export default function BrowsePage() {
  const router = useRouter()
  const [items, setItems] = useState<FlashlightType[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  // Decide the page size once, from the viewport at mount (mobile loads fewer).
  const [pageSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP
  )
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [availableEmitters, setAvailableEmitters] = useState<string[]>([])
  const [brandsMeta, setBrandsMeta] = useState<{ name: string; made_in: string | null }[]>([])
  const [siteStats, setSiteStats] = useState<{ flashlights: number; brands: number; users: number } | null>(null)
  const fetchId = useRef(0)

  // Load brand + emitter lists — cached in localStorage for 5 minutes
  useEffect(() => {
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

      // Fetch lists + counts in parallel
      const [{ data: b }, { data: e }, { data: br }, { count: fCount }, { count: uCount }] = await Promise.all([
        supabase.rpc('get_distinct_brands'),
        supabase.rpc('get_distinct_emitters'),
        supabase.from('brands').select('name, made_in'),
        supabase.from('flashlights').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ])
      const brands = (b ?? []).map((r: { brand: string }) => r.brand).filter(Boolean) as string[]
      const emitters = (e ?? []).map((r: { emitter: string }) => r.emitter).filter(Boolean) as string[]
      const brandsMeta = (br ?? []) as { name: string; made_in: string | null }[]
      const stats = { flashlights: fCount ?? 0, brands: brands.length, users: uCount ?? 0 }

      setAvailableBrands(brands)
      setAvailableEmitters(emitters)
      setBrandsMeta(brandsMeta)
      setSiteStats(stats)
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ brands, emitters, brandsMeta, stats, ts: Date.now() })) } catch {}
    }
    loadMeta()
  }, [])

  // Load compare IDs
  useEffect(() => {
    try {
      const stored = localStorage.getItem('compareIds')
      if (stored) setCompareIds(JSON.parse(stored))
    } catch {}
  }, [])

  // Fetch on filter change — debounce search by 300ms
  useEffect(() => {
    const id = ++fetchId.current
    const delay = filters.search ? 300 : 0
    const madeInBrands = madeInBrandNames(filters, brandsMeta)
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data, count } = await buildQuery(filters, 0, pageSize - 1, madeInBrands)
      if (fetchId.current !== id) return
      setItems(data ?? [])
      setTotalCount(count ?? 0)
      setPage(0)
      setLoading(false)
    }, delay)
    return () => clearTimeout(timer)
  }, [filters, brandsMeta, pageSize])

  async function loadMore() {
    const next = page + 1
    setLoadingMore(true)
    const from = next * pageSize
    const { data } = await buildQuery(filters, from, from + pageSize - 1, madeInBrandNames(filters, brandsMeta))
    setItems(prev => [...prev, ...(data ?? [])])
    setPage(next)
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

  // Infinite scroll — observe sentinel div at bottom of list
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(loadingMore)
  loadingMoreRef.current = loadingMore
  const hasMoreRef = useRef(hasMore)
  hasMoreRef.current = hasMore

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          loadMore()
        }
      },
      { rootMargin: '200px' } // start loading 200px before reaching the bottom
    )
    observer.observe(el)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]) // re-attach when list grows so sentinel stays valid

  return (
    <div className="min-h-screen">
      <BrowseHeader
        search={filters.search}
        onSearchChange={(v) => setFilters(f => ({ ...f, search: v }))}
      />

      <div className="max-w-[1280px] mx-auto px-7 py-7 flex gap-10">
        <div className="hidden md:block">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            availableBrands={availableBrands}
            availableEmitters={availableEmitters}
            availableMadeIn={availableMadeIn}
            siteStats={siteStats ?? undefined}
          />
        </div>

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-end gap-3 mb-5 md:hidden">
            <span className="text-[13px] text-[#6c6c66]">
              <b className="text-[#17171a] font-semibold">{totalCount.toLocaleString()}</b> flashlight{totalCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setFilterOpen(true)}
              className="flex items-center gap-2 text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
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
          />
        </main>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-slate-800">Filters</span>
              <button onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={18} className="text-slate-500" /></button>
            </div>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableBrands={availableBrands}
              availableEmitters={availableEmitters}
              availableMadeIn={availableMadeIn}
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
