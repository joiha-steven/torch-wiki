import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // clientPayload carries the Supabase access_token sent from the browser
        const token = clientPayload ?? ''
        if (!token) throw new Error('Unauthorized')

        const admin = getSupabaseAdmin()
        const { data: { user }, error } = await admin.auth.getUser(token)
        if (error || !user) throw new Error('Unauthorized')

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 20 * 1024 * 1024,
          tokenPayload: user.id,
        }
      },
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
