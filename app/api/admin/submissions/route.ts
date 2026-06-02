import { NextResponse } from 'next/server'
import { copy, del } from '@vercel/blob'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const ALLOWED_ACTIONS = new Set(['approved', 'rejected'])

// Server-side copy within Vercel Blob — no data transfer through function
async function moveBlob(oldUrl: string, newPath: string): Promise<string> {
  const { url } = await copy(oldUrl, newPath, { access: 'public', addRandomSuffix: false })
  await del(oldUrl).catch(() => {}) // best-effort delete
  return url
}

function isSubmissionBlob(url: string) {
  return url?.includes('/submissions/manuals/')
}

async function verifyAdmin(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!token) return null
  const admin = getSupabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null
  // Short-circuit: skip profile query for bootstrap admin email
  if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) return user
  const { data: profile } = await admin.from('profiles').select('is_admin, is_moderator').eq('id', user.id).single()
  return (profile?.is_admin || profile?.is_moderator) ? user : null
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
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'

  const { data, error } = await admin
    .from('flashlight_submissions')
    .select('*, submission_images(*), flashlights(*)')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { id, action, reviewerNote, submissionData, targetId, submissionImages } = await request.json()

  // Validate action — only allow known values
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  let responseSlug: string | null = null

  if (action === 'approved') {
    try {
      // Look up actual user_id from DB — never trust client payload
      const { data: sub } = await admin.from('flashlight_submissions').select('user_id').eq('id', id).single()
      const authorId = sub?.user_id ?? null

      if (submissionData?.type === 'new') {
        const d: Record<string, unknown> = { ...(submissionData.data ?? {}) }
        const slug = `${d.brand ?? ''}-${d.model ?? ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        responseSlug = slug
        const primaryImg = submissionImages?.find((i: { is_primary: boolean }) => i.is_primary) ?? submissionImages?.[0]

        await movePdfs(d, slug)
        await admin.from('flashlights').insert({ ...d, slug, image_url: primaryImg?.url ?? null, updated_by: authorId })

      } else if (targetId) {
        const d: Record<string, unknown> = { ...(submissionData?.data ?? {}) }
        const { data: fl } = await admin.from('flashlights').select('slug').eq('id', targetId).single()
        const slug = fl?.slug
        responseSlug = slug ?? null

        if (slug) await movePdfs(d, slug)

        // Extract image management directives (stored in data by the form)
        const primaryImageUrl = '_primaryImageUrl' in d ? d._primaryImageUrl as string | null : undefined
        const removeExtraDbIds = (d._removeExtraDbIds as string[] | undefined) ?? []
        delete d._primaryImageUrl
        delete d._removeExtraDbIds

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

        const updateData: Record<string, unknown> = { ...d, updated_by: authorId, updated_at: new Date().toISOString() }

        // Primary image: use explicit directive if set, else fall back to newly uploaded primary
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
          const primaryImg = submissionImages?.find((i: { is_primary: boolean }) => i.is_primary)
          if (primaryImg) updateData.image_url = (primaryImg as { url: string }).url
        }

        await admin.from('flashlights').update(updateData).eq('id', targetId)
      }
    } catch (e) {
      console.error('[submissions PATCH] flashlights write error:', e)
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
