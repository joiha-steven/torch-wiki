'use client'

import { useState, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
}

// Memoised: with a boolean `isSelected` (instead of the whole compareIds array)
// only the cards whose selection actually changed re-render on a compare toggle.
function FlashlightCard({ flashlight, isSelected, onToggleCompare, priority = false }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const { wishlistIds, collectionIds, toggleWishlist, toggleCollection } = useAuth()
  const inWishlist = wishlistIds.has(flashlight.id)
  const inCollection = collectionIds.has(flashlight.id)

  // Monochrome spec line — mono numbers, hairline dots between values
  const specParts = [
    flashlight.max_lumens      ? `${flashlight.max_lumens.toLocaleString()} lm` : null,
    flashlight.beam_distance_m ? `${flashlight.beam_distance_m} m`              : null,
    formatBatteries(flashlight, false),
  ].filter(Boolean) as string[]

  return (
    <div className={`glass-card rounded-[18px] p-3.5 flex flex-col ${isSelected ? 'is-selected' : ''}`}>

      {/* Thumbnail — translucent glass fill, fixed ratio so cards stay even */}
      <Link href={`/${flashlight.slug}`} className="block" prefetch={false}>
        <div className="relative aspect-[3/2] rounded-[12px] overflow-hidden mb-3.5 bg-plate">
          {flashlight.image_url ? (
            <Image
              src={flashlight.image_url}
              alt={`${flashlight.brand} ${flashlight.model}`}
              fill
              sizes="(max-width: 819px) calc(50vw - 24px), (max-width: 1100px) calc(33vw - 24px), calc(25vw - 24px)"
              priority={priority}
              onLoad={() => setImgLoaded(true)}
              // Above-the-fold (priority) images skip the JS-driven opacity fade —
              // otherwise the LCP image stays invisible until React hydrates and
              // fires onLoad, adding ~2.3s of LCP "render delay". They paint as
              // soon as the bytes decode, straight from the server HTML.
              className={`object-contain p-1 ${priority ? '' : `img-load ${imgLoaded ? 'is-loaded' : ''}`}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="52" height="32" viewBox="0 0 52 32" fill="none" aria-hidden>
                <rect x="14" y="10" width="24" height="12" rx="3" fill="#c7c7bf" />
                <rect x="6"  y="13" width="10" height="6"  rx="2" fill="#c7c7bf" />
                <circle cx="44" cy="16" r="5" fill="#c7c7bf" opacity="0.6" />
                <circle cx="44" cy="16" r="2.5" fill="#c7c7bf" />
              </svg>
            </div>
          )}
          {flashlight.is_discontinued && (
            <span className="absolute top-2 right-2 bg-[#17171a]/75 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
              Disc.
            </span>
          )}
        </div>
      </Link>

      {/* Category label */}
      <div className="min-h-[16px] mb-1.5">
        {flashlight.category && (
          <span className="text-[11px] font-medium text-ink-3">
            {flashlight.category}
          </span>
        )}
      </div>

      {/* Brand + Model — flex-1 keeps every card the same height */}
      <div className="flex-1">
        <Link
          href={`/brand/${brandSlug(flashlight.brand)}`}
          prefetch={false}
          className="text-[12.5px] text-ink-2 leading-none mb-0.5 inline-block hover:text-brand-600 transition-colors"
        >
          {flashlight.brand}
        </Link>
        <Link href={`/${flashlight.slug}`} className="block" prefetch={false}>
          <h3 className="text-[15px] font-semibold text-ink leading-snug tracking-[-0.01em]">{flashlight.model}</h3>
        </Link>
      </div>

      {/* Monochrome spec line — fixed height so missing-spec cards don't shrink */}
      <p className="mt-2.5 font-mono text-[11.5px] text-ink-2 tracking-[-0.01em] min-h-4 truncate">
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

      {/* Foot — price + actions */}
      <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
        <span className="font-mono text-[14px] font-semibold text-ink">
          {flashlight.price_usd ? `$${flashlight.price_usd.toLocaleString()}` : ''}
        </span>

        <div className="flex items-center gap-1 pl-2">
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
            <Heart
              size={16}
              className={inWishlist ? 'text-brand-500' : ''}
              fill={inWishlist ? 'currentColor' : 'none'}
            />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); toggleCollection(flashlight.id) }}
            title={inCollection ? 'Remove from collection' : 'Add to collection'}
            aria-label={`${inCollection ? 'Remove' : 'Add'} ${flashlight.brand} ${flashlight.model} ${inCollection ? 'from' : 'to'} collection`}
            aria-pressed={inCollection}
            className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:bg-black/5 dark:hover:bg-white/10 hover:text-ink transition-colors"
          >
            <Bookmark
              size={16}
              className={inCollection ? 'text-brand-500' : ''}
              fill={inCollection ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(FlashlightCard)
