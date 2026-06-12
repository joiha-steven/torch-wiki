import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!token) return false
  const form = new FormData()
  form.append('secret', process.env.TURNSTILE_SECRET_KEY ?? '')
  form.append('response', token)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    const data = await res.json()
    return !!data.success
  } catch {
    return false
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // Don't mint blob upload tokens for anyone. The client must prove it's
        // either a logged-in user (Supabase session) OR a human that passed
        // Turnstile (the anonymous bug-report path). clientPayload is a JSON
        // string: { session?: <access_token> } or { turnstile?: <token> }.
        let creds: { session?: string; turnstile?: string } = {}
        try { creds = clientPayload ? JSON.parse(clientPayload) : {} } catch { /* invalid → unauthorized */ }

        let ok = false
        if (creds.session) {
          const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(creds.session)
          ok = !error && !!user
        }
        if (!ok && creds.turnstile) {
          ok = await verifyTurnstile(creds.turnstile)
        }
        if (!ok) throw new Error('Unauthorized')

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 10 * 1024 * 1024,
        }
      },
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
