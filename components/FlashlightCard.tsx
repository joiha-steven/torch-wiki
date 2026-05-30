'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Zap, Target, Battery, DollarSign } from 'lucide-react'
import { Flashlight } from '@/lib/types'

type Props = {
  flashlight: Flashlight
  compareIds: string[]
  onToggleCompare: (id: string) => void
}

export default function FlashlightCard({ flashlight, compareIds, onToggleCompare }: Props) {
  const isSelected = compareIds.includes(flashlight.id)

  return (
    <div className={`bg-white rounded-xl border transition-all ${isSelected ? 'border-brand-400 ring-2 ring-brand-200' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
      <Link href={`/flashlight/${flashlight.slug}`}>
        <div className="relative h-44 bg-white rounded-t-xl overflow-hidden flex items-center justify-center">
          {flashlight.image_url ? (
            <Image
              src={flashlight.image_url}
              alt={`${flashlight.brand} ${flashlight.model}`}
              fill
              className="object-contain p-4"
            />
          ) : (
            <div className="text-slate-300 text-xs">No image</div>
          )}
          {flashlight.is_discontinued && (
            <span className="absolute top-2 right-2 bg-slate-700 text-white text-xs px-2 py-0.5 rounded">
              Discontinued
            </span>
          )}
          {flashlight.category && (
            <span className="absolute top-2 left-2 bg-brand-100 text-brand-800 text-xs px-2 py-0.5 rounded font-medium">
              {flashlight.category}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/flashlight/${flashlight.slug}`} className="hover:text-brand-600">
          <p className="text-xs text-slate-500 mb-0.5">{flashlight.brand}</p>
          <h3 className="font-semibold text-slate-900 leading-tight">{flashlight.model}</h3>
        </Link>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
          {flashlight.max_lumens && (
            <div className="flex items-center gap-1">
              <Zap size={12} className="text-brand-500" />
              <span>{flashlight.max_lumens.toLocaleString()} lm</span>
            </div>
          )}
          {flashlight.beam_distance_m && (
            <div className="flex items-center gap-1">
              <Target size={12} className="text-blue-500" />
              <span>{flashlight.beam_distance_m} m</span>
            </div>
          )}
          {flashlight.battery_type && (
            <div className="flex items-center gap-1">
              <Battery size={12} className="text-green-500" />
              <span>{flashlight.battery_type}</span>
            </div>
          )}
          {flashlight.price_usd && (
            <div className="flex items-center gap-1">
              <DollarSign size={12} className="text-slate-400" />
              <span>${flashlight.price_usd}</span>
            </div>
          )}
        </div>

        <div className="mt-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 select-none">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleCompare(flashlight.id)}
              className="accent-brand-500"
            />
            Compare
          </label>
        </div>
      </div>
    </div>
  )
}
