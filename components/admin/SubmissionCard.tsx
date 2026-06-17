'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FlashlightSubmission, Flashlight } from '@/lib/types'
import Image from 'next/image'
import { Check, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { formatDate, authHeader } from './shared'

// Diff two objects - returns keys that changed
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
    if (v == null || v === '') return <span className="text-slate-300 italic">-</span>
    if (Array.isArray(v)) return v.join(', ')
    return String(v)
  }
  return (
    <tr className={changed ? 'bg-amber-50' : ''}>
      <td className="px-3 py-2 text-xs text-ink-3 font-medium w-36 shrink-0">{label}</td>
      {before !== undefined && (
        <td className={`px-3 py-2 text-sm ${changed ? 'text-red-500 line-through' : 'text-ink-2'}`}>{fmt(before)}</td>
      )}
      <td className={`px-3 py-2 text-sm ${changed ? 'text-green-700 font-medium' : 'text-ink-2'}`}>{fmt(after)}</td>
    </tr>
  )
}

const SPEC_LABELS: [keyof Flashlight, string][] = [
  ['brand', 'Brand'], ['model', 'Model'], ['category', 'Category'], ['year', 'Year'],
  ['max_lumens', 'Max Lumens'], ['min_lumens', 'Min Lumens'], ['beam_distance_m', 'Beam Distance'],
  ['candela', 'Candela'], ['beam_type', 'Beam Type'], ['emitters', 'Emitters'],
  ['led_count', 'Number of LEDs'], ['driver_type', 'Driver'], ['battery_types', 'Battery'],
  ['charging_type', 'Charging'],
  ['length_mm', 'Length'], ['head_diameter_mm', 'Head Ø'], ['body_diameter_mm', 'Body Ø'],
  ['weight_g', 'Weight'], ['material', 'Material'], ['ip_rating', 'IP Rating'],
  ['impact_resistance_m', 'Impact'], ['price_usd', 'Price'], ['description', 'Description'],
  ['manual_urls', 'Manual PDFs'], ['is_discontinued', 'Discontinued'],
]

export default function SubmissionCard({ sub, onAction }: { sub: FlashlightSubmission; onAction: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [reviewerNote, setReviewerNote] = useState('')
  const [acting, setActing] = useState(false)

  const original = sub.flashlights ?? {}
  const changed = sub.type === 'edit' ? diffKeys(original, sub.data) : []

  async function act(action: 'approved' | 'rejected') {
    setActing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      if (!token) return

      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sub.id,
          action,
          reviewerNote,
          submissionData: { type: sub.type, data: sub.data },
          targetId: sub.target_id,
          submissionImages: sub.submission_images,
        }),
      })

      if (res.ok && action === 'approved') {
        // Server returns slug - no extra DB round-trip needed
        const { slug } = await res.json() as { ok: boolean; slug: string | null }
        if (sub.type === 'new') {
          await fetch('/api/revalidate', { method: 'POST', headers: await authHeader(), body: JSON.stringify({ all: true }) })
          localStorage.removeItem('meta_cache')
        } else if (slug) {
          await fetch('/api/revalidate', { method: 'POST', headers: await authHeader(), body: JSON.stringify({ slug }) })
          localStorage.removeItem('meta_cache')
        }
      }

      // Always refresh list to show current DB state
      onAction()
    } finally {
      setActing(false)
    }
  }

  const images = sub.submission_images ?? []

  return (
    <div className="bg-panel rounded-xl border border-line overflow-hidden">
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
            <span className="font-semibold text-ink">{(sub.data.brand ?? '') + ' ' + (sub.data.model ?? '')}</span>
            {sub.type === 'edit' && <span className="text-xs text-ink-3">({changed.length} field{changed.length !== 1 ? 's' : ''} changed)</span>}
          </div>
          <p className="text-xs text-ink-3 mt-0.5">
            {sub.submitter_nickname
              ? <>by <span className="font-medium text-ink-2">{sub.submitter_nickname}</span> · </>
              : null}
            {formatDate(sub.created_at)}
          </p>
          {sub.note && <p className="text-sm text-ink-2 mt-1 italic">&ldquo;{sub.note}&rdquo;</p>}
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-ink-3 hover:text-ink-2 shrink-0 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-line px-5 py-4 space-y-4">
          {/* Images strip */}
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map(img => (
                <div key={img.id} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 bg-plate ${img.is_primary ? 'border-brand-500' : 'border-line'}`}>
                  <Image src={img.url} alt="" fill className="object-contain p-1" />
                  {img.is_primary && <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-brand-500 text-black py-0.5">Primary</span>}
                </div>
              ))}
            </div>
          )}

          {/* Spec diff table */}
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/[0.04] text-xs text-ink-3">
                  <th className="px-3 py-2 text-left font-medium">Field</th>
                  {sub.type === 'edit' && <th className="px-3 py-2 text-left font-medium">Before</th>}
                  <th className="px-3 py-2 text-left font-medium">{sub.type === 'edit' ? 'After' : 'Value'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
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
                placeholder="Note to user (optional - shown if rejected)"
                className="w-full text-sm border border-line rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
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
            <p className="text-sm text-ink-3 italic">Reviewer note: &ldquo;{sub.reviewer_note}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  )
}
