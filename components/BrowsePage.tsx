'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Flashlight as FlashlightType, FilterState } from '@/lib/types'
import FlashlightCard from './FlashlightCard'
import FilterPanel from './FilterPanel'

const DEFAULT_FILTERS: FilterState = {
  search: '',
  brands: [],
  categories: [],
  batteryTypes: [],
  minLumens: 0,
  maxLumens: 50000,
  minPrice: 0,
  maxPrice: 99999,
  chargingType: null,
  sortBy: 'model_asc',
}

export default function BrowsePage() {
  const router = useRouter()
  const [flashlights, setFlashlights] = useState<FlashlightType[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('compareIds')
    if (stored) setCompareIds(JSON.parse(stored))
  }, [])

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('flashlights').select('*').order('model')
      setFlashlights(data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const availableBrands = useMemo(
    () => [...new Set(flashlights.map((f) => f.brand))].sort(),
    [flashlights]
  )

  const filtered = useMemo(() => {
    let list = [...flashlights]
    if (filters.brands.length > 0) list = list.filter((f) => filters.brands.includes(f.brand))
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter((f) =>
        f.model.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q)
      )
    }
    if (filters.categories.length > 0) list = list.filter((f) => f.category && filters.categories.includes(f.category))
    if (filters.batteryTypes.length > 0) list = list.filter((f) => f.battery_type && filters.batteryTypes.includes(f.battery_type))
    if (filters.maxLumens < 50000) list = list.filter((f) => f.max_lumens == null || f.max_lumens <= filters.maxLumens)
    if (filters.maxPrice < 99999) list = list.filter((f) => f.price_usd == null || f.price_usd <= filters.maxPrice)
    if (filters.chargingType !== null) list = list.filter((f) => f.charging_type === filters.chargingType)

    list.sort((a, b) => {
      switch (filters.sortBy) {
        case 'lumens_desc': return (b.max_lumens ?? 0) - (a.max_lumens ?? 0)
        case 'lumens_asc': return (a.max_lumens ?? 0) - (b.max_lumens ?? 0)
        case 'price_asc': return (a.price_usd ?? 9999) - (b.price_usd ?? 9999)
        case 'price_desc': return (b.price_usd ?? 0) - (a.price_usd ?? 0)
        case 'throw_desc': return (b.beam_distance_m ?? 0) - (a.beam_distance_m ?? 0)
        case 'weight_asc': return (a.weight_g ?? 9999) - (b.weight_g ?? 9999)
        default: return a.model.localeCompare(b.model)
      }
    })
    return list
  }, [flashlights, filters])

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
      localStorage.setItem('compareIds', JSON.stringify(next))
      return next
    })
  }

  const goCompare = () => {
    localStorage.setItem('compareIds', JSON.stringify(compareIds))
    router.push('/compare')
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <header className="bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-4">
          <Link href="/" className="font-bold text-base shrink-0" style={{ color: '#FFBE00' }}>
            Torch Wiki
          </Link>
          <nav className="hidden sm:flex gap-4 text-sm text-gray-500">
            <Link href="/" className="text-gray-300 hover:text-white">Browse</Link>
            <Link href="/compare" className="hover:text-white">Compare</Link>
          </nav>
          <div className="ml-auto flex items-center">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
              <Search size={13} className="text-gray-500 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="bg-transparent text-white text-sm w-36 sm:w-48 focus:outline-none placeholder-gray-600"
              />
              {filters.search && (
                <button onClick={() => setFilters({ ...filters, search: '' })}>
                  <X size={13} className="text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5 flex gap-6">
        {/* Desktop filter sidebar */}
        <div className="hidden md:block">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            totalCount={filtered.length}
            availableBrands={availableBrands}
          />
        </div>

        <main className="flex-1 min-w-0">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <span className="text-sm text-slate-500">{filtered.length} results</span>
            <button
              onClick={() => setFilterOpen(true)}
              className="flex items-center gap-2 text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No flashlights found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((f) => (
                <FlashlightCard
                  key={f.id}
                  flashlight={f}
                  compareIds={compareIds}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
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
              totalCount={filtered.length}
              availableBrands={availableBrands}
            />
          </div>
        </div>
      )}

      {/* Compare bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 px-4 py-3 flex items-center justify-between z-40">
          <span className="text-white text-sm">{compareIds.length} selected</span>
          <div className="flex gap-3">
            <button onClick={() => { setCompareIds([]); localStorage.removeItem('compareIds') }} className="text-slate-400 hover:text-white text-sm">Clear</button>
            <button
              onClick={goCompare}
              disabled={compareIds.length < 2}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-sm px-4 py-1.5 rounded-lg font-medium"
            >
              Compare ({compareIds.length})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
