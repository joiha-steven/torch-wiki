import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  // Verify admin via bearer token
  const auth = request.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Any authenticated user can upload a manual (admin or regular user)
  // Parse multipart form
  const form = await request.formData()
  const file = form.get('file') as File | null
  const slug = form.get('slug') as string | null

  if (!file || !slug) return NextResponse.json({ error: 'Missing file or slug' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF allowed' }, { status: 400 })
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })

  // Upload to Vercel Blob
  const { url } = await put(`flashlights/${slug}/manual.pdf`, file, {
    access: 'public',
    contentType: 'application/pdf',
    addRandomSuffix: false,
  })

  // Update DB
  const { error: dbErr } = await admin
    .from('flashlights')
    .update({ manual_url: url })
    .eq('slug', slug)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Revalidate the flashlight page
  revalidatePath(`/${slug}`)

  return NextResponse.json({ url })
}
