import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

async function verifyAdmin(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!token) return null
  const admin = getSupabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null
  if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) return user
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin, is_moderator')
    .eq('id', user.id)
    .single()
  return (profile?.is_admin || profile?.is_moderator) ? user : null
}

export async function PATCH(request: Request) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, data, removeImageIds, addExtraImages, newPrimaryUrl } = body as {
    id: string
    data: Record<string, unknown>
    removeImageIds?: string[]
    addExtraImages?: string[]
    newPrimaryUrl?: string | null
  }

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = getSupabaseAdmin()

  // Update main record
  const updatePayload: Record<string, unknown> = {
    ...data,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }
  if (newPrimaryUrl !== undefined) updatePayload.image_url = newPrimaryUrl

  const { error: updateError } = await admin
    .from('flashlights')
    .update(updatePayload)
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Add new extra images
  if (addExtraImages?.length) {
    const { data: existing } = await admin
      .from('flashlight_images')
      .select('sort_order')
      .eq('flashlight_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)

    let nextOrder = ((existing?.[0]?.sort_order as number) ?? 0) + 1
    await admin.from('flashlight_images').insert(
      addExtraImages.map((url: string) => ({
        flashlight_id: id,
        url,
        sort_order: nextOrder++,
      }))
    )
  }

  // Remove extra images — delete from DB and Vercel Blob
  if (removeImageIds?.length) {
    const { data: toDelete } = await admin
      .from('flashlight_images')
      .select('url')
      .in('id', removeImageIds)

    await admin.from('flashlight_images').delete().in('id', removeImageIds)

    if (toDelete?.length) {
      await Promise.allSettled(
        toDelete
          .filter(img => (img.url as string)?.includes('vercel-storage.com'))
          .map(img => del(img.url as string))
      )
    }
  }

  // Revalidate
  const { data: fl } = await admin
    .from('flashlights')
    .select('slug')
    .eq('id', id)
    .single()

  if (fl?.slug) revalidatePath(`/${fl.slug}`)
  revalidatePath('/', 'layout')

  return NextResponse.json({ ok: true, slug: fl?.slug })
}
