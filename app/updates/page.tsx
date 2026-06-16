import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'
import Header from '@/components/Header'
import { UPDATES } from './updates-data'
export const metadata: Metadata = {
  title: 'Updates',
  description: 'Changelog and latest changes on torch.EDC.wiki — new flashlights, features and improvements.',
  alternates: { canonical: `${SITE_URL}/updates` },
  openGraph: {
    title: 'Updates — torch.EDC.wiki',
    description: 'Changelog and latest changes on torch.EDC.wiki.',
    url: `${SITE_URL}/updates`,
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: [OG_IMAGE],
  },
}

export default function UpdatesPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-[1280px] mx-auto px-7 py-8">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.02em]">Updates</h1>
          <p className="mt-2 text-[13px] text-ink-2">What&apos;s new on torch.EDC.wiki</p>
        </div>

        <div className="relative max-w-3xl mx-auto bg-panel border border-line rounded-2xl p-6 sm:p-8">
          <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-px bg-line" />

          <div className="space-y-10 pl-8">
            {UPDATES.map((u, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-panel" />

                <div className="flex items-baseline gap-3 mb-1">
                  <h2 className="font-semibold text-ink">{u.title}</h2>
                  {u.version && (
                    <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded">
                      {u.version}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-3 mb-3">{u.date}</p>
                <ul className="space-y-1.5">
                  {u.items.map((item, j) => (
                    <li key={j} className="text-sm text-ink-2 flex gap-2">
                      <span className="text-slate-300 shrink-0 mt-0.5">–</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
