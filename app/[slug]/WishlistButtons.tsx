'use client'

import { Heart, Bookmark } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

type Props = { flashlightId: string }

export default function WishlistButtons({ flashlightId }: Props) {
  const { wishlistIds, collectionIds, toggleWishlist, toggleCollection } = useAuth()
  const inWishlist = wishlistIds.has(flashlightId)
  const inCollection = collectionIds.has(flashlightId)

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => toggleWishlist(flashlightId)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
          inWishlist
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            : 'border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-500'
        }`}
      >
        <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
        {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
      </button>
      <button
        onClick={() => toggleCollection(flashlightId)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
          inCollection
            ? 'bg-brand-50 border-brand-300 text-brand-700 hover:bg-brand-100'
            : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
        }`}
      >
        <Bookmark size={15} fill={inCollection ? 'currentColor' : 'none'} />
        {inCollection ? 'In Collection' : 'Add to Collection'}
      </button>
    </div>
  )
}
