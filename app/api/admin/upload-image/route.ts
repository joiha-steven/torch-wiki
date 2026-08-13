import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isLocalStorage } from '@/lib/storage'
import { handleLocalUpload } from '@/lib/local-upload'

// clientPayload carries the Supabase access_token; admin/moderator only.
async function authorize(clientPayload: string): Promise<void> {
  const admin = getSupabaseAdmin()
  const { data: { user } } = await admin.auth.getUser(clientPayload)
  if (!user) throw new Error('Unauthorized')

  // Short-circuit for admin email
  if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin && !profile?.is_moderator) throw new Error('Forbidden')
  }
}

const RULES = {
  allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  maximumSizeInBytes: 10 * 1024 * 1024,
  addRandomSuffix: false,
}

export async function POST(request: Request): Promise<NextResponse> {
  if (isLocalStorage()) return handleLocalUpload(request, { authorize, ...RULES })

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        await authorize(clientPayload ?? '')
        return RULES
      },
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
