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

  // Admin/mod only: this writes the manual straight to the live flashlight (no
  // approval queue). Regular users add manuals through the submission flow
  // (/api/upload-pdf → pending → admin approves). Without this gate, any logged-in
  // user could overwrite any flashlight's manual.pdf directly.
  if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin && !profile?.is_moderator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Parse multipart form
  const form = await request.formData()
  const file = form.get('file') as File | null
  const slug = form.get('slug') as string | null

  if (!file || !slug) return NextResponse.json({ error: 'Missing file or slug' }, { status: 400 })
  // Validate slug shape before using it in a blob path - blocks path traversal
  // (e.g. "../../x") since the slug is interpolated straight into the storage key.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF allowed' }, { status: 400 })
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })

  // Don't trust the declared Content-Type - verify the real PDF magic bytes.
  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return NextResponse.json({ error: 'File is not a valid PDF' }, { status: 400 })
  }

  // Upload to Vercel Blob
  const { url } = await put(`flashlights/${slug}/manual.pdf`, buf, {
    access: 'public',
    contentType: 'application/pdf',
    addRandomSuffix: false,
  })

  // Update DB
  const { error: dbErr } = await admin
    .from('flashlights')
    .update({ manual_url: url })
    .eq('slug', slug)

  if (dbErr) return NextResponse.json({ error: 'Failed to save manual' }, { status: 500 })

  // Revalidate the flashlight page
  revalidatePath(`/${slug}`)

  return NextResponse.json({ url })
}
