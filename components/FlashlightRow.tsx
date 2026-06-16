'use client'

import { memo } from 'react'
import Image from 'next/image'
import HoverPrefetchLink from './HoverPrefetchLink'
import { Heart, Bookmark, GitCompare } from 'lucide-react'
import { Flashlight } from '@/lib/types'
import { formatBatteries } from '@/lib/battery'
import { brandSlug } from '@/lib/brand'
import { useAuth } from '@/lib/auth-context'

type Props = {
  flashlight: Flashlight
  isSelected: boolean
  onToggleCompare: (id: string) => void
  priority?: boolean
  eager?: boolean
}

// Horizontal list-mode row (Newegg/Best-Buy style): small thumbnail + brand/model
// + an inline spec strip (lumens · throw · battery · weight) + price + actions.
// Shares the same data + wishlist/compare/prefetch logic as FlashlightCard.
function FlashlightRow({ flashlight, isSelected, onToggleCompare, priority = false, eager = false }: Props) {
  const { wishlistIds, collectionIds, toggleWishlist, toggleCollection } = useAuth()
  const inWishlist = wishlistIds.has(flashlight.id)
  const inCollection = collectionIds.has(flashlight.id)

  const specParts = [
    flashlight.max_lumens      ? `${flashlight.max_lumens.toLocaleString()} lm` : null,
    flashlight.beam_distance_m ? `${flashlight.beam_distance_m} m`              : null,
    formatBatteries(flashlight, false),
    flashlight.weight_g        ? `${flashlight.weight_g} g`                     : null,
  ].filter(Boolean) as string[]

  return (
    <div className={`glass-card rounded-[14px] p-3 flex items-center gap-3.5 sm:gap-4 ${isSelected ? 'is-selected' : ''}`}>

      {/* Thumbnail */}
      <HoverPrefetchLink href={`/${flashlight.slug}`} className="shrink-0">
        <div className="relative w-[76px] h-[57px] sm:w-[92px] sm:h-[69px] rounded-[10px] overflow-hidden bg-plate">
          {flashlight.image_url ? (
            <Image
              src={flashlight.image_url}
              alt={`${flashlight.brand} ${flashlight.model}`}
              fill
              sizes="92px"
              priority={priority}
              fetchPriority={priority ? 'high' : undefined}
              loading={priority ? undefined : eager ? 'eager' : 'lazy'}
              className="object-contain p-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="40" height="26" viewBox="0 0 52 32" fill="none" aria-hidden>
                <rect x="14" y="10" width="24" height="12" rx="3" fill="#c7c7bf" />
                <rect x="6" y="13" width="10" height="6" rx="2" fill="#c7c7bf" />
                <circle cx="44" cy="16" r="5" fill="#c7c7bf" opacity="0.6" />
                <circle cx="44" cy="16" r="2.5" fill="#c7c7bf" />
              </svg>
            </div>
          )}
        </div>
      </HoverPrefetchLink>

      {/* Brand / model / specs */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <HoverPrefetchLink
            href={`/brand/${brandSlug(flashlight.brand)}`}
            className="text-[12px] text-ink-2 leading-none hover:text-brand-600 transition-colors truncate"
          >
            {flashlight.brand}
          </HoverPrefetchLink>
          {flashlight.category && (
            <span className="text-[11px] font-medium text-ink-3 shrink-0">· {flashlight.category}</span>
          )}
          {flashlight.is_discontinued && (
            <span className="text-[10px] font-medium text-ink-3 border border-line rounded px-1.5 py-px shrink-0">Discontinued</span>
          )}
        </div>
        <HoverPrefetchLink href={`/${flashlight.slug}`} className="block">
          <h3 className="text-[15px] font-semibold text-ink leading-snug tracking-[-0.01em] truncate">{flashlight.model}</h3>
        </HoverPrefetchLink>
        <p className="mt-1 font-mono text-[11.5px] text-ink-2 tracking-[-0.01em] truncate">
          {specParts.length ? (
            specParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="text-line-strong mx-[5px]">·</span>}
                {part}
              </span>
            ))
          ) : (
            <span className="text-ink-3">No specs yet</span>
          )}
        </p>
      </div>

      {/* Price + actions */}
      <div className="shrink-0 flex items-center gap-2 sm:gap-3 pl-1">
        {flashlight.price_usd ? (
          <span className="font-mono text-[14px] font-semibold text-ink hidden sm:inline">${flashlight.price_usd.toLocaleString()}</span>
        ) : null}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.preventDefault(); onToggleCompare(flashlight.id) }}
            title={isSelected ? 'Remove from compare' : 'Add to compare'}
            aria-label={`${isSelected ? 'Remove' : 'Add'} ${flashlight.brand} ${flashlight.model} ${isSelected ? 'from' : 'to'} compare`}
            aria-pressed={isSelected}
            className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:bg-black/5 dark:hover:bg-white/10 hover:text-ink transition-colors"
          >
            <GitCompare size={16} className={isSelected ? 'text-brand-500' : ''} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(flashlight.id) }}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={`${inWishlist ? 'Remove' : 'Add'} ${flashlight.brand} ${flashlight.model} ${inWishlist ? 'from' : 'to'} wishlist`}
            aria-pressed={inWishlist}
            className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:bg-black/5 dark:hover:bg-white/10 hover:text-ink transition-colors"
          >
            <Heart size={16} className={inWishlist ? 'text-brand-500' : ''} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); toggleCollection(flashlight.id) }}
            title={inCollection ? 'Remove from collection' : 'Add to collection'}
            aria-label={`${inCollection ? 'Remove' : 'Add'} ${flashlight.brand} ${flashlight.model} ${inCollection ? 'from' : 'to'} collection`}
            aria-pressed={inCollection}
            className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:bg-black/5 dark:hover:bg-white/10 hover:text-ink transition-colors"
          >
            <Bookmark size={16} className={inCollection ? 'text-brand-500' : ''} fill={inCollection ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(FlashlightRow)
