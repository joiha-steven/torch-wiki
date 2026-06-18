import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'
import Header from '@/components/Header'
import { Code2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { UPDATES } from './updates-data'
import LogTabs from './LogTabs'
import type { LogRow } from './DataUpdatesTab'

export const metadata: Metadata = {
  title: 'Log',
  description: 'What torch.EDC.wiki is, how it is built, a changelog of every update, and the community database-change feed.',
  alternates: { canonical: `${SITE_URL}/log` },
  openGraph: {
    title: 'Log - torch.EDC.wiki',
    description: 'What torch.EDC.wiki is, how it is built, a changelog of every update, and the community database-change feed.',
    url: `${SITE_URL}/log`,
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: [OG_IMAGE],
  },
}

// The Database tab pulls the community data-change feed. ISR (5 min); approving a
// submission calls revalidatePath('/log') so the feed stays fresh. The feed is
// short (~100s) so a single page covers it - no in-tab pagination needed.
export const revalidate = 300
const DATA_FEED_LIMIT = 500

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

export default async function LogPage() {
  const [{ data: rows }, { data: total }] = await Promise.all([
    supabase.rpc('data_change_log', { p_limit: DATA_FEED_LIMIT, p_offset: 0 }),
    supabase.rpc('data_change_log_count'),
  ])
  const dataEvents = (rows ?? []) as LogRow[]
  const dataCount = (total ?? 0) as number

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

        <LogTabs features={FEATURES} stack={STACK} updates={UPDATES} dataEvents={dataEvents} dataCount={dataCount} />
      </div>
    </div>
  )
}
