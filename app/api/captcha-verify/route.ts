import { NextResponse } from 'next/server'
import { MAX } from '@/lib/validate'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { token?: string }
  const { token } = body
  if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 })
  if (typeof token !== 'string' || token.length > MAX.token) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 })
  }

  const form = new FormData()
  form.append('secret', process.env.TURNSTILE_SECRET_KEY!)
  form.append('response', token)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })
  const data = await res.json()
  return NextResponse.json({ success: !!data.success })
}
