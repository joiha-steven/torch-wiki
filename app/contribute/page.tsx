'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, ClipboardList, Pencil, Search, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { FlashlightSubmission, Flashlight } from '@/lib/types'
import Header from '@/components/Header'
import SubmitFlashlightForm from '@/components/SubmitFlashlightForm'
import { useHashTab } from '@/lib/use-hash-tab'

type Tab = 'add' | 'edit' | 'submissions'
const CONTRIBUTE_TABS = ['add', 'edit', 'submissions'] as const

// ── Search & pick a flashlight to edit ──────────────────────────────────────
function FlashlightPicker({ onPick }: { onPick: (f: Flashlight) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Flashlight[]>([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const q = query.trim()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!q) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('flashlights')
        .select('id, brand, model, slug, image_url, category, max_lumens')
        .or(`model.ilike.%${q}%,brand.ilike.%${q}%`)
        .is('deleted_at', null)
        .order('brand')
        .limit(20)
      setResults((data ?? []) as Flashlight[])
      setSearching(false)
    }, 300)
  }, [query])

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-3">Search for a flashlight to suggest a correction or fill in missing info.</p>

      <div className="flex items-center gap-2 bg-panel border border-line rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-brand-300">
        <Search size={14} className="text-ink-3 shrink-0" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search brand or model…"
          className="flex-1 text-sm bg-transparent focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')}><X size={13} className="text-ink-3 hover:text-ink-2" /></button>
        )}
        {searching && <Loader2 size={13} className="animate-spin text-ink-3 shrink-0" />}
      </div>

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map(f => (
            <button
              key={f.id}
              onClick={() => onPick(f)}
              className="w-full flex items-center gap-3 bg-panel border border-line hover:border-brand-400 hover:bg-brand-50 rounded-xl px-4 py-3 transition-colors text-left"
            >
              <div className="relative w-12 h-10 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {f.image_url
                  ? <Image src={f.image_url} alt="" fill className="object-contain p-1" />
                  : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">-</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-3">{f.brand}</p>
                <p className="text-sm font-medium text-ink truncate">{f.model}</p>
              </div>
              {f.category && <span className="text-xs text-ink-3 shrink-0">{f.category}</span>}
              <Pencil size={13} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {query.trim() && !searching && results.length === 0 && (
        <p className="text-sm text-ink-3 text-center py-6">No flashlights found for &quot;{query}&quot;.</p>
      )}
    </div>
  )
}

// ── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ onAnother, onView }: { onAnother: () => void; onView: () => void }) {
  return (
    <div className="bg-panel rounded-xl border border-line p-10 text-center space-y-4">
      <p className="text-3xl">✓</p>
      <p className="font-semibold text-ink">Submitted! We&apos;ll review it soon.</p>
      <div className="flex justify-center gap-4 pt-2">
        <button onClick={onAnother} className="text-sm text-brand-600 hover:underline">Submit another</button>
        <button onClick={onView} className="text-sm text-ink-3 hover:text-ink">View my submissions →</button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ContributePage() {
  const { user, loading, nickname, openAuthModal } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useHashTab<Tab>(CONTRIBUTE_TABS, 'add')
  const [submitted, setSubmitted] = useState(false)

  // For "edit" tab - which flashlight is being edited
  const [editTarget, setEditTarget] = useState<Flashlight | null>(null)

  // For ?suggest= deep-link from flashlight pages
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('suggest')
    if (!id) return
    supabase.from('flashlights').select('*, flashlight_images(*), reviews(*)').eq('id', id).single()
      .then(({ data }) => {
        if (data) { setEditTarget(data as Flashlight); setTab('edit') }
      })
  }, [setTab])

  // Submissions list
  const [submissions, setSubmissions] = useState<FlashlightSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  useEffect(() => {
    if (!user || tab !== 'submissions') return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSubmissions(true)
    supabase
      .from('flashlight_submissions')
      .select('*, submission_images(*), flashlights(brand, model, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSubmissions((data ?? []) as FlashlightSubmission[])
        setLoadingSubmissions(false)
      })
  }, [user, tab])

  const STATUS_STYLE: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  }

  function resetAdd() { setSubmitted(false) }
  function resetEdit() { setSubmitted(false); setEditTarget(null) }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-[1232px] mx-auto px-7 py-8">
        <div className="max-w-3xl mx-auto">

        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.02em]">Contribute</h1>
          <p className="mt-2 text-[13px] text-ink-2">Add a new flashlight or improve an existing one.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={18} className="animate-spin text-ink-3" /></div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-ink-3 text-sm">Sign in to contribute flashlight data.</p>
            <button onClick={openAuthModal} className="bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium px-5 py-2 rounded-lg">
              Sign in
            </button>
          </div>
        ) : !nickname ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="text-ink-2 font-medium">A nickname is required to contribute.</p>
            <p className="text-ink-3 text-sm">Your nickname will be shown as the contributor on flashlight pages.</p>
            <Link href="/account" className="bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium px-5 py-2 rounded-lg">
              Set your nickname →
            </Link>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-panel border border-line rounded-2xl p-1 w-fit mx-auto mb-8">
              <button
                onClick={() => { setTab('add'); setSubmitted(false) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${tab === 'add' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}
              >
                <Plus size={14} />
                Add flashlight
              </button>
              <button
                onClick={() => { setTab('edit'); setSubmitted(false) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${tab === 'edit' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}
              >
                <Pencil size={14} />
                Edit existing
              </button>
              <button
                onClick={() => setTab('submissions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${tab === 'submissions' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}
              >
                <ClipboardList size={14} />
                My submissions
              </button>
            </div>

            {/* ── Add new ── */}
            {tab === 'add' && (
              submitted
                ? <SuccessScreen onAnother={resetAdd} onView={() => setTab('submissions')} />
                : (
                  <div className="bg-panel rounded-2xl border border-line p-6 sm:p-7">
                    <div className="mb-5 text-[13px] text-ink-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed">
                      Please verify the details before adding to the database. <b>Don&apos;t add a duplicate</b> — duplicates won&apos;t be approved, so search the catalog first to make sure it isn&apos;t already listed. Fields marked <span className="text-red-400">*</span> are required.
                    </div>
                    <SubmitFlashlightForm
                      mode="new"
                      onSuccess={(slug) => slug ? router.push(`/${slug}`) : setSubmitted(true)}
                      onCancel={() => window.history.back()}
                    />
                  </div>
                )
            )}

            {/* ── Edit existing ── */}
            {tab === 'edit' && (
              submitted
                ? <SuccessScreen onAnother={resetEdit} onView={() => setTab('submissions')} />
                : editTarget
                  ? (
                    <div className="bg-panel rounded-2xl border border-line p-6 sm:p-7">
                      <div className="flex items-start justify-between gap-3 mb-5 pb-5 border-b border-line">
                        <div>
                          <p className="text-xs text-ink-3 mb-0.5">Editing</p>
                          <p className="font-semibold text-ink">{editTarget.brand} {editTarget.model}</p>
                          <p className="text-xs text-ink-3 mt-1">Only changed fields will be reviewed.</p>
                        </div>
                        <button onClick={() => setEditTarget(null)} className="text-xs text-ink-3 hover:text-ink-2 shrink-0 mt-1">
                          ← Pick another
                        </button>
                      </div>
                      <SubmitFlashlightForm
                        mode="edit"
                        initial={editTarget}
                        targetId={editTarget.id}
                        onSuccess={(slug) => slug ? router.push(`/${slug}`) : setSubmitted(true)}
                        onCancel={() => setEditTarget(null)}
                      />
                    </div>
                  )
                  : (
                    <div className="bg-panel rounded-2xl border border-line p-6 sm:p-7">
                      <FlashlightPicker onPick={async f => {
                    const { data } = await supabase.from('flashlights').select('*, flashlight_images(*), reviews(*)').eq('id', f.id).single()
                    if (data) setEditTarget(data as Flashlight)
                  }} />
                    </div>
                  )
            )}

            {/* ── My submissions ── */}
            {tab === 'submissions' && (
              loadingSubmissions ? (
                <div className="flex justify-center py-16"><Loader2 size={18} className="animate-spin text-ink-3" /></div>
              ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                  <ClipboardList size={40} className="text-slate-200" />
                  <p className="text-ink-3">No submissions yet.</p>
                  <button onClick={() => setTab('add')} className="text-sm text-brand-600 hover:underline">Submit your first →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map(s => {
                    // For new: brand+model from submitted data
                    // For edit: original flashlight name from joined flashlights table
                    const isNew = s.type === 'new'
                    const isDelete = s.type === 'delete'
                    const fl = s.flashlights as { brand: string; model: string; slug: string } | null
                    const title = isNew
                      ? [s.data.brand, s.data.model].filter(Boolean).join(' ') || 'New flashlight'
                      : fl ? `${fl.brand} ${fl.model}` : [s.data.brand, s.data.model].filter(Boolean).join(' ') || (isDelete ? 'Delete request' : 'Edit')
                    return (
                      <div key={s.id} className="bg-panel rounded-xl border border-line px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isNew ? 'bg-blue-100 text-blue-700' : isDelete ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {isNew ? 'New flashlight' : isDelete ? 'Delete request' : 'Edit'}
                          </span>
                          <span className="font-medium text-ink text-sm">{title}</span>
                        </div>
                        <p className="text-xs text-ink-3">
                          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {s.reviewer_note && (
                          <p className="mt-3 text-sm text-ink-2 bg-slate-50 dark:bg-white/[0.04] rounded-lg px-3 py-2 italic">
                            Admin: &quot;{s.reviewer_note}&quot;
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}
