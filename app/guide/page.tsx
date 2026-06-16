import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  Compass, SlidersHorizontal, GitCompare, Heart, ShieldCheck,
  PencilLine, Eye, UserCheck, ShieldHalf, AlertTriangle,
} from 'lucide-react'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Guide - How torch.EDC.wiki works',
  description:
    'How to browse, contribute, and the rules of the community - plus what visitors, members and moderators can each do.',
  alternates: { canonical: `${SITE_URL}/guide` },
}

// Static content page - no DB reads.
export const dynamic = 'force-static'

type Role = {
  icon: React.ReactNode
  name: string
  who: string
  can: string[]
  accent: string
}

const ROLES: Role[] = [
  {
    icon: <Eye size={18} />,
    name: 'Visitor',
    who: 'Anyone, no account needed',
    accent: 'text-ink-2',
    can: [
      'Browse and search the full catalog',
      'Filter by brand, category, battery, LED, lumens, price and more',
      'Compare up to 4 lights side by side',
      'Read specs, reviews and manuals',
    ],
  },
  {
    icon: <UserCheck size={18} />,
    name: 'Member',
    who: 'Signed in with a nickname set',
    accent: 'text-blue-600',
    can: [
      'Everything a visitor can do',
      'Save a wishlist and track your own collection',
      'Submit new flashlights and suggest edits (sent to the review queue)',
      'Report problems on any page',
    ],
  },
  {
    icon: <ShieldHalf size={18} />,
    name: 'Moderator',
    who: 'Appointed by the owner',
    accent: 'text-brand-600',
    can: [
      'Everything a member can do',
      'Review the queue - approve or reject submissions',
      'Edit flashlights and brand info directly (changes go live immediately)',
      'Upload manuals straight to a light',
      'Their nickname shows in amber on entries they add or edit',
    ],
  },
]

type HowTo = { icon: React.ReactNode; title: string; body: string }

const USING: HowTo[] = [
  {
    icon: <Compass size={18} />,
    title: 'Browse',
    body: 'The home page lists every light in a fresh random order each day. Scroll to load more - there is no pagination to click through.',
  },
  {
    icon: <SlidersHorizontal size={18} />,
    title: 'Filter & sort',
    body: 'Use the filter rail to narrow by brand, category, battery type, LED/emitter, lumens, price, charging and country of manufacture. Options that would return nothing are hidden automatically. Sort by lumens, price, beam distance, weight or name.',
  },
  {
    icon: <GitCompare size={18} />,
    title: 'Compare',
    body: 'Tick the compare box on up to four cards, then open Compare to see their specs in one table.',
  },
  {
    icon: <Heart size={18} />,
    title: 'Lists & collection',
    body: 'Sign in to keep a wishlist and log the lights you own (with price, material and date). You can choose to show your collection on your public profile - quantities only, never prices or dates.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Secure your account',
    body: 'Set a strong password and turn on two-factor authentication in My Account → Security. You will get recovery codes - keep them somewhere safe.',
  },
  {
    icon: <PencilLine size={18} />,
    title: 'Contribute',
    body: 'Add a new flashlight or suggest an edit from the Contribute page (you need an account and a nickname). Submissions go to a review queue; once approved they appear on the site and on your public profile.',
  },
]

const RULES: { title: string; body: string }[] = [
  {
    title: 'Be accurate',
    body: 'Only add specs you can verify - from the manufacturer, the manual, or a reliable review. Do not guess or pad numbers. When unsure, leave a field blank rather than filling it with something wrong.',
  },
  {
    title: 'No spam, no promotion',
    body: 'No advertising, affiliate links, referral codes or self-promotion. Do not submit the same light twice or open junk reports. Contribute to build the wiki, not to push traffic.',
  },
  {
    title: 'Respect ownership of images',
    body: 'Product images belong to their manufacturers and are used here only as non-commercial reference. Do not upload images you have no right to use.',
  },
]

export default function GuidePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14">

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-[-0.02em]">How torch.EDC.wiki works</h1>
          <p className="mt-3 text-ink-3 text-[15px] leading-relaxed max-w-2xl mx-auto">
            A community-built reference for flashlights - including discontinued and
            out-of-stock models, because it is a wiki. Anyone can read it, members help
            grow it, and a small team keeps it accurate. Here is how it all fits together.
          </p>
        </div>

        {/* Using the site */}
        <section className="mb-14">
          <h2 className="text-lg font-bold text-ink mb-5">Using the site</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {USING.map(h => (
              <div key={h.title} className="bg-panel border border-line rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5 text-brand-600">
                  {h.icon}
                  <h3 className="text-sm font-semibold text-ink">{h.title}</h3>
                </div>
                <p className="text-[13px] text-ink-3 leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="mb-14">
          <h2 className="text-lg font-bold text-ink mb-2">Who can do what</h2>
          <p className="text-[13px] text-ink-3 mb-5 leading-relaxed">
            Permissions are layered - each level can do everything the one above it can, plus more.
          </p>
          <div className="space-y-3">
            {ROLES.map(r => (
              <div key={r.name} className="bg-panel border border-line rounded-xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className={r.accent}>{r.icon}</span>
                  <h3 className="text-sm font-bold text-ink">{r.name}</h3>
                  <span className="text-[12px] text-ink-3">· {r.who}</span>
                </div>
                <ul className="space-y-1.5">
                  {r.can.map(c => (
                    <li key={c} className="flex gap-2 text-[13px] text-ink-2 leading-relaxed">
                      <span className="text-brand-500 shrink-0">–</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section className="mb-14">
          <h2 className="text-lg font-bold text-ink mb-5">Community rules</h2>
          <div className="space-y-3">
            {RULES.map(rule => (
              <div key={rule.title} className="bg-panel border border-line rounded-xl p-5">
                <h3 className="text-sm font-semibold text-ink mb-1">{rule.title}</h3>
                <p className="text-[13px] text-ink-3 leading-relaxed">{rule.body}</p>
              </div>
            ))}
          </div>

          {/* Enforcement */}
          <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50/60 dark:bg-red-500/5 p-5">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-ink mb-1">If you break the rules</h3>
              <p className="text-[13px] text-ink-3 leading-relaxed">
                Inaccurate, spammy or low-effort submissions are rejected. Deliberately
                adding false information, spamming, or repeated abuse will get your
                account banned - losing access to contributing, your lists and your
                collection. Honest mistakes are fine; just fix them or let us know.
              </p>
            </div>
          </div>
        </section>

        {/* Deleting your account */}
        <section className="mb-14">
          <h2 className="text-lg font-bold text-ink mb-5">Deleting your account</h2>
          <div className="bg-panel border border-line rounded-xl p-5">
            <p className="text-[13px] text-ink-3 leading-relaxed">
              Want your account removed? Head to the{' '}
              <Link href="/report" className="text-brand-600 font-medium hover:text-brand-500">Report</Link>{' '}
              page and let us know - we will delete it for you, along with your lists and collection.
            </p>
          </div>
        </section>

        <p className="text-[13px] text-ink-3 leading-relaxed border-t border-line pt-6">
          Questions or something wrong on a page? Use the{' '}
          <Link href="/report" className="text-brand-600 font-medium hover:text-brand-500">Report</Link>{' '}
          page. This is a non-commercial reference project and is not affiliated with any brand.
        </p>

      </div>
    </div>
  )
}
