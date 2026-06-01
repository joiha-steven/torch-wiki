'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Flashlight as FlashlightType, FilterState } from '@/lib/types'
import FlashlightCard from './FlashlightCard'
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
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [availableEmitters, setAvailableEmitters] = useState<string[]>([])
  const fetchId = useRef(0)
  const searchRef = useRef<HTMLInputElement>(null)

  // Load brand + emitter lists once
  useEffect(() => {
    async function loadMeta() {
      const [{ data: b }, { data: e }] = await Promise.all([
        supabase.rpc('get_distinct_brands'),
        supabase.rpc('get_distinct_emitters'),
      ])
      setAvailableBrands((b ?? []).map((r: { brand: string }) => r.brand).filter(Boolean) as string[])
      setAvailableEmitters((e ?? []).map((r: { emitter: string }) => r.emitter).filter(Boolean) as string[])
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-6">
          <Link href="/" className="font-bold text-base shrink-0">
            <span style={{ color: '#FFBE00' }}>torch.</span><span className="text-white">EDC.wiki</span>
          </Link>
          <nav className="hidden sm:flex gap-4 text-sm text-gray-500">
            <Link href="/" className="text-gray-300 hover:text-white">Browse</Link>
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
            <UserMenu />
          </div>
        </div>
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
                <div key={i} className="bg-white rounded-xl border border-slate-200 h-64 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No flashlights found.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map(f => (
                  <FlashlightCard
                    key={f.id}
                    flashlight={f}
                    compareIds={compareIds}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    {loadingMore ? 'Loading…' : `Load more (${totalCount - items.length} remaining)`}
                  </button>
                  <span className="text-xs text-slate-400">{items.length} / {totalCount}</span>
                </div>
              )}
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
