'use client'

import { FileText } from 'lucide-react'
import { cdnUrl } from '@/lib/cdn'

interface Props {
  slug: string
  urls: string[]
}

export default function ManualSection({ slug, urls }: Props) {
  if (!urls.length) return null

  return (
    <div className="mt-8 border-t border-line">
      <h2 className="text-[13px] font-semibold text-ink py-4">User Manual</h2>
      {urls.map((url, i) => {
        const label = i === 0 ? 'manual.pdf' : `manual-${i}.pdf`
        const href = cdnUrl(url) ?? url
        return (
          <a
            key={url}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-3 border-t border-line group hover:text-brand-600"
          >
            <FileText size={13} className="text-slate-300 group-hover:text-brand-500 shrink-0" />
            <span className="text-sm text-ink-2 group-hover:text-brand-700 flex-1 font-mono">{label}</span>
            <span className="text-xs text-ink-3 group-hover:text-brand-500">Open ↗</span>
          </a>
        )
      })}
    </div>
  )
}
