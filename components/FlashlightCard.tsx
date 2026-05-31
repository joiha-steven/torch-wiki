'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Zap, Target, Battery, DollarSign, Heart, Bookmark } from 'lucide-react'
import { Flashlight } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

type Props = {
  flashlight: Flashlight
  compareIds: string[]
  onToggleCompare: (id: string) => void
}

export default function FlashlightCard({ flashlight, compareIds, onToggleCompare }: Props) {
  const isSelected = compareIds.includes(flashlight.id)
  const { wishlistIds, collectionIds, toggleWishlist, toggleCollection } = useAuth()
  const inWishlist = wishlistIds.has(flashlight.id)
  const inCollection = collectionIds.has(flashlight.id)

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

        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 select-none">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleCompare(flashlight.id)}
              className="accent-brand-500"
            />
            Compare
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.preventDefault(); toggleWishlist(flashlight.id) }}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              className="p-1 rounded hover:bg-slate-100 transition-colors"
            >
              <Heart
                size={14}
                className={inWishlist ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}
                fill={inWishlist ? 'currentColor' : 'none'}
              />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); toggleCollection(flashlight.id) }}
              title={inCollection ? 'Remove from collection' : 'Add to collection'}
              className="p-1 rounded hover:bg-slate-100 transition-colors"
            >
              <Bookmark
                size={14}
                className={inCollection ? 'text-brand-500' : 'text-slate-300 hover:text-brand-400'}
                fill={inCollection ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
