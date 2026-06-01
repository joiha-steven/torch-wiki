import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lightweight DB ping — called by Vercel Cron daily to keep Supabase from pausing
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { count } = await supabase
    .from('flashlights')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({ ok: true, flashlights: count, ts: new Date().toISOString() })
}
