'use client'

import { useState } from 'react'
import { Trash2, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

// Admin/mod "Suggest delete" on a flashlight page. Deletion always goes through
// admin approval, so this just files a pending `delete` submission that shows up
// in the admin Delete tab. Confirms before sending.
export default function SuggestDeleteButton({
  flashlightId, brand, model, slug,
}: {
  flashlightId: string; brand: string; model: string; slug: string
}) {
  const { user, isAdmin, isModerator } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  if (!user || !(isAdmin || isModerator)) return null

  async function send() {
    setBusy(true); setErr('')
    const { error } = await supabase.from('flashlight_submissions').insert({
      type: 'delete', target_id: flashlightId, user_id: user!.id, status: 'pending',
      data: { brand, model, slug },
    })
    setBusy(false)
    if (error) { setErr('Could not send request.'); return }
    setDone(true); setConfirming(false)
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
        <Check size={12} /> Delete request sent
      </span>
    )
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span className="text-ink-3">Send a delete request to admins?</span>
        <button onClick={send} disabled={busy}
          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium disabled:opacity-50">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Yes, send
        </button>
        <button onClick={() => setConfirming(false)} disabled={busy} className="text-ink-3 hover:text-ink-2">Cancel</button>
        {err && <span className="text-red-500">{err}</span>}
      </span>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-red-600 transition-colors">
      <Trash2 size={12} /> Suggest delete
    </button>
  )
}
