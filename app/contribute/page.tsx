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

type Tab = 'add' | 'edit' | 'submissions'

// ── Search & pick a flashlight to edit ──────────────────────────────────────
function FlashlightPicker({ onPick }: { onPick: (f: Flashlight) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Flashlight[]>([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const q = query.trim()
    if (!q) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('flashlights')
        .select('id, brand, model, slug, image_url, category, max_lumens')
        .or(`model.ilike.%${q}%,brand.ilike.%${q}%`)
        .order('brand')
        .limit(20)
      setResults((data ?? []) as Flashlight[])
      setSearching(false)
    }, 300)
  }, [query])

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Search for a flashlight to suggest a correction or fill in missing info.</p>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-brand-300">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search brand or model…"
          className="flex-1 text-sm bg-transparent focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')}><X size={13} className="text-slate-400 hover:text-slate-700" /></button>
        )}
        {searching && <Loader2 size={13} className="animate-spin text-slate-400 shrink-0" />}
      </div>

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map(f => (
            <button
              key={f.id}
              onClick={() => onPick(f)}
              className="w-full flex items-center gap-3 bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl px-4 py-3 transition-colors text-left"
            >
              <div className="relative w-12 h-10 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {f.image_url
                  ? <Image src={f.image_url} alt="" fill className="object-contain p-1" />
                  : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">—</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{f.brand}</p>
                <p className="text-sm font-medium text-slate-900 truncate">{f.model}</p>
              </div>
              {f.category && <span className="text-xs text-slate-400 shrink-0">{f.category}</span>}
              <Pencil size={13} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {query.trim() && !searching && results.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">No flashlights found for "{query}".</p>
      )}
    </div>
  )
}

// ── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ onAnother, onView }: { onAnother: () => void; onView: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-4">
      <p className="text-3xl">✓</p>
      <p className="font-semibold text-slate-900">Submitted! We'll review it soon.</p>
      <div className="flex justify-center gap-4 pt-2">
        <button onClick={onAnother} className="text-sm text-brand-600 hover:underline">Submit another</button>
        <button onClick={onView} className="text-sm text-slate-500 hover:text-slate-800">View my submissions →</button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ContributePage() {
  const { user, loading, nickname, openAuthModal } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('add')
  const [submitted, setSubmitted] = useState(false)

  // For "edit" tab — which flashlight is being edited
  const [editTarget, setEditTarget] = useState<Flashlight | null>(null)

  // For ?suggest= deep-link from flashlight pages
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('suggest')
    if (!id) return
    supabase.from('flashlights').select('*, flashlight_images(*)').eq('id', id).single()
      .then(({ data }) => {
        if (data) { setEditTarget(data as Flashlight); setTab('edit') }
      })
  }, [])

  // Submissions list
  const [submissions, setSubmissions] = useState<FlashlightSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  useEffect(() => {
    if (!user || tab !== 'submissions') return
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

      <div className="max-w-3xl mx-auto px-4 py-8">

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={18} className="animate-spin text-slate-400" /></div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-slate-500 text-sm">Sign in to contribute flashlight data.</p>
            <button onClick={openAuthModal} className="bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium px-5 py-2 rounded-lg">
              Sign in
            </button>
          </div>
        ) : !nickname ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="text-slate-700 font-medium">A nickname is required to contribute.</p>
            <p className="text-slate-400 text-sm">Your nickname will be shown as the contributor on flashlight pages.</p>
            <Link href="/account" className="bg-brand-500 hover:bg-brand-400 text-black text-sm font-medium px-5 py-2 rounded-lg">
              Set your nickname →
            </Link>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit mb-6">
              <button
                onClick={() => { setTab('add'); setSubmitted(false) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'add' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Plus size={14} />
                Add flashlight
              </button>
              <button
                onClick={() => { setTab('edit'); setSubmitted(false) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'edit' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Pencil size={14} />
                Edit existing
              </button>
              <button
                onClick={() => setTab('submissions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'submissions' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
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
                  <div className="bg-white rounded-2xl border border-[#e7e7e1] p-6 sm:p-7">
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
                    <div className="bg-white rounded-2xl border border-[#e7e7e1] p-6 sm:p-7">
                      <div className="flex items-start justify-between gap-3 mb-5 pb-5 border-b border-slate-100">
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Editing</p>
                          <p className="font-semibold text-slate-900">{editTarget.brand} {editTarget.model}</p>
                          <p className="text-xs text-slate-400 mt-1">Only changed fields will be reviewed.</p>
                        </div>
                        <button onClick={() => setEditTarget(null)} className="text-xs text-slate-400 hover:text-slate-700 shrink-0 mt-1">
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
                    <div className="bg-white rounded-2xl border border-[#e7e7e1] p-6 sm:p-7">
                      <FlashlightPicker onPick={async f => {
                    const { data } = await supabase.from('flashlights').select('*, flashlight_images(*)').eq('id', f.id).single()
                    if (data) setEditTarget(data as Flashlight)
                  }} />
                    </div>
                  )
            )}

            {/* ── My submissions ── */}
            {tab === 'submissions' && (
              loadingSubmissions ? (
                <div className="flex justify-center py-16"><Loader2 size={18} className="animate-spin text-slate-400" /></div>
              ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                  <ClipboardList size={40} className="text-slate-200" />
                  <p className="text-slate-500">No submissions yet.</p>
                  <button onClick={() => setTab('add')} className="text-sm text-brand-600 hover:underline">Submit your first →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map(s => {
                    // For new: brand+model from submitted data
                    // For edit: original flashlight name from joined flashlights table
                    const isNew = s.type === 'new'
                    const fl = s.flashlights as { brand: string; model: string; slug: string } | null
                    const title = isNew
                      ? [s.data.brand, s.data.model].filter(Boolean).join(' ') || 'New flashlight'
                      : fl ? `${fl.brand} ${fl.model}` : [s.data.brand, s.data.model].filter(Boolean).join(' ') || 'Edit'
                    return (
                      <div key={s.id} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isNew ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {isNew ? 'New flashlight' : 'Edit'}
                          </span>
                          <span className="font-medium text-slate-900 text-sm">{title}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {s.reviewer_note && (
                          <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 italic">
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
  )
}
