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

// What the site does, in plain language - one short title + a fuller explanation.
const FEATURES: { title: string; body: string }[] = [
  {
    title: 'Complete catalog',
    body: 'A growing database of flashlights kept deliberately complete - discontinued, out-of-stock and older models all stay listed, because this is a reference wiki, not a shop.',
  },
  {
    title: 'Deep filtering',
    body: 'Narrow the catalog by brand, category, battery type, LED / emitter, lumen range, price range, charging method and country of manufacture. Options that would return nothing are hidden automatically.',
  },
  {
    title: 'Flexible sorting',
    body: 'Order by lumens, price, beam distance, weight or name. The home page reshuffles into a fresh random order every day, so you keep running into lights you have not seen.',
  },
  {
    title: 'Side-by-side compare',
    body: 'Pick up to four lights and see every spec lined up in one table to settle which one actually wins.',
  },
  {
    title: 'Full spec sheets',
    body: 'Each light has complete specifications, the manufacturer manual (PDF) and a curated set of trustworthy review links - written, video and forum.',
  },
  {
    title: 'Wishlist & collection',
    body: 'Sign in to keep a wishlist and log the lights you own, with purchase price, material, colour and date. Your collection stays private unless you choose to show it.',
  },
  {
    title: 'Public profile',
    body: 'An optional public profile shows the lights you have contributed and, if you opt in, your collection - quantities only, never prices or dates.',
  },
  {
    title: 'Community contributions',
    body: 'Add new flashlights or suggest edits to existing ones. Everything passes through a moderated review queue before it goes live, so the data stays trustworthy.',
  },
  {
    title: 'Light & dark themes',
    body: 'Four display modes: light, dark, follow your system, or switch automatically by the time of day.',
  },
  {
    title: 'Installable app (PWA)',
    body: 'Add it to your phone, tablet or desktop and it opens full-screen like a native app, launches faster, and keeps working offline for pages you have already opened.',
  },
  {
    title: 'Privacy-first',
    body: 'No tracking and no third-party ads. Cookieless by default, and no personal data is stored beyond the email and nickname an account needs.',
  },
  {
    title: 'Open & reusable',
    body: 'The code is open source under MIT and the original content is shared under CC BY 4.0 - reuse it freely with credit.',
  },
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

      <div className="max-w-6xl mx-auto px-6 py-10 sm:py-14">

        {/* Header + version */}
        <div className="text-center mb-12">
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

        {/* Two columns on desktop: left = Features + Built with, right = Changelog.
            Stacks to one column (left first) on mobile. */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-start">

          {/* Left: Features + Built with */}
          <div className="space-y-12">
            <section>
              <h2 className="text-lg font-bold text-ink mb-5">Features</h2>
              <div className="bg-panel border border-line rounded-2xl p-6 sm:p-7">
                <ul className="space-y-4">
                  {FEATURES.map(f => (
                    <li key={f.title} className="flex gap-2.5">
                      <span className="text-brand-500 shrink-0 mt-1">–</span>
                      <div>
                        <span className="text-sm font-semibold text-ink">{f.title}</span>
                        <p className="text-[13px] text-ink-3 leading-relaxed mt-0.5">{f.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-ink mb-5">Built with</h2>
              <div className="bg-panel border border-line rounded-2xl p-6 sm:p-7 space-y-3">
                {STACK.map(s => (
                  <div key={s.name} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="text-sm font-semibold text-ink shrink-0 sm:w-56">{s.name}</span>
                    <span className="text-[13px] text-ink-3 leading-relaxed">{s.note}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Changelog */}
          <section>
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
          </section>

        </div>
      </div>
    </div>
  )
}
