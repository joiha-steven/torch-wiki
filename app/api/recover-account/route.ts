import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text.toUpperCase().trim())
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: Request) {
  try {
    const admin = getSupabaseAdmin()
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify session
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { recoveryCode } = await request.json()
    if (!recoveryCode) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

    const hash = await sha256(recoveryCode)

    // Find matching unused code
    const { data: codes, error: queryError } = await admin
      .from('recovery_codes')
      .select('id')
      .eq('user_id', user.id)
      .eq('code_hash', hash)
      .is('used_at', null)
      .limit(1)

    if (queryError || !codes?.length) {
      return NextResponse.json({ error: 'Invalid or already used recovery code' }, { status: 400 })
    }

    // Get TOTP factors
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}/factors`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        },
      }
    )
    const factors = await res.json()
    const totpFactor = Array.isArray(factors) ? factors.find((f: { factor_type: string }) => f.factor_type === 'totp') : null

    // Delete TOTP factor via admin API
    if (totpFactor) {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}/factors/${totpFactor.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          },
        }
      )
    }

    // Mark recovery code as used
    await admin
      .from('recovery_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', codes[0].id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
