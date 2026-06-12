'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useIsAdmin } from '@/lib/use-is-admin'
import type { Brand } from '@/lib/types'
import MarkdownEditor from '@/components/MarkdownEditor'

const input = 'w-full h-10 text-sm border border-line rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-panel'

type Props = {
  name: string
  initial: Brand | null
  onClose: () => void
  onSaved: (mode: 'saved' | 'submitted') => void
}

export default function BrandEditForm({ name, initial, onClose, onSaved }: Props) {
  const isAdmin = useIsAdmin()
  const { user, nickname, openAuthModal } = useAuth()

  const [country, setCountry] = useState(initial?.country ?? '')
  const [madeIn, setMadeIn] = useState(initial?.made_in ?? '')
  const [foundedYear, setFoundedYear] = useState(initial?.founded_year ? String(initial.founded_year) : '')
  const [headquarters, setHeadquarters] = useState(initial?.headquarters ?? '')
  const [website, setWebsite] = useState(initial?.website ?? '')
  const [about, setAbout] = useState(initial?.about ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const payload = () => ({
    country: country.trim() || null,
    made_in: madeIn.trim() || null,
    founded_year: foundedYear.trim() ? Number(foundedYear) : null,
    headquarters: headquarters.trim() || null,
    website: website.trim() || null,
    about: about.trim() || null,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { openAuthModal(); return }
    if (!isAdmin && !nickname) {
      setError('Please set a nickname in My Account before suggesting an edit.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (isAdmin) {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/admin/brand', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({ name, data: payload() }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Save failed')
        onSaved('saved')
      } else {
        const { error: insErr } = await supabase
          .from('brand_submissions')
          .insert({ brand_name: name, data: payload(), user_id: user.id })
        if (insErr) throw insErr
        onSaved('submitted')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-panel rounded-2xl w-full max-w-2xl my-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="font-semibold text-ink">Edit {name}</h2>
            <p className="text-xs text-ink-3 mt-0.5">
              {isAdmin ? 'Changes are published immediately.' : 'Your suggestion will be reviewed before going live.'}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-3 hover:text-ink-2"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Brand origin (country)</label>
              <input className={input} value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. China" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Made in</label>
              <input className={input} value={madeIn} onChange={e => setMadeIn(e.target.value)} placeholder="e.g. China" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Founded (year)</label>
              <input className={input} type="number" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} placeholder="e.g. 2017" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Headquarters</label>
              <input className={input} value={headquarters} onChange={e => setHeadquarters(e.target.value)} placeholder="e.g. Shenzhen, China" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Website</label>
            <input className={input} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" />
          </div>

          <MarkdownEditor
            label="About"
            value={about}
            onChange={setAbout}
            uploadPrefix="brands/inline"
            placeholder="Company / maker history, what they're known for… Markdown supported, with image upload and video embeds."
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 h-10 rounded-full text-sm text-ink-3 hover:text-ink">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-full text-sm font-semibold text-[#1d1604] bg-brand-500 hover:brightness-95 disabled:opacity-50 transition-[filter]"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {isAdmin ? 'Save changes' : 'Submit suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
