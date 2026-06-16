'use client'

import { Heart, Bookmark } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

type Props = { flashlightId: string }

export default function WishlistButtons({ flashlightId }: Props) {
  const { wishlistIds, collectionIds, toggleWishlist, toggleCollection } = useAuth()
  const inWishlist = wishlistIds.has(flashlightId)
  const inCollection = collectionIds.has(flashlightId)

  return (
    <div className="flex gap-2.5 mt-6">
      {/* Primary - Add to collection (amber, subtle gloss + glow) */}
      <button
        onClick={() => toggleCollection(flashlightId)}
        className="flex items-center gap-2 h-11 px-5 rounded-full text-sm font-semibold text-[#1d1604] bg-brand-500 hover:brightness-[0.97] transition-[filter]"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 18px rgba(235,160,11,0.28)' }}
      >
        <Bookmark size={16} fill={inCollection ? 'currentColor' : 'none'} />
        {inCollection ? 'In Collection' : 'Add to Collection'}
      </button>

      {/* Secondary - Wishlist (glass ghost) */}
      <button
        onClick={() => toggleWishlist(flashlightId)}
        className="glass flex items-center gap-2 h-11 px-5 rounded-full text-sm font-semibold text-ink hover:border-white transition-colors"
      >
        <Heart size={16} className={inWishlist ? 'text-brand-500' : ''} fill={inWishlist ? 'currentColor' : 'none'} />
        {inWishlist ? 'In Wishlist' : 'Wishlist'}
      </button>
    </div>
  )
}
