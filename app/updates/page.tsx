import Header from '@/components/Header'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type UpdateEntry = {
  date: string
  title: string
  version?: string
  items: string[]
}

const UPDATES: UpdateEntry[] = [
  {
    date: 'June 1, 2026',
    title: 'Community contributions & security',
    items: [
      'Contribute page — users can submit new flashlights or suggest edits to existing ones',
      'All submissions go into a pending queue, reviewed before going live',
      'Edit existing flashlight — search and pick any flashlight, form pre-fills with current data',
      'Cloudflare Turnstile captcha on sign up, forgot password, and submit forms',
      'Login rate limiting — locked for 10 minutes after 5 failed attempts',
      'Shorter flashlight URLs — /surefire-m600df instead of /flashlight/surefire-m600df',
      'UI cleanup: removed breadcrumb, neutral gray background, compare bar matches header',
    ],
  },
  {
    date: 'June 1, 2026',
    title: 'Performance & emitter improvements',
    items: [
      'Server-side filtering with pagination — loads 32 flashlights at a time instead of all at once',
      'Multi-LED support: emitters stored as array, filter works with overlapping values',
      'Shared Header component across all pages',
      'GitHub link added to sidebar',
      'Updates page (this page)',
    ],
  },
  {
    date: 'May 31, 2026',
    title: 'User accounts, wishlists & collections',
    items: [
      'Sign in / sign up with email + password',
      'Forgot password & reset password flow',
      'Wishlist — save flashlights you want',
      'Collection — track flashlights you own, with price, material, color, date',
      'Change password page',
      'My Collection button in header',
    ],
  },
  {
    date: 'May 31, 2026',
    title: 'Image hosting & UI polish',
    items: [
      'All images migrated to Vercel Blob CDN — faster global loading',
      'Notes and user manual section on flashlight detail pages',
      'Rebrand to torch.EDC.wiki with warm yellow color scheme',
      'Compact sticky header, mobile-friendly layout',
      'Brand filter list in sidebar',
      'Vercel Analytics and Speed Insights added',
    ],
  },
  {
    date: 'May 30, 2026',
    title: 'Initial launch',
    version: 'Alpha',
    items: [
      'Flashlight database with specs, images, and filters',
      'Browse, search, and filter by brand, category, battery, lumens, price',
      'Flashlight detail pages with full specifications',
      'Compare up to 4 flashlights side by side',
      'First data: Surefire, Malkoff, Weltool',
    ],
  },
]

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 mb-10">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        <div className="relative">
          <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-200" />

          <div className="space-y-10 pl-8">
            {UPDATES.map((u, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-gray-100" />

                <div className="flex items-baseline gap-3 mb-1">
                  <h2 className="font-semibold text-slate-900">{u.title}</h2>
                  {u.version && (
                    <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded">
                      {u.version}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3">{u.date}</p>
                <ul className="space-y-1.5">
                  {u.items.map((item, j) => (
                    <li key={j} className="text-sm text-slate-600 flex gap-2">
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
