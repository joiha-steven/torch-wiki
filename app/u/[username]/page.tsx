import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'
import Header from '@/components/Header'
import ProfileTabs, { ProfileItem } from './ProfileTabs'

// ISR: public profile data changes rarely (only when a contribution is approved),
// so cache the rendered page at the edge for 60s instead of recomputing every hit.
// Next emits `s-maxage=60, stale-while-revalidate` automatically for ISR pages.
// A dynamic segment with NO generateStaticParams renders dynamically by default,
// so revalidate alone isn't enough — returning [] opts it into on-demand ISR
// (pages built on first request, then cached/revalidated). See Next's
// generateStaticParams docs.
export const revalidate = 60
export async function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username}`,
    description: `Flashlight contributions and collection by ${username} on torch.EDC.wiki.`,
    alternates: { canonical: `${SITE_URL}/u/${username}` },
  }
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

  // Collection - only when the user has opted in. Public view shows flashlight + quantity only
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
        .is('deleted_at', null)
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
        .is('deleted_at', null)
    : { data: [] }

  const imageBySlug = Object.fromEntries(
    (newFlashlights ?? []).map(f => [f.slug, f.image_url])
  )

  // Member since - first submission or profile update_at
  const memberSince = subs.length > 0
    ? subs[subs.length - 1].created_at
    : profile.updated_at

  // Build serializable lists for the client tab component
  const added: ProfileItem[] = newSubs.map(sub => {
    const d = sub.data as { brand?: string; model?: string } | null
    const brand = d?.brand ?? ''
    const model = d?.model ?? ''
    const slug = makeSlug(brand, model)
    return { key: sub.id, slug, brand, model, imgUrl: imageBySlug[slug] ?? null, date: formatDate(sub.created_at) }
  })

  const seen = new Set<string>()
  const edits: ProfileItem[] = editSubs.flatMap(sub => {
    if (!sub.target_id || seen.has(sub.target_id)) return []
    seen.add(sub.target_id)
    const fl = flashlightById[sub.target_id]
    if (!fl) return []
    return [{ key: sub.target_id, slug: fl.slug, brand: fl.brand, model: fl.model, imgUrl: fl.image_url, date: formatDate(sub.created_at) }]
  })

  const collectionItems: ProfileItem[] = collection.map(item => ({
    key: item.flashlight_id,
    slug: item.flashlights!.slug,
    brand: item.flashlights!.brand,
    model: item.flashlights!.model,
    imgUrl: item.flashlights!.image_url,
    quantity: item.quantity,
  }))

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-[1242px] mx-auto px-7 py-8">
        <div className="max-w-3xl mx-auto">

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold text-ink">{username}</h1>
            <p className="text-xs text-ink-3 mt-0.5">Member since {formatDate(memberSince)}</p>
          </div>
          {/* Stats chips */}
          <div className="ml-auto flex gap-3 text-xs">
            {newSubs.length > 0 && (
              <span className="bg-panel border border-line rounded-full px-3 py-1 text-ink-2">
                <span className="font-semibold text-ink">{newSubs.length}</span> added
              </span>
            )}
            {editSubs.length > 0 && (
              <span className="bg-panel border border-line rounded-full px-3 py-1 text-ink-2">
                <span className="font-semibold text-ink">{editSubs.length}</span> edits
              </span>
            )}
            {collectionItems.length > 0 && (
              <span className="bg-panel border border-line rounded-full px-3 py-1 text-ink-2">
                <span className="font-semibold text-ink">{collectionItems.length}</span> owned
              </span>
            )}
          </div>
        </div>

        <ProfileTabs
          added={added}
          edits={edits}
          collection={collectionItems}
          showCollection={!!profile.show_collection}
        />
        </div>
      </div>
    </div>
  )
}
