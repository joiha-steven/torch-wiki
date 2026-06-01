'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X, Menu } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Flashlight as FlashlightType, FilterState } from '@/lib/types'
import FlashlightCard from './FlashlightCard'
import FlashlightCardSkeleton from './FlashlightCardSkeleton'
import FilterPanel from './FilterPanel'
import UserMenu from './UserMenu'

const PAGE_SIZE = 32

const DEFAULT_FILTERS: FilterState = {
  search: '',
  brands: [],
  categories: [],
  batteryTypes: [],
  emitters: [],
  minLumens: 0,
  maxLumens: 50000,
  minPrice: 0,
  maxPrice: 99999,
  chargingType: null,
  sortBy: 'model_asc',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQuery(filters: FilterState, from: number, to: number): any {
  let q = supabase.from('flashlights').select('*', { count: 'exact' })

  if (filters.brands.length > 0) q = q.in('brand', filters.brands)
  if (filters.categories.length > 0) q = q.in('category', filters.categories)
  if (filters.batteryTypes.length > 0) q = q.in('battery_type', filters.batteryTypes)
  if (filters.emitters.length > 0) q = q.overlaps('emitters', filters.emitters)
  if (filters.maxLumens < 50000) q = q.lte('max_lumens', filters.maxLumens)
  if (filters.minPrice > 0) q = q.gte('price_usd', filters.minPrice)
  if (filters.maxPrice < 99999) q = q.lte('price_usd', filters.maxPrice)
  if (filters.chargingType !== null) q = q.eq('charging_type', filters.chargingType)
  if (filters.search.trim()) {
    const s = filters.search.trim()
    q = q.or(`model.ilike.%${s}%,brand.ilike.%${s}%`)
  }

  switch (filters.sortBy) {
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

export default function BrowsePage() {
  const router = useRouter()
  const [items, setItems] = useState<FlashlightType[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [availableEmitters, setAvailableEmitters] = useState<string[]>([])
  const fetchId = useRef(0)
  const searchRef = useRef<HTMLInputElement>(null)

  // Load brand + emitter lists — cached in localStorage for 1 hour
  useEffect(() => {
    const CACHE_KEY = 'meta_cache'
    const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

    async function loadMeta() {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          setAvailableBrands(cached.brands)
          setAvailableEmitters(cached.emitters)
          return
        }
      } catch {}

      const [{ data: b }, { data: e }] = await Promise.all([
        supabase.rpc('get_distinct_brands'),
        supabase.rpc('get_distinct_emitters'),
      ])
      const brands = (b ?? []).map((r: { brand: string }) => r.brand).filter(Boolean) as string[]
      const emitters = (e ?? []).map((r: { emitter: string }) => r.emitter).filter(Boolean) as string[]
      setAvailableBrands(brands)
      setAvailableEmitters(emitters)
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ brands, emitters, ts: Date.now() })) } catch {}
    }
    loadMeta()
  }, [])

  // Load compare IDs
  useEffect(() => {
    const stored = localStorage.getItem('compareIds')
    if (stored) setCompareIds(JSON.parse(stored))
  }, [])

  // Fetch on filter change — debounce search by 300ms
  useEffect(() => {
    const id = ++fetchId.current
    const delay = filters.search ? 300 : 0
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data, count } = await buildQuery(filters, 0, PAGE_SIZE - 1)
      if (fetchId.current !== id) return
      setItems(data ?? [])
      setTotalCount(count ?? 0)
      setPage(0)
      setLoading(false)
    }, delay)
    return () => clearTimeout(timer)
  }, [filters])

  async function loadMore() {
    const next = page + 1
    setLoadingMore(true)
    const from = next * PAGE_SIZE
    const { data } = await buildQuery(filters, from, from + PAGE_SIZE - 1)
    setItems(prev => [...prev, ...(data ?? [])])
    setPage(next)
    setLoadingMore(false)
  }

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
      localStorage.setItem('compareIds', JSON.stringify(next))
      return next
    })
  }

  const hasMore = items.length < totalCount

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-6">
          <Link href="/" className="font-bold text-base shrink-0" onClick={() => setNavOpen(false)}>
            <span style={{ color: '#FFBE00' }}>torch.</span><span className="text-white">EDC.wiki</span>
          </Link>
          <nav className="hidden sm:flex gap-4 text-sm text-gray-500">
            <Link href="/" className="text-white">Browse</Link>
            <Link href="/top" className="hover:text-white">Top</Link>
            <Link href="/compare" className="hover:text-white">Compare</Link>
            <Link href="/updates" className="hover:text-white">Updates</Link>
            <Link href="/report" className="hover:text-white">Report</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-700 border border-zinc-500 rounded-md px-3 py-1">
              <Search size={13} className="text-gray-300 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="bg-transparent text-white text-sm w-24 sm:w-48 focus:outline-none placeholder-gray-400"
              />
              {filters.search && (
                <button onClick={() => setFilters({ ...filters, search: '' })}>
                  <X size={13} className="text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
            <button
              className="sm:hidden flex items-center justify-center text-gray-400 hover:text-white"
              onClick={() => setNavOpen(o => !o)}
              aria-label="Menu"
            >
              {navOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <UserMenu />
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {navOpen && (
          <nav className="sm:hidden bg-zinc-950 border-t border-zinc-800 px-4 py-3 flex flex-col gap-0.5">
            {[
              { href: '/',        label: 'Browse' },
              { href: '/top',     label: 'Top' },
              { href: '/compare', label: 'Compare' },
              { href: '/updates', label: 'Updates' },
              { href: '/report',  label: 'Report' },
            ].map(n => (
              <Link key={n.href} href={n.href} onClick={() => setNavOpen(false)}
                className="text-sm text-gray-400 hover:text-white py-2.5 border-b border-zinc-800 last:border-0">
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5 flex gap-6">
        <div className="hidden md:block">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            availableBrands={availableBrands}
            availableEmitters={availableEmitters}
          />
        </div>

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <span className="text-sm text-slate-500">{totalCount} results</span>
            <button
              onClick={() => setFilterOpen(true)}
              className="flex items-center gap-2 text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <FlashlightCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No flashlights found.</div>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-3">{totalCount} result{totalCount !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((f, i) => (
                  <FlashlightCard
                    key={f.id}
                    flashlight={f}
                    compareIds={compareIds}
                    onToggleCompare={toggleCompare}
                    priority={i < 4}
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="mt-8 flex justify-center h-8">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Loading…
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-slate-800">Filters</span>
              <button onClick={() => setFilterOpen(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableBrands={availableBrands}
              availableEmitters={availableEmitters}
            />
          </div>
        </div>
      )}

      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 z-40">
          <div className="w-full max-w-7xl mx-auto px-4 h-11 flex items-center justify-between">
            <span className="text-gray-400 text-sm">{compareIds.length} selected</span>
            <div className="flex items-center gap-4">
              <button onClick={() => { setCompareIds([]); localStorage.removeItem('compareIds') }} className="text-gray-500 hover:text-white text-xs">Clear</button>
              <button
                onClick={() => { localStorage.setItem('compareIds', JSON.stringify(compareIds)); router.push('/compare') }}
                disabled={compareIds.length < 2}
                className="bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-black text-xs px-3.5 py-1.5 rounded font-medium"
              >
                Compare ({compareIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
