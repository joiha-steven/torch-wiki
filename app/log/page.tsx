import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'
import Header from '@/components/Header'
import { Code2 } from 'lucide-react'
import { UPDATES } from './updates-data'

export const metadata: Metadata = {
  title: 'Log',
  description: 'What torch.EDC.wiki is, how it is built, and a changelog of every update.',
  alternates: { canonical: `${SITE_URL}/log` },
  openGraph: {
    title: 'Log - torch.EDC.wiki',
    description: 'What torch.EDC.wiki is, how it is built, and a changelog of every update.',
    url: `${SITE_URL}/log`,
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: [OG_IMAGE],
  },
}

const REPO = 'https://github.com/joiha-steven/torch-wiki'
// Vercel injects the deployed commit SHA at build time.
const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? ''
const SHORT = COMMIT ? COMMIT.slice(0, 7) : null
const COMMIT_URL = COMMIT ? `${REPO}/commit/${COMMIT}` : REPO

// What the site does, in plain language.
const FEATURES: string[] = [
  'A growing catalog of flashlights - kept complete, so discontinued and out-of-stock models stay listed',
  'Deep filters: brand, category, battery type, LED / emitter, lumens, price, charging and country of manufacture',
  'Sort by lumens, price, beam distance, weight or name; the home page reshuffles into a fresh order every day',
  'Compare up to four lights side by side',
  'Full spec sheets, manufacturer manuals (PDF) and curated review links',
  'A personal wishlist and collection tracker, with an optional public profile',
  'Community contributions - add lights or suggest edits, checked through a review queue',
  'Light and dark themes (light / dark / follow system / auto by time of day)',
  'Installs like a real app on phone, tablet and desktop, and keeps working offline',
  'Privacy-first: no tracking, cookieless by default',
]

// The tech it runs on, with a one-line "what it does".
const STACK: { name: string; note: string }[] = [
  { name: 'Next.js + React + TypeScript', note: 'The web framework and language the site is written in' },
  { name: 'Tailwind CSS', note: 'The styling system behind the look and the light/dark themes' },
  { name: 'Supabase (PostgreSQL + Auth)', note: 'The database and the secure sign-in / account system' },
  { name: 'Vercel', note: 'Hosting, global delivery, image optimisation and file (Blob) storage' },
  { name: 'Cloudflare Turnstile', note: 'A privacy-friendly captcha that keeps out spam and bots' },
]

export default function LogPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14">

        {/* Header + version */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-[-0.02em]">Log</h1>
          <p className="mt-3 text-ink-3 text-[15px] leading-relaxed max-w-2xl mx-auto">
            What torch.EDC.wiki is, how it is built, and everything that has changed.
          </p>
          <a
            href={COMMIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-ink-2 bg-panel border border-line rounded-full px-3 py-1.5 hover:border-strong transition-colors"
          >
            <Code2 size={13} />
            {SHORT ? `Version ${SHORT}` : 'View source on GitHub'}
          </a>
        </div>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-ink mb-4">What you can do</h2>
          <div className="bg-panel border border-line rounded-2xl p-6 sm:p-7">
            <ul className="space-y-2">
              {FEATURES.map(f => (
                <li key={f} className="flex gap-2.5 text-[13px] text-ink-2 leading-relaxed">
                  <span className="text-brand-500 shrink-0 mt-0.5">–</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Stack */}
        <section className="mb-14">
          <h2 className="text-lg font-bold text-ink mb-4">Built with</h2>
          <div className="bg-panel border border-line rounded-2xl p-6 sm:p-7 space-y-3">
            {STACK.map(s => (
              <div key={s.name} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                <span className="text-sm font-semibold text-ink shrink-0 sm:w-64">{s.name}</span>
                <span className="text-[13px] text-ink-3 leading-relaxed">{s.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Changelog */}
        <h2 className="text-lg font-bold text-ink mb-5">Changelog</h2>
        <div className="relative bg-panel border border-line rounded-2xl p-6 sm:p-8">
          <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-px bg-line" />

          <div className="space-y-10 pl-8">
            {UPDATES.map((u, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-panel" />

                <div className="flex items-baseline gap-3 mb-1">
                  <h3 className="font-semibold text-ink">{u.title}</h3>
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
