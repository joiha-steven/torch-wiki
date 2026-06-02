'use client'

import Link from 'next/link'
import { Pencil, FileText } from 'lucide-react'
import { useIsAdmin } from '@/lib/use-is-admin'

export default function SuggestEditButton({ flashlightId }: { flashlightId: string }) {
  const isAdmin = useIsAdmin()

  if (isAdmin) {
    return (
      <Link
        href={`/contribute?suggest=${flashlightId}`}
        className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
      >
        <Pencil size={12} />
        Edit
      </Link>
    )
  }

  return (
    <Link
      href={`/contribute?suggest=${flashlightId}`}
      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
    >
      <FileText size={12} />
      Suggest an edit
    </Link>
  )
}
