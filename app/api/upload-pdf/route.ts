import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isLocalStorage } from '@/lib/storage'
import { handleLocalUpload } from '@/lib/local-upload'

// clientPayload carries the Supabase access_token sent from the browser
async function authorize(clientPayload: string): Promise<void> {
  if (!clientPayload) throw new Error('Unauthorized')
  const admin = getSupabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(clientPayload)
  if (error || !user) throw new Error('Unauthorized')
}

const RULES = {
  allowedContentTypes: ['application/pdf'],
  maximumSizeInBytes: 20 * 1024 * 1024,
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
