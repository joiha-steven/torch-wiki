'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Flashlight, FilterState } from '@/lib/types'
import FlashlightCard from './FlashlightCard'
import FilterPanel from './FilterPanel'

const DEFAULT_FILTERS: FilterState = {
  search: '',
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
  const [flashlights, setFlashlights] = useState<Flashlight[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [compareIds, setCompareIds] = useState<string[]>([])

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

  const filtered = useMemo(() => {
    let list = [...flashlights]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter((f) =>
        f.model.toLowerCase().includes(q) ||
        f.brand.toLowerCase().includes(q) ||
        (f.description ?? '').toLowerCase().includes(q)
      )
    }
    if (filters.categories.length > 0) {
      list = list.filter((f) => f.category && filters.categories.includes(f.category))
    }
    if (filters.batteryTypes.length > 0) {
      list = list.filter((f) => f.battery_type && filters.batteryTypes.includes(f.battery_type))
    }
    if (filters.maxLumens < 50000) {
      list = list.filter((f) => f.max_lumens == null || f.max_lumens <= filters.maxLumens)
    }
    if (filters.maxPrice < 99999) {
      list = list.filter((f) => f.price_usd == null || f.price_usd <= filters.maxPrice)
    }
    if (filters.chargingType !== null) {
      list = list.filter((f) => f.charging_type === filters.chargingType)
    }

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
    <div className="min-h-screen">
      <div className="bg-slate-900 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-amber-400 mb-1">Torch Wiki</h1>
          <p className="text-slate-400 text-sm mb-5">The complete flashlight reference database</p>
          <div className="relative max-w-xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by model, brand..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <FilterPanel filters={filters} onChange={setFilters} totalCount={filtered.length} />

        <main className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No flashlights found.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 px-4 py-3 flex items-center justify-between z-40">
          <span className="text-white text-sm">{compareIds.length} flashlight{compareIds.length > 1 ? 's' : ''} selected</span>
          <div className="flex gap-3">
            <button
              onClick={() => { setCompareIds([]); localStorage.removeItem('compareIds') }}
              className="text-slate-400 hover:text-white text-sm"
            >
              Clear
            </button>
            <button
              onClick={goCompare}
              disabled={compareIds.length < 2}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-sm px-4 py-1.5 rounded-lg font-medium"
            >
              Compare {compareIds.length > 1 ? `(${compareIds.length})` : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
