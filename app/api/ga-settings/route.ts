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

  // Same value for every visitor and changes only when an admin toggles GA, so
  // cache it at the Vercel edge (`s-maxage`) - without it only the browser cached
  // and every fresh visit invoked this function cold (~800ms, the slowest request
  // on the page). 5-min edge TTL keeps the admin toggle reflecting quickly; stale
  // copies are served instantly while a fresh one is fetched in the background.
  return NextResponse.json(
    { enabled: map.ga_enabled === 'true', id: map.ga_measurement_id ?? '' },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400' } }
  )
}
