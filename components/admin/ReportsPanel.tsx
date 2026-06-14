'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { formatDate, ReportStatus } from './shared'

type BugReport = {
  id: string
  created_at: string
  user_id: string | null
  email: string | null
  topic: string
  body: string
  attachment_url: string | null
  status: ReportStatus
}

export default function ReportsPanel() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('new')
  const [reports, setReports]           = useState<BugReport[]>([])
  const [loading, setLoading]           = useState(true)
  const [expanded, setExpanded]         = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('status', statusFilter)
      .order('created_at', { ascending: false })
    setReports((data ?? []) as BugReport[])
    setLoading(false)
  }, [statusFilter])

  // load() flips the loading spinner on; standard data-fetch-on-mount pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function setStatus(id: string, status: ReportStatus) {
    await supabase.from('bug_reports').update({ status }).eq('id', id)
    load()
  }

  const STATUS_TABS: { key: ReportStatus; label: string }[] = [
    { key: 'new',      label: 'New' },
    { key: 'read',     label: 'Read' },
    { key: 'resolved', label: 'Resolved' },
  ]

  return (
    <div>
      <div className="flex gap-1 bg-panel border border-line rounded-2xl p-1 mb-8 w-fit mx-auto">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${statusFilter === t.key ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-ink-3"><Loader2 size={20} className="animate-spin" /></div>
      ) : reports.length === 0 ? (
        <p className="text-ink-3 text-sm py-16 text-center">No {statusFilter} reports.</p>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="bg-panel rounded-xl border border-line overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium bg-slate-100 dark:bg-white/[0.05] text-ink-2 px-2 py-0.5 rounded-full">{r.topic}</span>
                    {r.attachment_url && <span className="text-xs text-ink-3">📎</span>}
                  </div>
                  <p className="text-sm text-ink-2 truncate">{r.body}</p>
                  <p className="text-xs text-ink-3 mt-0.5">
                    {r.email ?? (r.user_id ? 'Registered user' : 'Anonymous')} · {formatDate(r.created_at)}
                  </p>
                </div>
                {expanded === r.id ? <ChevronUp size={15} className="text-ink-3 mt-1 shrink-0" /> : <ChevronDown size={15} className="text-ink-3 mt-1 shrink-0" />}
              </button>

              {expanded === r.id && (
                <div className="border-t border-line px-5 py-4 space-y-4">
                  <p className="text-sm text-ink-2 whitespace-pre-line leading-relaxed">{r.body}</p>

                  {r.attachment_url && (
                    <a href={r.attachment_url} target="_blank" rel="noopener noreferrer"
                      className="block w-fit">
                      <Image src={r.attachment_url} alt="attachment" width={320} height={200}
                        className="rounded-lg border border-line object-cover max-h-48" />
                    </a>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {statusFilter !== 'read' && (
                      <button onClick={() => setStatus(r.id, 'read')}
                        className="text-xs border border-line rounded-lg px-3 py-1.5 text-ink-2 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5">
                        Mark as read
                      </button>
                    )}
                    {statusFilter !== 'resolved' && (
                      <button onClick={() => setStatus(r.id, 'resolved')}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5">
                        Mark resolved
                      </button>
                    )}
                    {statusFilter !== 'new' && (
                      <button onClick={() => setStatus(r.id, 'new')}
                        className="text-xs border border-line rounded-lg px-3 py-1.5 text-ink-3 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5">
                        Move to New
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
