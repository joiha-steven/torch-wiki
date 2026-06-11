'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, FileText, Check } from 'lucide-react'
import { useIsAdmin } from '@/lib/use-is-admin'
import type { Brand } from '@/lib/types'
import BrandEditForm from './BrandEditForm'

export default function BrandEditButton({ name, initial }: { name: string; initial: Brand | null }) {
  const isAdmin = useIsAdmin()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function onSaved(mode: 'saved' | 'submitted') {
    setOpen(false)
    if (mode === 'saved') {
      router.refresh()
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <Check size={13} /> Suggestion submitted — thanks!
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
          isAdmin ? 'text-brand-600 hover:text-brand-700' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        {isAdmin ? <Pencil size={12} /> : <FileText size={12} />}
        {isAdmin ? 'Edit brand' : 'Suggest an edit'}
      </button>
      {open && <BrandEditForm name={name} initial={initial} onClose={() => setOpen(false)} onSaved={onSaved} />}
    </>
  )
}
