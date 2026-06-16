import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Lightweight DB ping - called by Vercel Cron daily to keep Supabase from pausing
export async function GET() {
  const { count } = await supabase
    .from('flashlights')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({ ok: true, flashlights: count, ts: new Date().toISOString() })
}
