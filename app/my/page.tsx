'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Bookmark, ChevronLeft, LayoutGrid, List, Pencil } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        {loading ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-slate-500">Sign in to see your wishlist and collection.</p>
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
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => setTab('wishlist')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === 'wishlist' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Heart size={14} fill={tab === 'wishlist' ? 'currentColor' : 'none'} />
                  Wishlist
                  {wishlist.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'wishlist' ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setTab('collection')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === 'collection' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Bookmark size={14} fill={tab === 'collection' ? 'currentColor' : 'none'} />
                  Collection
                  {collection.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'collection' ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {collection.length}
                    </span>
                  )}
                </button>
              </div>

              {tab === 'collection' && collection.length > 0 && (
                <div className="flex items-center gap-3">
                  {totalValue > 0 && (
                    <span className="text-sm text-slate-500">
                      Total: <span className="font-semibold text-slate-800">${totalValue.toLocaleString()}</span>
                    </span>
                  )}
                  <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}
                      title="Grid view"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}
                      title="List view"
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {fetching ? (
              <div className="text-slate-400 text-sm">Loading…</div>
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
          <p className="text-slate-500">Your wishlist is empty.</p>
          <p className="text-slate-400 text-sm">Click the ♥ icon on any flashlight to add it.</p>
        </>
      ) : (
        <>
          <Bookmark size={40} className="text-slate-200" />
          <p className="text-slate-500">Your collection is empty.</p>
          <p className="text-slate-400 text-sm">Click the bookmark icon on any flashlight to add it.</p>
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
      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
    >
      <div className="relative h-36 bg-white flex items-center justify-center">
        {f.image_url ? (
          <Image src={f.image_url} alt={`${f.brand} ${f.model}`} fill className="object-contain p-3" />
        ) : (
          <div className="text-slate-300 text-xs">No image</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-slate-400">{f.brand}</p>
        <p className="text-sm font-semibold text-slate-900 leading-tight">{f.model}</p>
        {f.price_usd && <p className="text-xs text-brand-600 font-medium mt-1">${f.price_usd}</p>}
      </div>
    </Link>
  )
}

function CollectionCard({ item, onEdit }: { item: CollectionItem; onEdit: () => void }) {
  const f = item.flashlights
  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
      <Link href={`/${f.slug}`}>
        <div className="relative h-36 bg-white flex items-center justify-center">
          {f.image_url ? (
            <Image src={f.image_url} alt={`${f.brand} ${f.model}`} fill className="object-contain p-3" />
          ) : (
            <div className="text-slate-300 text-xs">No image</div>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-slate-400">{f.brand}</p>
          <p className="text-sm font-semibold text-slate-900 leading-tight">{f.model}</p>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
            {item.purchase_price && (
              <span className="text-xs text-brand-600 font-medium">${item.purchase_price}</span>
            )}
            {(item.quantity ?? 1) > 1 && (
              <span className="text-xs text-slate-500">×{item.quantity}</span>
            )}
            {item.material && (
              <span className="text-xs text-slate-400 truncate">{item.material}</span>
            )}
            {item.color && (
              <span className="text-xs text-slate-400 truncate">{item.color}</span>
            )}
            {item.purchase_date && (
              <span className="text-xs text-slate-400">{formatDate(item.purchase_date)}</span>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); onEdit() }}
        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white border border-slate-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        title="Chỉnh sửa"
      >
        <Pencil size={12} className="text-slate-600" />
      </button>
    </div>
  )
}

function MetaCell({ label, value, accent }: { label: string; value: string | null; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-slate-400 leading-none mb-0.5">{label}</p>
      <p className={`text-xs truncate ${value ? (accent ? 'text-brand-600 font-medium' : 'text-slate-700') : 'text-slate-300'}`}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function CollectionRow({ item, onEdit }: { item: CollectionItem; onEdit: () => void }) {
  const f = item.flashlights
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-3 py-3 hover:border-slate-300 transition-colors">
      <div className="relative w-16 h-12 shrink-0 bg-slate-50 rounded-lg overflow-hidden">
        {f.image_url ? (
          <Image src={f.image_url} alt={`${f.brand} ${f.model}`} fill className="object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">—</div>
        )}
      </div>

      <div className="w-36 shrink-0 min-w-0">
        <Link href={`/${f.slug}`} className="hover:text-brand-600 block">
          <p className="text-[10px] text-slate-400">{f.brand}</p>
          <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{f.model}</p>
        </Link>
        <span className="text-xs text-slate-400">×{item.quantity ?? 1}</span>
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
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        title="Chỉnh sửa"
      >
        <Pencil size={15} />
      </button>
    </div>
  )
}
