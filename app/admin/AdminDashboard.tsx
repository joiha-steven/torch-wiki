'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { FlashlightSubmission } from '@/lib/types'
import Header from '@/components/Header'
import { Check, X, Clock, Loader2, Bug, Layers, Settings, Users, Tag } from 'lucide-react'
import { authHeader, SubmissionTab, Section } from '@/components/admin/shared'
import SubmissionCard from '@/components/admin/SubmissionCard'
import ReportsPanel from '@/components/admin/ReportsPanel'
import UsersPanel from '@/components/admin/UsersPanel'
import SettingsPanel from '@/components/admin/SettingsPanel'
import BrandsPanel from '@/components/admin/BrandsPanel'
import { useHashTab } from '@/lib/use-hash-tab'

const SECTIONS = ['submissions', 'brands', 'reports', 'users', 'settings'] as const

export default function AdminDashboard() {
  const { isAdmin } = useAuth()
  const [section, setSection]   = useHashTab<Section>(SECTIONS, 'submissions')
  const [subTab, setSubTab]     = useState<SubmissionTab>('pending')
  const [submissions, setSubmissions] = useState<FlashlightSubmission[]>([])
  const [loading, setLoading]   = useState(true)
  const [clearing, setClearing] = useState(false)
  const [clearMsg, setClearMsg] = useState('')

  async function forceClearCache() {
    setClearing(true); setClearMsg('')
    const res = await fetch('/api/revalidate', {
      method: 'POST', headers: await authHeader(),
      body: JSON.stringify({ force: true }),
    })
    const data = await res.json()
    localStorage.removeItem('meta_cache')
    setClearMsg(`✓ Cleared cache for ${data.count} pages`)
    setClearing(false)
    setTimeout(() => setClearMsg(''), 4000)
  }

  const loadSubs = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''
    const res = await fetch(`/api/admin/submissions?status=${subTab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = res.ok ? await res.json() : []
    setSubmissions(data as FlashlightSubmission[])
    setLoading(false)
  }, [subTab])

  // loadSubs() flips the loading spinner on; standard data-fetch-on-mount pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (section === 'submissions') loadSubs() }, [section, loadSubs])

  const SUB_TABS: { key: SubmissionTab; label: string; icon: React.ReactNode }[] = [
    { key: 'pending',  label: 'Pending',  icon: <Clock size={14} /> },
    { key: 'approved', label: 'Approved', icon: <Check size={14} /> },
    { key: 'rejected', label: 'Rejected', icon: <X size={14} /> },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-[1280px] mx-auto px-7 py-8">

        {/* Top bar: section switcher (centered) + force clear (right) */}
        <div className="relative flex justify-center mb-8">
        <div className="flex gap-1 bg-panel border border-line rounded-2xl p-1 w-fit flex-wrap justify-center">
          <button onClick={() => setSection('submissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === 'submissions' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}>
            <Layers size={14} /> Submissions
          </button>
          <button onClick={() => setSection('brands')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === 'brands' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}>
            <Tag size={14} /> Brands
          </button>
          <button onClick={() => setSection('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === 'reports' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}>
            <Bug size={14} /> Reports
          </button>
          {isAdmin && (
            <button onClick={() => setSection('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === 'users' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}>
              <Users size={14} /> Users
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setSection('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === 'settings' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}>
              <Settings size={14} /> Settings
            </button>
          )}
        </div>

          {isAdmin && (
            <div className="hidden md:flex items-center gap-3 absolute right-0 top-1/2 -translate-y-1/2">
              {clearMsg && <span className="text-xs text-green-600">{clearMsg}</span>}
              <button onClick={forceClearCache} disabled={clearing}
                className="flex items-center gap-2 text-xs border border-line rounded-xl px-3 py-2 text-ink-2 hover:bg-gray-100 disabled:opacity-50 bg-panel">
                {clearing ? <Loader2 size={12} className="animate-spin" /> : null}
                {clearing ? 'Clearing…' : 'Force clear cache'}
              </button>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="md:hidden flex items-center justify-center gap-3 mb-8 -mt-4">
            {clearMsg && <span className="text-xs text-green-600">{clearMsg}</span>}
            <button onClick={forceClearCache} disabled={clearing}
              className="flex items-center gap-2 text-xs border border-line rounded-xl px-3 py-2 text-ink-2 hover:bg-gray-100 disabled:opacity-50 bg-panel">
              {clearing ? <Loader2 size={12} className="animate-spin" /> : null}
              {clearing ? 'Clearing…' : 'Force clear cache'}
            </button>
          </div>
        )}

        {section === 'settings' ? (
          <SettingsPanel />
        ) : section === 'users' ? (
          <UsersPanel />
        ) : section === 'reports' ? (
          <ReportsPanel />
        ) : section === 'brands' ? (
          <BrandsPanel />
        ) : (
          <>
            <div className="flex gap-1 bg-panel border border-line rounded-2xl p-1 mb-8 w-fit mx-auto">
              {SUB_TABS.map(t => (
                <button key={t.key} onClick={() => setSubTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${subTab === t.key ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-ink-3"><Loader2 size={20} className="animate-spin" /></div>
            ) : submissions.length === 0 ? (
              <p className="text-ink-3 text-sm py-16 text-center">No {subTab} submissions.</p>
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
