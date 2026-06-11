import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'
import Header from '@/components/Header'

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

type UpdateEntry = {
  date: string
  title: string
  version?: string
  items: string[]
}

const UPDATES: UpdateEntry[] = [
  {
    date: 'June 11, 2026',
    title: 'Reviews, brand pages, new makers & polish',
    items: [
      'Two new makers added — Prometheus Lights (Alpha, Beta, Delta) and Foursevens (Quark, Mini, Preon, Maelstrom), 13 lights in all',
      'Each flashlight can now list multiple review links — paste a URL and the title and post date are fetched automatically (works with YouTube, Vimeo and articles)',
      'Reviews now show below the user manual on each page, newest first',
      'Per-brand pages now carry maker info and history, plus an "Added by / Updated by" credit like flashlight pages',
      'Renaming a flashlight now updates its page URL to match',
      'Added the 16650 battery type to the filters',
      'Single self-hosted typeface (Inter) across the whole site — faster loads, no third-party font requests, and crisper text on standard and Retina screens',
      'New flashlight-themed "page not found" (404) screen',
      'Cleaner, more consistent layout — centered page titles and tab bars throughout',
      'Better sharing & search — proper page titles, a social preview image, structured data, and an llms.txt for AI assistants',
      'Admins can now send a real password-reset email to a user from the dashboard',
    ],
  },
  {
    date: 'June 11, 2026',
    title: 'Liquid Glass redesign',
    items: [
      'New "Liquid Glass" look — frosted translucent cards and a floating glass navigation bar, inspired by iOS',
      'Floating dark-glass header that page content scrolls underneath; compare bar matches it',
      'Flashlight cards restyled with a soft glass surface, light edge-highlight and a gentle lift on hover',
      'Filter rail: glass pills for lumens and price, minimal underline sort menu, tighter row spacing',
      'Detail page: glass image frame, description moved above the price, refined spec table',
      'White image backgrounds so product photos blend in seamlessly',
      'Amber accent kept scarce — used only for the logo, active filters, the primary button and saved items',
      'Typography cleanup — system (San Francisco) font, no all-caps labels anywhere',
      'Smoother scrolling — reworked the glass effects so the page stays fluid even with many cards',
    ],
  },
  {
    date: 'June 3, 2026',
    title: 'Acebeam catalog, multi-battery support & filters',
    items: [
      '81 Acebeam flashlights added — EDC, tactical, headlamps, high-power searchlights, LEP throwers and dive lights',
      'Flashlights can now list multiple battery options — e.g. "2× 18350 or 1× 18650" — with per-type cell counts',
      'New "Made in" filter, plus brand origin and country of manufacture shown on each flashlight page',
      'New Diving category and 16340 battery type added to filters',
      'Price filter: added $1K+ and $2K+ tiers',
      'LED/emitter names normalized for consistency (e.g. Cree XHP-70.2, Luminus SBT-90.3)',
      'Filter section titles cleaned up — normal case instead of all-caps',
    ],
  },
  {
    date: 'June 3, 2026',
    title: 'Public collections & profile tabs',
    items: [
      'Show your collection on your public profile — opt-in toggle in My Account, off by default',
      'Public collection lists only the flashlight and quantity — purchase price and date stay private',
      'Profile pages now split into Contribute and Collection tabs',
    ],
  },
  {
    date: 'June 2, 2026',
    title: 'UI redesign, user profiles & search improvements',
    items: [
      'Full UI redesign — flat minimalism: warm off-white (#f6f6f3) background, no shadows, 1px borders',
      'JetBrains Mono for all numeric values (lumens, price, specs)',
      'Flashlight cards: single compact spec line "600 lm · 187 m · CR123A", fixed-height layout',
      'Detail page: flat spec table (no zebra), hairline section dividers, no tinted stat boxes',
      'Sidebar filters: custom checkboxes and radio buttons, lighter section headings',
      'Category badges: subtle gray, no all-caps',
      'Image gallery: white background, warm thumbnails with amber active border',
      'Multi-word search — "surefire 6px" now returns correct results',
      'User profile pages at /u/[username] — shows flashlights added and edit contributions',
      'Attribution on flashlight pages now links to contributor profile',
      '"Added by system" shows actual contributor name when a user submitted the flashlight',
      'Cool Fall Tri-V and Trek added to the database',
    ],
  },
  {
    date: 'June 2, 2026',
    title: 'Inline editing, image management & markdown',
    items: [
      '"Edit" button on flashlight pages for admin/mod — skips review queue and saves directly',
      'Regular users still submit edits for review via "Suggest an edit"',
      'Edit form shows existing images — hover to remove or set as primary, add new images',
      'Edit form shows existing PDFs — remove or upload new ones',
      'All image changes (removals, primary swap) applied correctly on approval for pending submissions',
      'Description field supports Markdown — bold, italic, lists, headings, links',
      'Write/Preview toggle on the description field',
      'Cool Fall Trek added to the database',
    ],
  },
  {
    date: 'June 2, 2026',
    title: 'Contributions, manuals & top lists',
    items: [
      'Top Lists page — Recently Added, Newest Release, Most Expensive, Best Value (top 10 each)',
      'Nav active state — current page highlighted in header across all pages',
      'User Manual upload — attach one or more PDF manuals when submitting a flashlight',
      'Multiple PDFs per flashlight — stored as manual.pdf, manual-1.pdf, manual-2.pdf…',
      'Submissions now visible in admin panel (fixed RLS bypass using service role)',
      'Approve/Reject submissions fixed — status update now correctly persists via server-side API',
      'Submission list shows flashlight name for edit submissions, not just raw data',
      'Description field now displayed on flashlight detail pages',
    ],
  },
  {
    date: 'June 1, 2026',
    title: 'Performance & UX improvements',
    items: [
      'Infinite scroll — browse page loads more flashlights automatically as you scroll down',
      'Skeleton loading — browse grid shows shimmer placeholders while data loads',
      'Page fade-in animation on navigation for smoother feel',
      'Image optimization — correct sizes per grid column, priority preload for above-the-fold images',
      'Daily Supabase ping via Vercel Cron to prevent database from pausing on free tier',
      'Results count shown above flashlight grid',
      'Brand/emitter filter cache reduced to 5 minutes; cleared immediately when admin adds flashlights',
    ],
  },
  {
    date: 'June 1, 2026',
    title: 'LED Lenser catalog added',
    items: [
      '60+ LED Lenser flashlights, headlamps and area lights added',
      'Scraped from ledlenserusa.com — specs, pricing and images imported automatically',
    ],
  },
  {
    date: 'June 1, 2026',
    title: 'Admin panel, SEO & Google Analytics',
    items: [
      'Admin panel moved to /admin — moderator role added (review only, no settings)',
      'Two-factor authentication now required to access the admin panel',
      'User management — admin can search users, reset passwords, ban or delete accounts',
      'Google Analytics integration — toggle on/off and set Measurement ID from admin Settings',
      'Admin excluded from GA tracking automatically',
      'Dynamic page titles, meta descriptions and Open Graph tags on every flashlight page',
      'JSON-LD Product structured data for Google rich results',
      'Auto-generated sitemap.xml — updates on deploy or when a new flashlight is approved',
      'robots.txt — search engines allowed, admin/api routes blocked',
      'PWA support — installable as a home screen app on mobile',
      'Mobile hamburger menu',
    ],
  },
  {
    date: 'June 1, 2026',
    title: 'My Account & bug reports',
    items: [
      'Nickname — permanent username, real-time availability check, required to contribute',
      'Email change with verification link',
      'Two-factor authentication (TOTP) with 10 recovery codes',
      'Report an issue page — topic, description, optional screenshot attachment',
      'Anonymous reports require email + captcha; logged-in users skip both',
      'Reports visible in admin panel with New / Read / Resolved tabs',
    ],
  },
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
    <div className="min-h-screen">
      <Header />

      <div className="max-w-[1360px] mx-auto px-7 py-8">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-[#17171a] tracking-[-0.02em]">Updates</h1>
          <p className="mt-2 text-[13px] text-[#6c6c66]">What&apos;s new on torch.EDC.wiki</p>
        </div>

        <div className="relative max-w-3xl mx-auto bg-white border border-[#e7e7e1] rounded-2xl p-6 sm:p-8">
          <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-px bg-[#e7e7e1]" />

          <div className="space-y-10 pl-8">
            {UPDATES.map((u, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />

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
