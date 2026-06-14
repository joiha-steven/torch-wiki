import { supabase } from '@/lib/supabase'

export type SubmissionTab = 'pending' | 'approved' | 'rejected'
export type ReportStatus  = 'new' | 'read' | 'resolved'
export type Section = 'submissions' | 'brands' | 'reports' | 'users' | 'settings'

export function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Helper: get Bearer token header for admin API calls
export async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return { 'Authorization': `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' }
}
