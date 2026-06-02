'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Bookmark } from 'lucide-react'
import { Flashlight } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

type Props = {
  flashlight: Flashlight
  compareIds: string[]
  onToggleCompare: (id: string) => void
  priority?: boolean
}

export default function FlashlightCard({ flashlight, compareIds, onToggleCompare, priority = false }: Props) {
  const isSelected = compareIds.includes(flashlight.id)
  const { wishlistIds, collectionIds, toggleWishlist, toggleCollection } = useAuth()
  const inWishlist = wishlistIds.has(flashlight.id)
  const inCollection = collectionIds.has(flashlight.id)

  // Compact spec line — monospace numbers, dots between values
  const specParts = [
    flashlight.max_lumens    ? `${flashlight.max_lumens.toLocaleString()} lm` : null,
    flashlight.beam_distance_m ? `${flashlight.beam_distance_m} m`            : null,
    flashlight.battery_type  ?? null,
  ].filter(Boolean)
  const specLine = specParts.join(' · ')

  return (
    <div className={`bg-white rounded-lg border transition-colors flex flex-col ${
      isSelected
        ? 'border-brand-500'
        : 'border-[#e7e7e1] hover:border-[#c8c8c0]'
    }`}>

      {/* Image */}
      <Link href={`/${flashlight.slug}`} className="block">
        <div className="relative h-40 bg-white rounded-t-lg overflow-hidden">
          {flashlight.image_url ? (
            <Image
              src={flashlight.image_url}
              alt={`${flashlight.brand} ${flashlight.model}`}
              fill
              sizes="(max-width: 767px) calc(50vw - 24px), (max-width: 1023px) calc(33vw - 24px), calc(25vw - 24px)"
              priority={priority}
              className="object-contain p-4"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="52" height="32" viewBox="0 0 52 32" fill="none" aria-hidden>
                <rect x="14" y="10" width="24" height="12" rx="3" fill="#d4d4cc"/>
                <rect x="6"  y="13" width="10" height="6"  rx="2" fill="#d4d4cc"/>
                <circle cx="44" cy="16" r="5" fill="#d4d4cc" opacity="0.6"/>
                <circle cx="44" cy="16" r="2.5" fill="#d4d4cc"/>
              </svg>
            </div>
          )}
          {flashlight.is_discontinued && (
            <span className="absolute top-2 right-2 bg-slate-800/80 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
              Disc.
            </span>
          )}
        </div>
      </Link>

      {/* Body — flex-1 so all cards fill same height */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* Category badge */}
        <div className="mb-2 min-h-[20px]">
          {flashlight.category && (
            <span className="inline-block bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded font-medium">
              {flashlight.category}
            </span>
          )}
        </div>

        {/* Brand + Model — div carries flex-1, Link only wraps the text */}
        <div className="flex-1">
          <Link href={`/${flashlight.slug}`} className="block">
            <p className="text-xs text-slate-400 leading-none mb-0.5">{flashlight.brand}</p>
            <h3 className="font-semibold text-slate-900 text-sm leading-snug">{flashlight.model}</h3>
          </Link>
        </div>

        {/* Spec line — fixed height so missing-spec cards don't shrink */}
        <p className="mt-2.5 text-xs text-slate-400 font-mono h-4 truncate">
          {specLine || <span className="text-slate-300 not-italic">—</span>}
        </p>

        {/* Price + actions */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900 font-mono">
            {flashlight.price_usd ? `$${flashlight.price_usd.toLocaleString()}` : ''}
          </span>

          <div className="flex items-center gap-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400 select-none mr-1.5">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleCompare(flashlight.id)}
                className="accent-brand-500 w-3 h-3"
              />
              Compare
            </label>
            <button
              onClick={(e) => { e.preventDefault(); toggleWishlist(flashlight.id) }}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              className="p-1 rounded transition-colors hover:bg-gray-100"
            >
              <Heart
                size={13}
                className={inWishlist ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'}
                fill={inWishlist ? 'currentColor' : 'none'}
              />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); toggleCollection(flashlight.id) }}
              title={inCollection ? 'Remove from collection' : 'Add to collection'}
              className="p-1 rounded transition-colors hover:bg-gray-100"
            >
              <Bookmark
                size={13}
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
