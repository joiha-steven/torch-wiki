import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Plus, Pencil, Bookmark } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `${username} — torch.EDC.wiki` }
}

function makeSlug(brand: string, model: string) {
  return `${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nickname, updated_at, show_collection')
    .eq('nickname', username)
    .single()

  if (!profile) notFound()

  // Use service role to bypass RLS on flashlight_submissions / user_collections
  const adminDb = getSupabaseAdmin()

  // Collection — only when the user has opted in. Public view shows flashlight + quantity only
  // (never purchase price or date).
  type CollectionRow = {
    flashlight_id: string
    quantity: number
    flashlights: { brand: string; model: string; slug: string; image_url: string | null } | null
  }
  const { data: collectionData } = profile.show_collection
    ? await adminDb
        .from('user_collections')
        .select('flashlight_id, quantity, flashlights(brand, model, slug, image_url)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
    : { data: [] }
  const collection = ((collectionData ?? []) as unknown as CollectionRow[]).filter(c => c.flashlights)

  // Fetch approved submissions
  const { data: submissions } = await adminDb
    .from('flashlight_submissions')
    .select('id, type, created_at, data, target_id')
    .eq('user_id', profile.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  const subs = submissions ?? []
  const newSubs = subs.filter(s => s.type === 'new')
  const editSubs = subs.filter(s => s.type === 'edit')

  // Batch-fetch target flashlights for edits
  const editTargetIds = editSubs.map(s => s.target_id).filter(Boolean) as string[]
  const { data: editedFlashlights } = editTargetIds.length
    ? await supabase
        .from('flashlights')
        .select('id, brand, model, slug, image_url')
        .in('id', editTargetIds)
    : { data: [] }

  const flashlightById = Object.fromEntries(
    (editedFlashlights ?? []).map(f => [f.id, f])
  )

  // For new submissions, look up the actual flashlight by slug to get image_url
  const newSlugs = newSubs.map(s => {
    const d = s.data as { brand?: string; model?: string } | null
    return makeSlug(d?.brand ?? '', d?.model ?? '')
  }).filter(Boolean)

  const { data: newFlashlights } = newSlugs.length
    ? await supabase
        .from('flashlights')
        .select('slug, image_url')
        .in('slug', newSlugs)
    : { data: [] }

  const imageBySlug = Object.fromEntries(
    (newFlashlights ?? []).map(f => [f.slug, f.image_url])
  )

  // Member since — first submission or profile update_at
  const memberSince = subs.length > 0
    ? subs[subs.length - 1].created_at
    : profile.updated_at

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 mb-8">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{username}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Member since {formatDate(memberSince)}</p>
          </div>
          {/* Stats chips */}
          <div className="ml-auto flex gap-3 text-xs">
            {newSubs.length > 0 && (
              <span className="bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600">
                <span className="font-semibold text-slate-900">{newSubs.length}</span> added
              </span>
            )}
            {editSubs.length > 0 && (
              <span className="bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600">
                <span className="font-semibold text-slate-900">{editSubs.length}</span> edits
              </span>
            )}
            {collection.length > 0 && (
              <span className="bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600">
                <span className="font-semibold text-slate-900">{collection.length}</span> owned
              </span>
            )}
          </div>
        </div>

        {subs.length === 0 && collection.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 text-center">
            <p className="text-slate-400 text-sm">No approved contributions yet.</p>
          </div>
        )}

        {/* Flashlights added */}
        {newSubs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-400 tracking-wide mb-3 flex items-center gap-2">
              <Plus size={13} /> Flashlights added
            </h2>
            <div className="space-y-2">
              {newSubs.map(sub => {
                const d = sub.data as { brand?: string; model?: string } | null
                const brand = d?.brand ?? ''
                const model = d?.model ?? ''
                const slug = makeSlug(brand, model)
                const imgUrl = imageBySlug[slug] ?? null
                return (
                  <Link
                    key={sub.id}
                    href={`/${slug}`}
                    className="flex items-center gap-4 bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl px-4 py-3 transition-colors"
                  >
                    <div className="relative w-12 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      {imgUrl
                        ? <Image src={imgUrl} alt="" fill className="object-contain p-1" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">—</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">{brand}</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{model}</p>
                    </div>
                    <p className="text-xs text-slate-400 shrink-0">{formatDate(sub.created_at)}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Edits contributed — deduplicated by flashlight */}
        {editSubs.length > 0 && (() => {
          const seen = new Set<string>()
          const unique = editSubs.filter(s => {
            if (!s.target_id || seen.has(s.target_id)) return false
            seen.add(s.target_id)
            return true
          })
          return (
            <div>
              <h2 className="text-xs font-semibold text-slate-400 tracking-wide mb-3 flex items-center gap-2">
                <Pencil size={13} /> Edit contributions
              </h2>
              <div className="space-y-2">
                {unique.map(sub => {
                  const fl = sub.target_id ? flashlightById[sub.target_id] : null
                  if (!fl) return null
                  return (
                    <Link
                      key={sub.target_id}
                      href={`/${fl.slug}`}
                      className="flex items-center gap-4 bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl px-4 py-3 transition-colors"
                    >
                      <div className="relative w-12 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                        {fl.image_url
                          ? <Image src={fl.image_url} alt="" fill className="object-contain p-1" />
                          : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">—</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">{fl.brand}</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{fl.model}</p>
                      </div>
                      <p className="text-xs text-slate-400 shrink-0">{formatDate(sub.created_at)}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Collection — opt-in, shows flashlight + quantity only (no price or purchase date) */}
        {collection.length > 0 && (
          <div className={subs.length > 0 ? 'mt-8' : ''}>
            <h2 className="text-xs font-semibold text-slate-400 tracking-wide mb-3 flex items-center gap-2">
              <Bookmark size={13} /> Collection
            </h2>
            <div className="space-y-2">
              {collection.map(item => {
                const fl = item.flashlights!
                return (
                  <Link
                    key={item.flashlight_id}
                    href={`/${fl.slug}`}
                    className="flex items-center gap-4 bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl px-4 py-3 transition-colors"
                  >
                    <div className="relative w-12 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      {fl.image_url
                        ? <Image src={fl.image_url} alt="" fill className="object-contain p-1" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">—</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">{fl.brand}</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{fl.model}</p>
                    </div>
                    {item.quantity > 1 && (
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 rounded px-2 py-0.5 shrink-0">
                        ×{item.quantity}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
