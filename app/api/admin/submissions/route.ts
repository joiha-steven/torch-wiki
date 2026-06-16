import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { copy, del } from '@vercel/blob'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'

const ALLOWED_ACTIONS = new Set(['approved', 'rejected'])

const slugify = (brand: string, model: string) =>
  `${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Server-side copy within Vercel Blob - no data transfer through function
async function moveBlob(oldUrl: string, newPath: string): Promise<string> {
  const { url } = await copy(oldUrl, newPath, { access: 'public', addRandomSuffix: false })
  await del(oldUrl).catch(() => {}) // best-effort delete
  return url
}

function isSubmissionBlob(url: string) {
  return url?.includes('/submissions/manuals/')
}

async function movePdfs(d: Record<string, unknown>, slug: string) {
  const urls = (d.manual_urls as string[] | null | undefined)
  if (urls?.length) {
    d.manual_urls = await Promise.all(
      urls.map((url, i) => {
        if (!isSubmissionBlob(url)) return url
        const name = i === 0 ? 'manual.pdf' : `manual-${i}.pdf`
        return moveBlob(url, `flashlights/${slug}/${name}`).catch(() => url)
      })
    )
    d.manual_url = (d.manual_urls as string[])[0] ?? null
  } else if (d.manual_url && isSubmissionBlob(d.manual_url as string)) {
    d.manual_url = await moveBlob(d.manual_url as string, `flashlights/${slug}/manual.pdf`).catch(() => d.manual_url)
    d.manual_urls = [d.manual_url]
  }
}

export async function GET(request: Request) {
  const user = await getAdminUser(request)
  if (!user || (!user.isAdmin && !user.isModerator)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'

  // Delete suggestions (type='delete') live in the admin Delete tab, not here —
  // the pending/approved/rejected lists are for new + edit submissions only.
  const { data, error } = await admin
    .from('flashlight_submissions')
    .select('*, submission_images(*), flashlights(*)')
    .eq('status', status)
    .neq('type', 'delete')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const user = await getAdminUser(request)
  if (!user || (!user.isAdmin && !user.isModerator)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const { id, action, reviewerNote, submissionData, targetId, submissionImages } = body

  // Validate action - only allow known values
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  let responseSlug: string | null = null

  if (action === 'approved') {
    try {
      // Record BOTH parties: updated_by = the admin/mod who approved, and
      // submitted_by = the original contributor (from the submission row).
      const reviewerId = user.id
      const { data: sub } = await admin.from('flashlight_submissions').select('user_id').eq('id', id).single()
      const submittedBy = sub?.user_id ?? null

      // Helper: insert non-primary submission images into flashlight_images
      async function insertExtraImages(
        flashlightId: string,
        imgs: { url: string; sort_order: number; is_primary: boolean }[]
      ) {
        const extras = imgs.filter(i => !i.is_primary)
        if (!extras.length) return
        await admin.from('flashlight_images').insert(
          extras.map(i => ({ flashlight_id: flashlightId, url: i.url, sort_order: i.sort_order }))
        )
      }

      // Helper: replace a flashlight's review links with the submitted set.
      // (The edit form always loads existing reviews, so replace-all is safe.)
      type ReviewInput = { url?: string; title?: string; published_at?: string | null; type?: string | null }
      async function applyReviews(flashlightId: string, reviews: ReviewInput[]) {
        await admin.from('reviews').delete().eq('flashlight_id', flashlightId)
        const clean = (reviews ?? []).filter(r => r?.url?.trim())
        if (!clean.length) return
        await admin.from('reviews').insert(
          clean.map(r => ({
            flashlight_id: flashlightId,
            url: r.url!.trim(),
            title: r.title?.trim() || r.url!.trim(),
            published_at: r.published_at ?? null,
            type: r.type ?? null,
          }))
        )
      }

      if (submissionData?.type === 'new') {
        const d: Record<string, unknown> = { ...(submissionData.data ?? {}) }
        const reviews = (d._reviews as ReviewInput[] | undefined) ?? []
        delete d._reviews
        const slug = `${d.brand ?? ''}-${d.model ?? ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        responseSlug = slug
        const imgs = (submissionImages ?? []) as { url: string; sort_order: number; is_primary: boolean }[]
        const primaryImg = imgs.find(i => i.is_primary) ?? imgs[0]

        await movePdfs(d, slug)
        const { data: newFl } = await admin
          .from('flashlights')
          .insert({ ...d, slug, image_url: primaryImg?.url ?? null, updated_by: reviewerId, submitted_by: submittedBy })
          .select('id')
          .single()

        // Insert extra images into flashlight_images
        if (newFl?.id) {
          await insertExtraImages(newFl.id, imgs)
          await applyReviews(newFl.id, reviews)
        }

      } else if (targetId) {
        const d: Record<string, unknown> = { ...(submissionData?.data ?? {}) }
        const { data: fl } = await admin.from('flashlights').select('slug').eq('id', targetId).single()
        const oldSlug = (fl?.slug as string | undefined) ?? null

        // Regenerate the slug from the (possibly edited) brand + model so the URL
        // tracks the name. Keep the old slug if the new one is empty or already
        // taken by a different flashlight.
        let slug = oldSlug
        if (d.brand && d.model) {
          const candidate = slugify(String(d.brand), String(d.model))
          if (candidate && candidate !== oldSlug) {
            const { data: clash } = await admin
              .from('flashlights').select('id').eq('slug', candidate).neq('id', targetId).maybeSingle()
            if (!clash) slug = candidate
          }
        }
        responseSlug = slug

        if (slug) await movePdfs(d, slug)

        // Extract directives stored in data by the form (not flashlight columns)
        const primaryImageUrl = '_primaryImageUrl' in d ? d._primaryImageUrl as string | null : undefined
        const removeExtraDbIds = (d._removeExtraDbIds as string[] | undefined) ?? []
        const reviews = (d._reviews as ReviewInput[] | undefined) ?? []
        delete d._primaryImageUrl
        delete d._removeExtraDbIds
        delete d._reviews

        // Delete removed extra images from DB + Vercel Blob
        if (removeExtraDbIds.length) {
          const { data: toDelete } = await admin
            .from('flashlight_images').select('url').in('id', removeExtraDbIds)
          await admin.from('flashlight_images').delete().in('id', removeExtraDbIds)
          await Promise.allSettled(
            (toDelete ?? [])
              .filter(img => (img.url as string)?.includes('vercel-storage.com'))
              .map(img => del(img.url as string))
          )
        }

        // `slug` last so it overrides the stale slug the form carries in `d`
        const updateData: Record<string, unknown> = { ...d, slug, updated_by: reviewerId, submitted_by: submittedBy, updated_at: new Date().toISOString() }

        // Primary image: use explicit directive if set, else fall back to newly uploaded primary
        const imgs = (submissionImages ?? []) as { url: string; sort_order: number; is_primary: boolean }[]
        if (primaryImageUrl !== undefined) {
          updateData.image_url = primaryImageUrl
          // If an existing extra was promoted to primary, remove it from flashlight_images
          if (primaryImageUrl) {
            await admin.from('flashlight_images')
              .delete()
              .eq('flashlight_id', targetId)
              .eq('url', primaryImageUrl)
          }
        } else {
          const primaryImg = imgs.find(i => i.is_primary)
          if (primaryImg) updateData.image_url = primaryImg.url
        }

        await admin.from('flashlights').update(updateData).eq('id', targetId)

        // Insert newly uploaded extra images into flashlight_images
        await insertExtraImages(targetId, imgs)
        await applyReviews(targetId, reviews)

        // If the slug changed, drop the old URL from cache (client revalidates the new one)
        if (oldSlug && slug !== oldSlug) revalidatePath(`/${oldSlug}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[submissions PATCH] flashlights write error:', msg)
      return NextResponse.json({ error: `Apply failed: ${msg}` }, { status: 500 })
    }
  }

  const { error } = await admin
    .from('flashlight_submissions')
    .update({ status: action, reviewer_note: reviewerNote || null, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[submissions PATCH] status update error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, slug: responseSlug })
}
