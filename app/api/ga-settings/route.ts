import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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
