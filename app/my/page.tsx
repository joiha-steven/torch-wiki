'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Bookmark, LayoutGrid, List, Pencil } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { CollectionItem, WishlistItem } from '@/lib/types'
import Header from '@/components/Header'
import CollectionEditModal from '@/components/CollectionEditModal'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function MyListsPage() {
  const { user, loading, openAuthModal } = useAuth()
  const [tab, setTab] = useState<'wishlist' | 'collection'>('wishlist')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [collection, setCollection] = useState<CollectionItem[]>([])
  const [fetching, setFetching] = useState(false)
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null)

  useEffect(() => {
    if (!user) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetching(true)
    Promise.all([
      supabase
        .from('user_wishlists')
        .select('id, user_id, flashlight_id, created_at, flashlights(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_collections')
        .select('*, flashlights(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]).then(([wRes, cRes]) => {
      setWishlist((wRes.data ?? []).filter((r) => r.flashlights) as unknown as WishlistItem[])
      setCollection((cRes.data ?? []).filter((r) => r.flashlights) as unknown as CollectionItem[])
      setFetching(false)
    })
  }, [user])

  function handleSave(id: string, updates: Partial<CollectionItem>) {
    setCollection((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item))
  }

  const totalValue = collection.reduce((sum, item) => {
    return item.purchase_price ? sum + item.purchase_price * (item.quantity ?? 1) : sum
  }, 0)

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-[1280px] mx-auto px-7 py-8">

        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.02em]">My Lists</h1>
          <p className="mt-2 text-[13px] text-ink-2">Your wishlist and collection.</p>
        </div>

        {loading ? (
          <div className="text-ink-3 text-sm">Loading…</div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-ink-3">Sign in to see your wishlist and collection.</p>
            <button
              onClick={openAuthModal}
              className="bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium px-5 py-2 rounded-lg"
            >
              Sign in
            </button>
          </div>
        ) : (
          <>
            {/* Tabs + controls */}
            <div className="relative flex flex-col sm:block items-center mb-8">
              <div className="flex gap-1 bg-panel border border-line rounded-2xl p-1 w-fit mx-auto flex-wrap justify-center">
                <button
                  onClick={() => setTab('wishlist')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                    tab === 'wishlist' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <Heart size={14} fill={tab === 'wishlist' ? 'currentColor' : 'none'} />
                  Wishlist
                  {wishlist.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'wishlist' ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/[0.05]'}`}>
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setTab('collection')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                    tab === 'collection' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <Bookmark size={14} fill={tab === 'collection' ? 'currentColor' : 'none'} />
                  Collection
                  {collection.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'collection' ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/[0.05]'}`}>
                      {collection.length}
                    </span>
                  )}
                </button>
              </div>

              {tab === 'collection' && collection.length > 0 && (
                <div className="mt-3 sm:mt-0 flex items-center gap-3 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2">
                  {totalValue > 0 && (
                    <span className="text-sm text-ink-3">
                      Total: <span className="font-semibold text-ink">${totalValue.toLocaleString()}</span>
                    </span>
                  )}
                  <div className="flex bg-panel border border-line rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-ink text-surface' : 'text-ink-3 hover:text-ink-2'}`}
                      title="Grid view"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-ink text-surface' : 'text-ink-3 hover:text-ink-2'}`}
                      title="List view"
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {fetching ? (
              <div className="text-ink-3 text-sm">Loading…</div>
            ) : tab === 'wishlist' ? (
              wishlist.length === 0 ? (
                <EmptyState type="wishlist" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {wishlist.map((item) => (
                    <WishlistCard key={item.id} item={item} />
                  ))}
                </div>
              )
            ) : collection.length === 0 ? (
              <EmptyState type="collection" />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {collection.map((item) => (
                  <CollectionCard key={item.id} item={item} onEdit={() => setEditingItem(item)} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {collection.map((item) => (
                  <CollectionRow key={item.id} item={item} onEdit={() => setEditingItem(item)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {editingItem && (
        <CollectionEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function EmptyState({ type }: { type: 'wishlist' | 'collection' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      {type === 'wishlist' ? (
        <>
          <Heart size={40} className="text-slate-200" />
          <p className="text-ink-3">Your wishlist is empty.</p>
          <p className="text-ink-3 text-sm">Click the ♥ icon on any flashlight to add it.</p>
        </>
      ) : (
        <>
          <Bookmark size={40} className="text-slate-200" />
          <p className="text-ink-3">Your collection is empty.</p>
          <p className="text-ink-3 text-sm">Click the bookmark icon on any flashlight to add it.</p>
        </>
      )}
      <Link href="/" className="mt-2 text-sm text-brand-600 hover:underline">Browse flashlights →</Link>
    </div>
  )
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const f = item.flashlights
  return (
    <Link
      href={`/${f.slug}`}
      className="bg-panel rounded-xl border border-line hover:border-line-strong transition-colors overflow-hidden"
    >
      <div className="relative h-36 bg-panel flex items-center justify-center">
        {f.image_url ? (
          <Image src={f.image_url} alt={`${f.brand} ${f.model}`} fill className="object-contain p-3" />
        ) : (
          <div className="text-slate-300 text-xs">No image</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-ink-3">{f.brand}</p>
        <p className="text-sm font-semibold text-ink leading-tight">{f.model}</p>
        {f.price_usd && <p className="text-xs text-brand-600 font-medium mt-1">${f.price_usd}</p>}
      </div>
    </Link>
  )
}

function CollectionCard({ item, onEdit }: { item: CollectionItem; onEdit: () => void }) {
  const f = item.flashlights
  return (
    <div className="group relative bg-panel rounded-xl border border-line hover:border-line-strong transition-colors overflow-hidden">
      <Link href={`/${f.slug}`}>
        <div className="relative h-36 bg-plate flex items-center justify-center">
          {f.image_url ? (
            <Image src={f.image_url} alt={`${f.brand} ${f.model}`} fill className="object-contain p-3" />
          ) : (
            <div className="text-slate-300 text-xs">No image</div>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-ink-3">{f.brand}</p>
          <p className="text-sm font-semibold text-ink leading-tight">{f.model}</p>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
            {item.purchase_price && (
              <span className="text-xs text-brand-600 font-medium">${item.purchase_price}</span>
            )}
            {(item.quantity ?? 1) > 1 && (
              <span className="text-xs text-ink-3">×{item.quantity}</span>
            )}
            {item.material && (
              <span className="text-xs text-ink-3 truncate">{item.material}</span>
            )}
            {item.color && (
              <span className="text-xs text-ink-3 truncate">{item.color}</span>
            )}
            {item.purchase_date && (
              <span className="text-xs text-ink-3">{formatDate(item.purchase_date)}</span>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); onEdit() }}
        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-panel border border-line rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit"
      >
        <Pencil size={12} className="text-ink-2" />
      </button>
    </div>
  )
}

function MetaCell({ label, value, accent }: { label: string; value: string | null; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-ink-3 leading-none mb-0.5">{label}</p>
      <p className={`text-xs truncate ${value ? (accent ? 'text-brand-600 font-medium' : 'text-ink-2') : 'text-slate-300'}`}>
        {value ?? '-'}
      </p>
    </div>
  )
}


function CollectionRow({ item, onEdit }: { item: CollectionItem; onEdit: () => void }) {
  const f = item.flashlights
  return (
    <div className="flex items-center gap-3 bg-panel rounded-xl border border-line px-3 py-3 hover:border-line-strong transition-colors">
      <div className="relative w-16 h-12 shrink-0 bg-plate rounded-lg overflow-hidden">
        {f.image_url ? (
          <Image src={f.image_url} alt={`${f.brand} ${f.model}`} fill className="object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">-</div>
        )}
      </div>

      <div className="w-36 shrink-0 min-w-0">
        <Link href={`/${f.slug}`} className="hover:text-brand-600 block">
          <p className="text-[10px] text-ink-3">{f.brand}</p>
          <p className="text-sm font-semibold text-ink truncate leading-tight">{f.model}</p>
        </Link>
        <span className="text-xs text-ink-3">×{item.quantity ?? 1}</span>
      </div>

      <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 flex-1 min-w-0">
        <MetaCell label="Material" value={item.material} />
        <MetaCell label="Color" value={item.color} />
        <MetaCell label="Price Paid" value={item.purchase_price ? `$${item.purchase_price}` : null} accent />
        <MetaCell label="Date" value={item.purchase_date ? formatDate(item.purchase_date) : null} />
      </div>

      {/* mobile compact meta */}
      <div className="sm:hidden flex-1 min-w-0 grid grid-cols-2 gap-x-3 gap-y-1">
        <MetaCell label="Material" value={item.material} />
        <MetaCell label="Color" value={item.color} />
        <MetaCell label="Price Paid" value={item.purchase_price ? `$${item.purchase_price}` : null} accent />
        <MetaCell label="Date" value={item.purchase_date ? formatDate(item.purchase_date) : null} />
      </div>

      <button
        onClick={onEdit}
        className="p-2 text-ink-3 hover:text-ink-2 hover:bg-slate-100 dark:bg-white/[0.05] rounded-lg transition-colors shrink-0"
        title="Edit"
      >
        <Pencil size={15} />
      </button>
    </div>
  )
}
