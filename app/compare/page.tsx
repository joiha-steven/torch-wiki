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
  { label: 'Brand',             key: 'brand' },
  { label: 'Category',          key: 'category' },
  { label: 'Year',              key: 'year' },
  { label: 'Max Lumens',        key: 'max_lumens',         format: (v: number) => `${v.toLocaleString()} lm` },
  { label: 'Min Lumens',        key: 'min_lumens',         format: (v: number) => `${v} lm` },
  { label: 'Beam Distance',     key: 'beam_distance_m',    format: (v: number) => `${v} m` },
  { label: 'Beam Type',         key: 'beam_type' },
  { label: 'LED / Emitter',     key: 'emitters',           format: (v: string[]) => Array.isArray(v) ? v.join(' + ') : v },
  { label: 'Battery',           key: 'battery_type' },
  { label: 'Battery Count',     key: 'battery_count' },
  { label: 'Charging',          key: 'charging_type',      format: (v: string) => v === 'usb' ? 'USB' : v === 'magnetic' ? 'Magnetic' : 'None' },
  { label: 'Length',            key: 'length_mm',          format: (v: number) => `${v} mm` },
  { label: 'Head Diameter',     key: 'head_diameter_mm',   format: (v: number) => `${v} mm` },
  { label: 'Weight',            key: 'weight_g',           format: (v: number) => `${v} g` },
  { label: 'Material',          key: 'material' },
  { label: 'IP Rating',         key: 'ip_rating' },
  { label: 'Impact Resistance', key: 'impact_resistance_m', format: (v: number) => `${v} m` },
  { label: 'Price',             key: 'price_usd',          format: (v: number) => `$${v.toLocaleString()}` },
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
    const next = flashlights.filter(f => f.id !== id)
    setFlashlights(next)
    localStorage.setItem('compareIds', JSON.stringify(next.map(f => f.id)))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex items-center justify-center pt-24 text-slate-400 text-sm">Loading…</div>
    </div>
  )

  if (flashlights.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center px-4 pt-24">
          <div className="bg-white border border-[#e7e7e1] rounded-xl w-full max-w-sm p-8 text-center space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Compare flashlights</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Browse the catalog and tick the compare box on up to 4 flashlights, then come back here.
            </p>
            <Link href="/"
              className="block w-full bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium py-2.5 rounded-lg transition-colors">
              Browse flashlights →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        <div className="bg-white border border-[#e7e7e1] rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e7e7e1]">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#a8a89e] w-36 sticky left-0 bg-white">
                  Spec
                </th>
                {flashlights.map(f => (
                  <th key={f.id} className="px-4 py-3 text-center min-w-44 border-l border-[#e7e7e1]">
                    <div className="relative">
                      <button
                        onClick={() => remove(f.id)}
                        className="absolute -top-1 -right-1 text-slate-300 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <X size={13} />
                      </button>
                      <div className="h-16 flex items-center justify-center mb-2">
                        {f.image_url
                          ? <Image src={f.image_url} alt={f.model} width={80} height={56} className="object-contain max-h-16" />
                          : <div className="text-[#d4d4cc] text-xs">—</div>
                        }
                      </div>
                      <Link href={`/${f.slug}`} className="text-xs font-semibold text-slate-900 hover:text-brand-600 block leading-snug">
                        {f.brand} {f.model}
                      </Link>
                      {f.price_usd && (
                        <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">${f.price_usd.toLocaleString()}</p>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPEC_ROWS.map(row => {
                const values = flashlights.map(f => {
                  const raw = f[row.key as keyof Flashlight]
                  if (raw == null) return null
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return row.format ? (row.format as (v: any) => string)(raw) : String(raw)
                })
                if (values.every(v => v == null)) return null

                const hasHighlight = ['max_lumens', 'beam_distance_m'].includes(row.key)
                const numericVals = flashlights.map(f => Number(f[row.key as keyof Flashlight]))
                const maxVal = hasHighlight ? Math.max(...numericVals.filter(v => !isNaN(v))) : null

                return (
                  <tr key={row.key} className="border-t border-[#e7e7e1]">
                    <td className="px-4 py-2.5 text-xs text-[#a8a89e] font-medium sticky left-0 bg-white">{row.label}</td>
                    {flashlights.map((f, fi) => {
                      const val = values[fi]
                      const numVal = Number(f[row.key as keyof Flashlight])
                      const isBest = hasHighlight && maxVal !== null && numVal === maxVal && !isNaN(numVal)
                      return (
                        <td key={f.id} className={`px-4 py-2.5 text-center font-mono text-xs border-l border-[#e7e7e1] ${
                          isBest ? 'text-brand-600 font-bold' : 'text-slate-700'
                        }`}>
                          {val == null ? (
                            <span className="text-slate-200">—</span>
                          ) : row.key === 'charging_type' ? (
                            val !== 'None'
                              ? <Check size={13} className="mx-auto text-brand-500" />
                              : <span className="text-slate-300">—</span>
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

        {flashlights.length < 4 && (
          <p className="mt-4 text-center text-sm text-slate-400">
            <Link href="/" className="hover:text-brand-600 underline underline-offset-2">
              + Add more to compare
            </Link>
            {' '}(max 4)
          </p>
        )}
      </div>
    </div>
  )
}
