'use client'

import { FileText } from 'lucide-react'
import { cdnUrl } from '@/lib/cdn'

interface Props {
  slug: string
  urls: string[]        // manual_urls array (may include legacy manual_url)
}

export default function ManualSection({ slug, urls }: Props) {
  if (!urls.length) return null

  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">User Manual</h2>
      </div>
      {urls.map((url, i) => {
        const label = i === 0 ? 'manual.pdf' : `manual-${i}.pdf`
        const href = cdnUrl(url) ?? url
        return (
          <a
            key={url}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 group border-b border-slate-100 last:border-0"
          >
            <FileText size={16} className="text-slate-400 group-hover:text-brand-500 shrink-0" />
            <span className="text-sm text-slate-700 group-hover:text-brand-600 flex-1">{label}</span>
            <span className="text-xs text-slate-400 group-hover:text-brand-500">Open PDF ↗</span>
          </a>
        )
      })}
    </div>
  )
}
