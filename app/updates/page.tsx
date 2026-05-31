import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 3600 // re-fetch every hour

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default async function UpdatesPage() {
  const { data: updates } = await supabase
    .from('site_updates')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Header breadcrumb="Updates" />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 mb-8">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        <h1 className="text-xl font-bold text-slate-900 mb-8">Site Updates</h1>

        {!updates || updates.length === 0 ? (
          <p className="text-slate-400 text-sm">No updates yet.</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-200" />

            <div className="space-y-10 pl-8">
              {updates.map((u) => (
                <div key={u.id} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-[#f8f8f6]" />

                  <div className="flex items-baseline gap-3 mb-1">
                    <h2 className="font-semibold text-slate-900">{u.title}</h2>
                    {u.version && (
                      <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded">
                        {u.version}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{formatDate(u.created_at)}</p>
                  {u.body && (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{u.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
