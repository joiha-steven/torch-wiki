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
    date: 'June 16, 2026',
    title: 'Lumintop LEP throwers added',
    items: [
      'Added Lumintop\'s full LEP ("white laser") flashlight line — 13 models including the Thor series (Thor I, II, II V2, 3, 4, 5, Mini), the Thanos 2.0 and Thanos 23 high-power throwers, the Petal, the pocket W1/W3 lasers and the tiny Ant Man',
      'As a wiki we keep the record complete: discontinued and out-of-stock models are included too',
      'Metal variants (e.g. aluminum vs titanium) are kept as one entry with the materials noted in the description',
    ],
  },
  {
    date: 'June 16, 2026',
    title: 'Add it to your home screen like an app',
    items: [
      'torch.EDC.wiki now installs as a proper app — on iPhone tap Share → "Add to Home Screen", on Android use "Install app" — and opens full-screen with no browser bars',
      'No more black flash when it opens: the launch screen now matches the app, in light or dark mode',
      'Opens faster every time and keeps working offline — if you lose signal, the pages you’ve already visited still load, with a tidy offline screen otherwise',
      'Sharper home-screen icon, and the layout now sits clear of the notch, status bar and home indicator on modern phones',
    ],
  },
  {
    date: 'June 16, 2026',
    title: 'Behind the scenes: automated testing',
    items: [
      'Added an automated test suite that checks the core building blocks of the site — battery formatting, link handling and the validation that guards every form — so these keep working as the site grows',
      'Every change now passes a single safety gate before going live: build, type checks, tests and code-quality limits all in one step, with instant rollback ready if anything ever slips through',
    ],
  },
  {
    date: 'June 14, 2026',
    title: 'Reliability & security hardening',
    items: [
      'Stronger input checks on every contribution and admin action — malformed or oversized requests are now turned away cleanly instead of causing an error',
      'Added a routine database access audit and ran it: every table holding personal data is confirmed locked to its owner, with no unintended public write access',
      'Behind the scenes, automated safety checks now run before any change ships — type-safety plus a live ten-point health check of the site — so problems are caught before they reach you',
      'Tidied the largest parts of the codebase into smaller, focused pieces, making future updates safer and quicker to ship',
      'Clearer password-reset and sign-up screens — once the email is on its way, the form and captcha step aside for a simple confirmation, so it no longer looks like nothing happened',
    ],
  },
  {
    date: 'June 13, 2026',
    title: 'Faster browse page',
    items: [
      'The browse page now arrives ready — the first set of flashlights and the filter lists are rendered on our servers and sent with the page, instead of loading in after it opens',
      'Noticeably quicker first view, especially on slower connections and far from the US — the grid no longer waits on a round-trip to the database before it appears',
      'Lighter page — each flashlight in the grid now sends only what the card needs, cutting the amount downloaded on first load by roughly two-thirds',
      'Product photos in the first screenful now appear the moment they load instead of waiting on the page to finish setting up — the main image shows up much sooner',
      'The sign-in window and a couple of background scripts now load only when needed, so they no longer add weight to every page',
      'Brand pages load lighter too — they now send only what each flashlight card needs',
      'Trimmed wasted requests and made the page settings load instantly from cache',
    ],
  },
  {
    date: 'June 13, 2026',
    title: 'Dark mode',
    items: [
      'New dark mode — tap the theme button next to your account icon to switch between Light, Dark, Follow system, or Auto (dark from 6pm to 6am)',
      'Your choice is saved and applied before the page draws, so switching or reloading never flashes',
      'Hand-tuned dark palette — warm graphite surfaces instead of harsh black, a slightly brighter amber accent, and product photos kept on a soft light plate so dark-bodied flashlights stay clear',
      'Browse now shows the flashlight, brand and member counts together above the grid',
      'The cookie banner now appears only when Google Analytics is actually set up — otherwise the site runs purely on cookieless analytics with nothing to consent to',
    ],
  },
  {
    date: 'June 12, 2026',
    title: 'Browse sorting, mobile loading & performance',
    items: [
      'Browse now defaults to a Random order that reshuffles every day — so every brand gets a fair turn near the top instead of always being listed A–Z',
      'New "Random" option in the Sort by menu; you can still switch to Model, Lumens, Price, Beam distance or Weight anytime',
      'Mobile opens faster — it loads a smaller first batch of flashlights, then fills in more as you scroll',
      'Faster, lighter product images — optimized sizes tuned to each layout with long-term caching',
      'Price and Lumens filters are now clear min–max ranges (e.g. $100–200, 1K–2K lm)',
      'Refined the floating glass header with a subtle cursor-following highlight, and matched its width to the page',
      'Gentle, tasteful motion across the site (and it respects your "reduce motion" setting)',
      'Fixed product images that had briefly stopped loading',
    ],
  },
  {
    date: 'June 12, 2026',
    title: 'Security, privacy & accessibility',
    items: [
      'Hardened image uploads and contribution forms against abuse',
      'Added security headers and tightened how external review links are fetched for previews',
      'Site settings (like the analytics configuration) are now locked to admins at the database level',
      'Friendly error screens with a one-tap "Try again" if something goes wrong',
      'Accessibility: a skip-to-content link, clearer labels on icon buttons, and screen-reader improvements on the filters and the compare table',
      'Approved contributions now credit both the original contributor and the reviewer who approved them',
    ],
  },
  {
    date: 'June 12, 2026',
    title: 'NEXTORCH catalog, licensing & privacy',
    items: [
      'NEXTORCH added — 72 flashlights across tactical, duty, EDC, weapon lights, headlamps, penlights and search lights, with full specs and product galleries',
      'Clear, layered licensing: the site code is MIT and our original content & data compilation is CC BY 4.0, while product specs stay factual data and product images remain the property of their respective manufacturers (non-commercial reference use, with notice-and-takedown)',
      'New cookie consent banner — Google Analytics now loads only after you accept, and a new Privacy & Cookies page explains exactly what is and isn’t collected',
      'Footer now states the project’s licensing and non-commercial, brand-independent status',
      'Mobile polish — tidied the spacing between price and the Compare / wishlist / collection controls on flashlight cards',
    ],
  },
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
