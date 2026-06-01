'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Flashlight } from '@/lib/types'
import { Check, X, ChevronLeft } from 'lucide-react'
import Header from '@/components/Header'

const SPEC_ROWS = [
  { label: 'Brand', key: 'brand' },
  { label: 'Category', key: 'category' },
  { label: 'Year', key: 'year' },
  { label: 'Max Lumens', key: 'max_lumens', format: (v: number) => `${v.toLocaleString()} lm` },
  { label: 'Min Lumens', key: 'min_lumens', format: (v: number) => `${v} lm` },
  { label: 'Beam Distance', key: 'beam_distance_m', format: (v: number) => `${v} m` },
  { label: 'Beam Type', key: 'beam_type' },
  { label: 'LED / Emitter', key: 'emitters', format: (v: string[]) => Array.isArray(v) ? v.join(' + ') : v },
  { label: 'Battery Type', key: 'battery_type' },
  { label: 'Battery Count', key: 'battery_count' },
  { label: 'Charging', key: 'charging_type', format: (v: string) => v === 'usb' ? 'USB' : v === 'magnetic' ? 'Magnetic' : 'None' },
  { label: 'Length', key: 'length_mm', format: (v: number) => `${v} mm` },
  { label: 'Head Diameter', key: 'head_diameter_mm', format: (v: number) => `${v} mm` },
  { label: 'Weight', key: 'weight_g', format: (v: number) => `${v} g` },
  { label: 'Material', key: 'material' },
  { label: 'IP Rating', key: 'ip_rating' },
  { label: 'Impact Resistance', key: 'impact_resistance_m', format: (v: number) => `${v} m` },
  { label: 'Est. Retail Price', key: 'price_usd', format: (v: number) => `$${v}` },
]

export default function ComparePage() {
  const [flashlights, setFlashlights] = useState<Flashlight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('compareIds')
      if (!stored) { setLoading(false); return }
      const ids = JSON.parse(stored) as string[]
      if (ids.length === 0) { setLoading(false); return }
      const { data } = await supabase.from('flashlights').select('*').in('id', ids)
      setFlashlights(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const remove = (id: string) => {
    const next = flashlights.filter((f) => f.id !== id)
    setFlashlights(next)
    localStorage.setItem('compareIds', JSON.stringify(next.map((f) => f.id)))
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400 text-sm">Loading...</div>

  if (flashlights.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center px-4 pt-24">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-sm p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check size={22} className="text-brand-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Compare flashlights</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Browse the catalog and tick the compare box on up to 4 flashlights, then come back here to compare them side by side.
            </p>
            <Link
              href="/"
              className="block w-full bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Browse flashlights →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const colCount = flashlights.length

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-slate-500 font-medium w-36 sticky left-0 bg-white">Spec</th>
                {flashlights.map((f) => (
                  <th key={f.id} className="px-4 py-3 text-center min-w-44">
                    <div className="relative">
                      <button
                        onClick={() => remove(f.id)}
                        className="absolute -top-1 -right-1 text-slate-400 hover:text-red-500"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                      {f.image_url && (
                        <Image
                          src={f.image_url}
                          alt={f.model}
                          width={80}
                          height={60}
                          className="object-contain mx-auto mb-2"
                        />
                      )}
                      <Link href={`/${f.slug}`} className="font-semibold text-slate-900 hover:text-brand-600 block text-xs">
                        {f.brand} {f.model}
                      </Link>
                      {f.price_usd && <p className="text-brand-600 font-bold">${f.price_usd}</p>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPEC_ROWS.map((row, i) => {
                const values = flashlights.map((f) => {
                  const raw = f[row.key as keyof Flashlight]
                  if (raw == null) return null
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return row.format ? (row.format as (v: any) => string)(raw) : String(raw)
                })
                const allNull = values.every((v) => v == null)
                if (allNull) return null

                const numericVals = flashlights.map((f) => Number(f[row.key as keyof Flashlight]))
                const hasNumericHighlight = ['max_lumens', 'beam_distance_m'].includes(row.key)
                const maxVal = hasNumericHighlight ? Math.max(...numericVals.filter((v) => !isNaN(v))) : null

                return (
                  <tr key={row.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-2.5 text-slate-500 font-medium sticky left-0 bg-inherit">{row.label}</td>
                    {flashlights.map((f, fi) => {
                      const val = values[fi]
                      const numVal = Number(f[row.key as keyof Flashlight])
                      const isBest = hasNumericHighlight && maxVal !== null && numVal === maxVal
                      return (
                        <td key={f.id} className={`px-4 py-2.5 text-center ${isBest ? 'text-brand-600 font-bold' : 'text-slate-800'}`}>
                          {val == null ? (
                            <span className="text-slate-300">—</span>
                          ) : row.key === 'charging_type' ? (
                            val !== 'None' ? <Check size={14} className="mx-auto text-green-500" /> : <X size={14} className="mx-auto text-red-300" />
                          ) : (
                            val
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {colCount < 4 && (
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-brand-600 hover:underline">
              + Add more flashlights to compare (max 4)
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
