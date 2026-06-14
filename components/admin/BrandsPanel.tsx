'use client'

import { useState, useEffect, useCallback } from 'react'
import MarkdownContent from '@/components/MarkdownContent'
import { Check, X, Clock, Loader2 } from 'lucide-react'
import { authHeader, SubmissionTab } from './shared'

type BrandSubmission = {
  id: string
  brand_name: string
  data: Record<string, unknown>
  status: string
  reviewer_note: string | null
  created_at: string
  profiles?: { nickname: string | null } | null
}

const BRAND_FIELD_LABELS: Record<string, string> = {
  country: 'Brand origin', made_in: 'Made in', founded_year: 'Founded',
  headquarters: 'Headquarters', website: 'Website', about: 'About',
}

export default function BrandsPanel() {
  const [statusFilter, setStatusFilter] = useState<SubmissionTab>('pending')
  const [subs, setSubs] = useState<BrandSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/brand-submissions?status=${statusFilter}`, { headers: await authHeader() })
    const data = res.ok ? (await res.json()).submissions : []
    setSubs(data as BrandSubmission[])
    setLoading(false)
  }, [statusFilter])

  // load() flips the loading spinner on; standard data-fetch-on-mount pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function act(id: string, action: 'approve' | 'reject') {
    const reviewerNote = action === 'reject' ? (window.prompt('Reason (optional, shown to submitter):') ?? '') : undefined
    setActing(id)
    await fetch('/api/admin/brand-submissions', {
      method: 'PATCH', headers: await authHeader(),
      body: JSON.stringify({ id, action, reviewerNote }),
    })
    setActing(null)
    load()
  }

  const TABS: { key: SubmissionTab; label: string; icon: React.ReactNode }[] = [
    { key: 'pending', label: 'Pending', icon: <Clock size={14} /> },
    { key: 'approved', label: 'Approved', icon: <Check size={14} /> },
    { key: 'rejected', label: 'Rejected', icon: <X size={14} /> },
  ]

  return (
    <>
      <div className="flex gap-1 bg-panel border border-line rounded-2xl p-1 mb-8 w-fit mx-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${statusFilter === t.key ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-ink-3"><Loader2 size={20} className="animate-spin" /></div>
      ) : subs.length === 0 ? (
        <p className="text-ink-3 text-sm py-16 text-center">No {statusFilter} brand suggestions.</p>
      ) : (
        <div className="space-y-3">
          {subs.map(s => {
            const entries = Object.entries(s.data ?? {}).filter(([, v]) => v != null && v !== '')
            return (
              <div key={s.id} className="bg-panel border border-line rounded-xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-ink">{s.brand_name}</h3>
                  <span className="text-xs text-ink-3 shrink-0">
                    {s.profiles?.nickname ? `@${s.profiles.nickname} · ` : ''}{new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {entries.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[120px_1fr] gap-3">
                      <span className="text-xs text-ink-3 pt-0.5">{BRAND_FIELD_LABELS[k] ?? k}</span>
                      {k === 'about'
                        ? <div className="text-ink-2"><MarkdownContent>{String(v)}</MarkdownContent></div>
                        : <span className="text-ink break-words">{String(v)}</span>}
                    </div>
                  ))}
                </div>

                {s.reviewer_note && <p className="mt-2 text-xs text-ink-3">Note: {s.reviewer_note}</p>}

                {statusFilter === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => act(s.id, 'approve')} disabled={acting === s.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                      <Check size={13} /> Approve
                    </button>
                    <button onClick={() => act(s.id, 'reject')} disabled={acting === s.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                      <X size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
