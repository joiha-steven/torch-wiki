'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export type ProfileItem = {
  key: string
  slug: string
  brand: string
  model: string
  imgUrl: string | null
  date?: string
  quantity?: number
}

type Props = {
  added: ProfileItem[]
  edits: ProfileItem[]
  collection: ProfileItem[]
  showCollection: boolean
}

function ItemRow({ item }: { item: ProfileItem }) {
  return (
    <Link
      href={`/${item.slug}`}
      className="flex items-center gap-4 bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl px-4 py-3 transition-colors"
    >
      <div className="relative w-12 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
        {item.imgUrl
          ? <Image src={item.imgUrl} alt="" fill className="object-contain p-1" />
          : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">—</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{item.brand}</p>
        <p className="text-sm font-medium text-slate-900 truncate">{item.model}</p>
      </div>
      {item.quantity != null && item.quantity > 1 && (
        <span className="text-xs font-mono text-slate-500 bg-slate-100 rounded px-2 py-0.5 shrink-0">
          ×{item.quantity}
        </span>
      )}
      {item.date && <p className="text-xs text-slate-400 shrink-0">{item.date}</p>}
    </Link>
  )
}

const sectionTitle = 'text-xs font-semibold text-slate-400 tracking-wide mb-3'

export default function ProfileTabs({ added, edits, collection, showCollection }: Props) {
  const [tab, setTab] = useState<'contribute' | 'collection'>('contribute')

  const hasContributions = added.length > 0 || edits.length > 0

  // Without an opted-in collection, there is only one view — render it without the tab bar.
  if (!showCollection) {
    return <ContributeView added={added} edits={edits} hasContributions={hasContributions} />
  }

  const TABS: { key: 'contribute' | 'collection'; label: string }[] = [
    { key: 'contribute', label: 'Contribute' },
    { key: 'collection', label: 'Collection' },
  ]

  return (
    <div>
      <div className="flex gap-1 bg-white border border-[#e7e7e1] rounded-xl p-1 w-fit mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'contribute'
        ? <ContributeView added={added} edits={edits} hasContributions={hasContributions} />
        : <CollectionView collection={collection} />
      }
    </div>
  )
}

function ContributeView({ added, edits, hasContributions }: { added: ProfileItem[]; edits: ProfileItem[]; hasContributions: boolean }) {
  if (!hasContributions) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 text-center">
        <p className="text-slate-400 text-sm">No approved contributions yet.</p>
      </div>
    )
  }
  return (
    <>
      {added.length > 0 && (
        <div className="mb-8">
          <h2 className={sectionTitle}>Flashlights added</h2>
          <div className="space-y-2">
            {added.map(item => <ItemRow key={item.key} item={item} />)}
          </div>
        </div>
      )}
      {edits.length > 0 && (
        <div>
          <h2 className={sectionTitle}>Edit contributions</h2>
          <div className="space-y-2">
            {edits.map(item => <ItemRow key={item.key} item={item} />)}
          </div>
        </div>
      )}
    </>
  )
}

function CollectionView({ collection }: { collection: ProfileItem[] }) {
  if (collection.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 text-center">
        <p className="text-slate-400 text-sm">No flashlights in collection yet.</p>
      </div>
    )
  }
  return (
    <div>
      <h2 className={sectionTitle}>Collection</h2>
      <div className="space-y-2">
        {collection.map(item => <ItemRow key={item.key} item={item} />)}
      </div>
    </div>
  )
}
