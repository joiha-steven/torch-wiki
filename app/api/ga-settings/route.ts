import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabaseAdmin()

  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['ga_measurement_id', 'ga_enabled'])

  const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))

  return NextResponse.json(
    { enabled: map.ga_enabled === 'true', id: map.ga_measurement_id ?? '' },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' } }
  )
}
