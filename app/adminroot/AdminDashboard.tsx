'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { FlashlightSubmission, Flashlight } from '@/lib/types'
import Header from '@/components/Header'
import Image from 'next/image'
import { Check, X, ChevronDown, ChevronUp, Clock, Loader2, Bug, Layers } from 'lucide-react'

type SubmissionTab = 'pending' | 'approved' | 'rejected'
type ReportStatus  = 'new' | 'read' | 'resolved'
type Section = 'submissions' | 'reports'

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

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Diff two objects — returns keys that changed
function diffKeys(original: Partial<Flashlight>, updated: Partial<Flashlight>): string[] {
  return Object.keys(updated).filter(k => {
    const key = k as keyof Flashlight
    const a = JSON.stringify(original[key])
    const b = JSON.stringify(updated[key])
    return a !== b
  })
}

function DiffRow({ label, before, after, changed }: { label: string; before: unknown; after: unknown; changed: boolean }) {
  const fmt = (v: unknown) => {
    if (v == null || v === '') return <span className="text-slate-300 italic">—</span>
    if (Array.isArray(v)) return v.join(', ')
    return String(v)
  }
  return (
    <tr className={changed ? 'bg-amber-50' : ''}>
      <td className="px-3 py-2 text-xs text-slate-500 font-medium w-36 shrink-0">{label}</td>
      {before !== undefined && (
        <td className={`px-3 py-2 text-sm ${changed ? 'text-red-500 line-through' : 'text-slate-700'}`}>{fmt(before)}</td>
      )}
      <td className={`px-3 py-2 text-sm ${changed ? 'text-green-700 font-medium' : 'text-slate-700'}`}>{fmt(after)}</td>
    </tr>
  )
}

const SPEC_LABELS: [keyof Flashlight, string][] = [
  ['brand', 'Brand'], ['model', 'Model'], ['category', 'Category'], ['year', 'Year'],
  ['max_lumens', 'Max Lumens'], ['min_lumens', 'Min Lumens'], ['beam_distance_m', 'Beam Distance'],
  ['beam_type', 'Beam Type'], ['emitters', 'Emitters'], ['battery_type', 'Battery'],
  ['battery_count', 'Battery Count'], ['charging_type', 'Charging'],
  ['length_mm', 'Length'], ['head_diameter_mm', 'Head Ø'], ['body_diameter_mm', 'Body Ø'],
  ['weight_g', 'Weight'], ['material', 'Material'], ['ip_rating', 'IP Rating'],
  ['impact_resistance_m', 'Impact'], ['price_usd', 'Price'], ['description', 'Description'],
  ['notes', 'Notes'], ['manual_url', 'Manual URL'], ['is_discontinued', 'Discontinued'],
]

function SubmissionCard({ sub, onAction }: { sub: FlashlightSubmission; onAction: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [reviewerNote, setReviewerNote] = useState('')
  const [acting, setActing] = useState(false)

  const original = sub.flashlights ?? {}
  const changed = sub.type === 'edit' ? diffKeys(original, sub.data) : []

  async function act(action: 'approved' | 'rejected') {
    setActing(true)
    try {
      if (action === 'approved') {
        const d = sub.data
        if (sub.type === 'new') {
          const slug = `${d.brand}-${d.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          const primaryImg = sub.submission_images?.find(i => i.is_primary) ?? sub.submission_images?.[0]
          await supabase.from('flashlights').insert({ ...d, slug, image_url: primaryImg?.url ?? null, updated_by: sub.user_id })
          // Clear browse page cache so new flashlight appears
          await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
        } else if (sub.target_id) {
          const primaryImg = sub.submission_images?.find(i => i.is_primary)
          const updateData: Record<string, unknown> = { ...d, updated_by: sub.user_id, updated_at: new Date().toISOString() }
          if (primaryImg) updateData.image_url = primaryImg.url
          await supabase.from('flashlights').update(updateData).eq('id', sub.target_id)
          // Clear cache for the specific flashlight page
          const { data: fl } = await supabase.from('flashlights').select('slug').eq('id', sub.target_id).single()
          if (fl?.slug) await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: fl.slug }) })
        }
      }
      await supabase.from('flashlight_submissions').update({
        status: action,
        reviewer_note: reviewerNote || null,
        reviewed_at: new Date().toISOString(),
      }).eq('id', sub.id)
      onAction()
    } finally {
      setActing(false)
    }
  }

  const images = sub.submission_images ?? []

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-4 px-5 py-4">
        {images[0] && (
          <div className="relative w-16 h-16 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
            <Image src={images.find(i => i.is_primary)?.url ?? images[0].url} alt="" fill className="object-contain p-1" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sub.type === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
              {sub.type === 'new' ? 'New' : 'Edit'}
            </span>
            <span className="font-semibold text-slate-900">{(sub.data.brand ?? '') + ' ' + (sub.data.model ?? '')}</span>
            {sub.type === 'edit' && <span className="text-xs text-slate-400">({changed.length} field{changed.length !== 1 ? 's' : ''} changed)</span>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{formatDate(sub.created_at)}</p>
          {sub.note && <p className="text-sm text-slate-600 mt-1 italic">"{sub.note}"</p>}
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-700 shrink-0 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          {/* Images strip */}
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map(img => (
                <div key={img.id} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 bg-white ${img.is_primary ? 'border-brand-500' : 'border-slate-200'}`}>
                  <Image src={img.url} alt="" fill className="object-contain p-1" />
                  {img.is_primary && <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-brand-500 text-black py-0.5">Primary</span>}
                </div>
              ))}
            </div>
          )}

          {/* Spec diff table */}
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <th className="px-3 py-2 text-left font-medium">Field</th>
                  {sub.type === 'edit' && <th className="px-3 py-2 text-left font-medium">Before</th>}
                  <th className="px-3 py-2 text-left font-medium">{sub.type === 'edit' ? 'After' : 'Value'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {SPEC_LABELS.map(([key, label]) => {
                  const after = sub.data[key]
                  const before = sub.type === 'edit' ? (original as Partial<Flashlight>)[key] : undefined
                  const hasValue = after != null && after !== '' && !(Array.isArray(after) && after.length === 0)
                  if (!hasValue && sub.type === 'new') return null
                  return (
                    <DiffRow key={key} label={label}
                      before={before} after={after}
                      changed={changed.includes(key)}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Reviewer note + action */}
          {sub.status === 'pending' && (
            <div className="space-y-3">
              <textarea
                value={reviewerNote}
                onChange={e => setReviewerNote(e.target.value)}
                placeholder="Note to user (optional — shown if rejected)"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
                rows={2}
              />
              <div className="flex gap-3">
                <button onClick={() => act('rejected')} disabled={acting}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm disabled:opacity-50">
                  {acting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Reject
                </button>
                <button onClick={() => act('approved')} disabled={acting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50">
                  {acting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Approve & publish
                </button>
              </div>
            </div>
          )}
          {sub.status !== 'pending' && sub.reviewer_note && (
            <p className="text-sm text-slate-500 italic">Reviewer note: "{sub.reviewer_note}"</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Reports panel ────────────────────────────────────────────────────────────
function ReportsPanel() {
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
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 w-fit">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
      ) : reports.length === 0 ? (
        <p className="text-slate-400 text-sm py-16 text-center">No {statusFilter} reports.</p>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{r.topic}</span>
                    {r.attachment_url && <span className="text-xs text-slate-400">📎</span>}
                  </div>
                  <p className="text-sm text-slate-700 truncate">{r.body}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.email ?? (r.user_id ? 'Registered user' : 'Anonymous')} · {formatDate(r.created_at)}
                  </p>
                </div>
                {expanded === r.id ? <ChevronUp size={15} className="text-slate-400 mt-1 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 mt-1 shrink-0" />}
              </button>

              {expanded === r.id && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{r.body}</p>

                  {r.attachment_url && (
                    <a href={r.attachment_url} target="_blank" rel="noopener noreferrer"
                      className="block w-fit">
                      <Image src={r.attachment_url} alt="attachment" width={320} height={200}
                        className="rounded-lg border border-slate-200 object-cover max-h-48" />
                    </a>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {statusFilter !== 'read' && (
                      <button onClick={() => setStatus(r.id, 'read')}
                        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50">
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
                        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-50">
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

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [section, setSection]   = useState<Section>('submissions')
  const [subTab, setSubTab]     = useState<SubmissionTab>('pending')
  const [submissions, setSubmissions] = useState<FlashlightSubmission[]>([])
  const [loading, setLoading]   = useState(true)
  const [clearing, setClearing] = useState(false)
  const [clearMsg, setClearMsg] = useState('')

  async function forceClearCache() {
    setClearing(true); setClearMsg('')
    const res = await fetch('/api/revalidate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true }),
    })
    const data = await res.json()
    setClearMsg(`✓ Cleared cache for ${data.count} pages`)
    setClearing(false)
    setTimeout(() => setClearMsg(''), 4000)
  }

  const loadSubs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('flashlight_submissions')
      .select('*, submission_images(*), flashlights(*)')
      .eq('status', subTab)
      .order('created_at', { ascending: false })
    setSubmissions((data ?? []) as FlashlightSubmission[])
    setLoading(false)
  }, [subTab])

  useEffect(() => { if (section === 'submissions') loadSubs() }, [section, loadSubs])

  const SUB_TABS: { key: SubmissionTab; label: string; icon: React.ReactNode }[] = [
    { key: 'pending',  label: 'Pending',  icon: <Clock size={14} /> },
    { key: 'approved', label: 'Approved', icon: <Check size={14} /> },
    { key: 'rejected', label: 'Rejected', icon: <X size={14} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Top bar: section switcher + force clear */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          <button onClick={() => setSection('submissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${section === 'submissions' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            <Layers size={14} /> Submissions
          </button>
          <button onClick={() => setSection('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${section === 'reports' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            <Bug size={14} /> Reports
          </button>
        </div>

          <div className="flex items-center gap-3">
            {clearMsg && <span className="text-xs text-green-600">{clearMsg}</span>}
            <button onClick={forceClearCache} disabled={clearing}
              className="flex items-center gap-2 text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 bg-white">
              {clearing ? <Loader2 size={12} className="animate-spin" /> : null}
              {clearing ? 'Clearing…' : 'Force clear cache'}
            </button>
          </div>
        </div>

        {section === 'reports' ? (
          <ReportsPanel />
        ) : (
          <>
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 w-fit">
              {SUB_TABS.map(t => (
                <button key={t.key} onClick={() => setSubTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
            ) : submissions.length === 0 ? (
              <p className="text-slate-400 text-sm py-16 text-center">No {subTab} submissions.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map(s => <SubmissionCard key={s.id} sub={s} onAction={loadSubs} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
