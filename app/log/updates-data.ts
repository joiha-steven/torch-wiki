// Changelog data for /log. Kept in its own module so app/log/page.tsx
// stays well under the 400-line cap as the changelog grows.
export type UpdateEntry = {
  date: string
  title: string
  version?: string
  items: string[]
}

export const UPDATES: UpdateEntry[] = [
  {
    "date": "June 16, 2026",
    "title": "Lumintop catalog, installable app, a new Guide & lots of fixes",
    "items": [
      "Moderators can now suggest deleting a flashlight (a button next to Edit on each light) - it asks for confirmation, then sends the request to admins for approval. Admins review delete suggestions in the Delete tab and can approve or dismiss each, or approve them all at once. The Trash also got an Empty-trash button to clear everything quickly",
      "Admins can now delete a brand too: when deleting, choose whether to move all its products to the Trash as well, or reassign them to another existing brand first. Deleted brands sit in a Trash and are permanently removed after 30 days, with restore available",
      "Admins can now remove a flashlight: search for it, preview it, and move it to a Trash. Trashed lights are unpublished immediately and permanently deleted (with their images) after 30 days, with a chance to restore in the meantime",
      "Tabs on My Account, Contribute and the admin panel now show in the address bar (e.g. /account#security), so you can bookmark or share a direct link to a specific tab and the back button moves between them",
      "The account icon in the header is now white when you are signed out and amber once you sign in, so your sign-in state is clear at a glance",
      "Added a \"Database updates\" page (under Information) that lists every change the community makes - who added or edited which flashlight or brand, with a link to it, timestamped in GMT+7",
      "Fixed resetting your password when two-factor is on - the reset page now asks for your authenticator code and completes the change (previously it showed an \"AAL2 session required\" error)",
      "Tidied the top menu: Updates and Guide now live together under an \"Information\" dropdown. The Updates page is now the \"Log\" page, and starts with a quick overview of every feature, the tech it is built on, and a link to the exact code version on GitHub",
      "The Guide now explains privacy (the site does not track you and stores no personal data - not even your password, which is handled by the database), how the site is licensed, and how to install it like an app",
      "Added a Guide page (in the top menu) that explains how to use the site, what members, moderators and admins can each do, and the community rules - be accurate, no spam, and what happens if you break them",
      "Entries added or edited by the team now show the contributor's name in amber, so you can tell official edits from community ones at a glance",
      "Cleaned up battery data - lights that take alternatives (e.g. “14500 or AA”) are now split into proper separate options, and stray labels were tidied so battery types stay consistent across the catalog",
      "Reworked the Battery & Charging editor when adding or editing a light - battery and charging are now clearly separate, you can list up to 4 battery types each with its own cell count, and the battery type is chosen from a list (now with more sizes, including coin cells and single-use cells) rather than typed by hand",
      "Tidied the LED / Emitter filter: generic UV LEDs are just “UV” (with “UV 365nm/395nm” kept when known), infrared is “IR”, all non-LEP lasers are “Laser”, and Weltool lights no longer list a house “X-LED” label",
      "When adding or editing a flashlight, the LED / Emitter field now suggests existing emitters as you type, so names stay consistent and typos don’t fragment the list",
      "Fixed scroll-to-load-more sometimes stopping early (on the home page and especially after filtering) - the full set of results now loads as you scroll",
      "The filter rail now hides options that would return no results, so the Category, Battery, LED and Brand lists stay relevant to what you're looking at",
      "Added Lumintop's full LED flashlight range - 133 more models across EDC, high-power, camping/area and headlamp lights, from the tiny Tool AA and EDC pocket lights to the big Mach and Tiger high-power throwers",
      "Together with the LEP lasers from earlier, Lumintop now has nearly 150 lights in the database",
      "As always for a wiki, discontinued and out-of-stock models are kept; colour and metal variants are merged into one entry with the materials noted",
      "The “Discontinued” tag on browse cards now spells out the full word (was a clipped “Disc.”) and uses a lighter chip in the bottom corner of the photo, matching the rest of the design",
      "Added Lumintop's full LEP (\"white laser\") flashlight line - 13 models including the Thor series (Thor I, II, II V2, 3, 4, 5, Mini), the Thanos 2.0 and Thanos 23 high-power throwers, the Petal, the pocket W1/W3 lasers and the tiny Ant Man",
      "As a wiki we keep the record complete: discontinued and out-of-stock models are included too",
      "Metal variants (e.g. aluminum vs titanium) are kept as one entry with the materials noted in the description",
      "torch.EDC.wiki now installs as a proper app - on iPhone tap Share → \"Add to Home Screen\", on Android use \"Install app\" - and opens full-screen with no browser bars",
      "No more black flash when it opens: the launch screen now matches the app, in light or dark mode",
      "Opens faster every time and keeps working offline - if you lose signal, the pages you’ve already visited still load, with a tidy offline screen otherwise",
      "Sharper home-screen icon, and the layout now sits clear of the notch, status bar and home indicator on modern phones",
      "Added an automated test suite that checks the core building blocks of the site - battery formatting, link handling and the validation that guards every form - so these keep working as the site grows",
      "Every change now passes a single safety gate before going live: build, type checks, tests and code-quality limits all in one step, with instant rollback ready if anything ever slips through"
    ]
  },
  {
    "date": "June 14, 2026",
    "title": "Reliability & security hardening",
    "items": [
      "Stronger input checks on every contribution and admin action - malformed or oversized requests are now turned away cleanly instead of causing an error",
      "Added a routine database access audit and ran it: every table holding personal data is confirmed locked to its owner, with no unintended public write access",
      "Behind the scenes, automated safety checks now run before any change ships - type-safety plus a live ten-point health check of the site - so problems are caught before they reach you",
      "Tidied the largest parts of the codebase into smaller, focused pieces, making future updates safer and quicker to ship",
      "Clearer password-reset and sign-up screens - once the email is on its way, the form and captcha step aside for a simple confirmation, so it no longer looks like nothing happened"
    ]
  },
  {
    "date": "June 13, 2026",
    "title": "Dark mode & a faster browse page",
    "items": [
      "The browse page now arrives ready - the first set of flashlights and the filter lists are rendered on our servers and sent with the page, instead of loading in after it opens",
      "Noticeably quicker first view, especially on slower connections and far from the US - the grid no longer waits on a round-trip to the database before it appears",
      "Lighter page - each flashlight in the grid now sends only what the card needs, cutting the amount downloaded on first load by roughly two-thirds",
      "Product photos in the first screenful now appear the moment they load instead of waiting on the page to finish setting up - the main image shows up much sooner",
      "The sign-in window and a couple of background scripts now load only when needed, so they no longer add weight to every page",
      "Brand pages load lighter too - they now send only what each flashlight card needs",
      "Trimmed wasted requests and made the page settings load instantly from cache",
      "New dark mode - tap the theme button next to your account icon to switch between Light, Dark, Follow system, or Auto (dark from 6pm to 6am)",
      "Your choice is saved and applied before the page draws, so switching or reloading never flashes",
      "Hand-tuned dark palette - warm graphite surfaces instead of harsh black, a slightly brighter amber accent, and product photos kept on a soft light plate so dark-bodied flashlights stay clear",
      "Browse now shows the flashlight, brand and member counts together above the grid",
      "The cookie banner now appears only when Google Analytics is actually set up - otherwise the site runs purely on cookieless analytics with nothing to consent to"
    ]
  },
  {
    "date": "June 12, 2026",
    "title": "NEXTORCH catalog, browse sorting, security & privacy",
    "items": [
      "Browse now defaults to a Random order that reshuffles every day - so every brand gets a fair turn near the top instead of always being listed A–Z",
      "New \"Random\" option in the Sort by menu; you can still switch to Model, Lumens, Price, Beam distance or Weight anytime",
      "Mobile opens faster - it loads a smaller first batch of flashlights, then fills in more as you scroll",
      "Faster, lighter product images - optimized sizes tuned to each layout with long-term caching",
      "Price and Lumens filters are now clear min–max ranges (e.g. $100–200, 1K–2K lm)",
      "Refined the floating glass header with a subtle cursor-following highlight, and matched its width to the page",
      "Gentle, tasteful motion across the site (and it respects your \"reduce motion\" setting)",
      "Fixed product images that had briefly stopped loading",
      "Hardened image uploads and contribution forms against abuse",
      "Added security headers and tightened how external review links are fetched for previews",
      "Site settings (like the analytics configuration) are now locked to admins at the database level",
      "Friendly error screens with a one-tap \"Try again\" if something goes wrong",
      "Accessibility: a skip-to-content link, clearer labels on icon buttons, and screen-reader improvements on the filters and the compare table",
      "Approved contributions now credit both the original contributor and the reviewer who approved them",
      "NEXTORCH added - 72 flashlights across tactical, duty, EDC, weapon lights, headlamps, penlights and search lights, with full specs and product galleries",
      "Clear, layered licensing: the site code is MIT and our original content & data compilation is CC BY 4.0, while product specs stay factual data and product images remain the property of their respective manufacturers (non-commercial reference use, with notice-and-takedown)",
      "New cookie consent banner - Google Analytics now loads only after you accept, and a new Privacy & Cookies page explains exactly what is and isn’t collected",
      "Footer now states the project’s licensing and non-commercial, brand-independent status",
      "Mobile polish - tidied the spacing between price and the Compare / wishlist / collection controls on flashlight cards"
    ]
  },
  {
    "date": "June 11, 2026",
    "title": "Reviews, brand pages, new makers & Liquid Glass redesign",
    "items": [
      "Two new makers added - Prometheus Lights (Alpha, Beta, Delta) and Foursevens (Quark, Mini, Preon, Maelstrom), 13 lights in all",
      "Each flashlight can now list multiple review links - paste a URL and the title and post date are fetched automatically (works with YouTube, Vimeo and articles)",
      "Reviews now show below the user manual on each page, newest first",
      "Per-brand pages now carry maker info and history, plus an \"Added by / Updated by\" credit like flashlight pages",
      "Renaming a flashlight now updates its page URL to match",
      "Added the 16650 battery type to the filters",
      "Single self-hosted typeface (Inter) across the whole site - faster loads, no third-party font requests, and crisper text on standard and Retina screens",
      "New flashlight-themed \"page not found\" (404) screen",
      "Cleaner, more consistent layout - centered page titles and tab bars throughout",
      "Better sharing & search - proper page titles, a social preview image, structured data, and an llms.txt for AI assistants",
      "Admins can now send a real password-reset email to a user from the dashboard",
      "New \"Liquid Glass\" look - frosted translucent cards and a floating glass navigation bar, inspired by iOS",
      "Floating dark-glass header that page content scrolls underneath; compare bar matches it",
      "Flashlight cards restyled with a soft glass surface, light edge-highlight and a gentle lift on hover",
      "Filter rail: glass pills for lumens and price, minimal underline sort menu, tighter row spacing",
      "Detail page: glass image frame, description moved above the price, refined spec table",
      "White image backgrounds so product photos blend in seamlessly",
      "Amber accent kept scarce - used only for the logo, active filters, the primary button and saved items",
      "Typography cleanup - system (San Francisco) font, no all-caps labels anywhere",
      "Smoother scrolling - reworked the glass effects so the page stays fluid even with many cards"
    ]
  },
  {
    "date": "June 3, 2026",
    "title": "Acebeam catalog, multi-battery support & public collections",
    "items": [
      "81 Acebeam flashlights added - EDC, tactical, headlamps, high-power searchlights, LEP throwers and dive lights",
      "Flashlights can now list multiple battery options - e.g. \"2× 18350 or 1× 18650\" - with per-type cell counts",
      "New \"Made in\" filter, plus brand origin and country of manufacture shown on each flashlight page",
      "New Diving category and 16340 battery type added to filters",
      "Price filter: added $1K+ and $2K+ tiers",
      "LED/emitter names normalized for consistency (e.g. Cree XHP-70.2, Luminus SBT-90.3)",
      "Filter section titles cleaned up - normal case instead of all-caps",
      "Show your collection on your public profile - opt-in toggle in My Account, off by default",
      "Public collection lists only the flashlight and quantity - purchase price and date stay private",
      "Profile pages now split into Contribute and Collection tabs"
    ]
  },
  {
    "date": "June 2, 2026",
    "title": "UI redesign, inline editing, profiles & top lists",
    "items": [
      "Full UI redesign - flat minimalism: warm off-white (#f6f6f3) background, no shadows, 1px borders",
      "JetBrains Mono for all numeric values (lumens, price, specs)",
      "Flashlight cards: single compact spec line \"600 lm · 187 m · CR123A\", fixed-height layout",
      "Detail page: flat spec table (no zebra), hairline section dividers, no tinted stat boxes",
      "Sidebar filters: custom checkboxes and radio buttons, lighter section headings",
      "Category badges: subtle gray, no all-caps",
      "Image gallery: white background, warm thumbnails with amber active border",
      "Multi-word search - \"surefire 6px\" now returns correct results",
      "User profile pages at /u/[username] - shows flashlights added and edit contributions",
      "Attribution on flashlight pages now links to contributor profile",
      "\"Added by system\" shows actual contributor name when a user submitted the flashlight",
      "Cool Fall Tri-V and Trek added to the database",
      "\"Edit\" button on flashlight pages for admin/mod - skips review queue and saves directly",
      "Regular users still submit edits for review via \"Suggest an edit\"",
      "Edit form shows existing images - hover to remove or set as primary, add new images",
      "Edit form shows existing PDFs - remove or upload new ones",
      "All image changes (removals, primary swap) applied correctly on approval for pending submissions",
      "Description field supports Markdown - bold, italic, lists, headings, links",
      "Write/Preview toggle on the description field",
      "Cool Fall Trek added to the database",
      "Top Lists page - Recently Added, Newest Release, Most Expensive, Best Value (top 10 each)",
      "Nav active state - current page highlighted in header across all pages",
      "User Manual upload - attach one or more PDF manuals when submitting a flashlight",
      "Multiple PDFs per flashlight - stored as manual.pdf, manual-1.pdf, manual-2.pdf…",
      "Submissions now visible in admin panel (fixed RLS bypass using service role)",
      "Approve/Reject submissions fixed - status update now correctly persists via server-side API",
      "Submission list shows flashlight name for edit submissions, not just raw data",
      "Description field now displayed on flashlight detail pages"
    ]
  },
  {
    "date": "June 1, 2026",
    "title": "Accounts, contributions, admin panel, SEO & LED Lenser catalog",
    "items": [
      "Infinite scroll - browse page loads more flashlights automatically as you scroll down",
      "Skeleton loading - browse grid shows shimmer placeholders while data loads",
      "Page fade-in animation on navigation for smoother feel",
      "Image optimization - correct sizes per grid column, priority preload for above-the-fold images",
      "Daily Supabase ping via Vercel Cron to prevent database from pausing on free tier",
      "Results count shown above flashlight grid",
      "Brand/emitter filter cache reduced to 5 minutes; cleared immediately when admin adds flashlights",
      "60+ LED Lenser flashlights, headlamps and area lights added",
      "Scraped from ledlenserusa.com - specs, pricing and images imported automatically",
      "Admin panel moved to /admin - moderator role added (review only, no settings)",
      "Two-factor authentication now required to access the admin panel",
      "User management - admin can search users, reset passwords, ban or delete accounts",
      "Google Analytics integration - toggle on/off and set Measurement ID from admin Settings",
      "Admin excluded from GA tracking automatically",
      "Dynamic page titles, meta descriptions and Open Graph tags on every flashlight page",
      "JSON-LD Product structured data for Google rich results",
      "Auto-generated sitemap.xml - updates on deploy or when a new flashlight is approved",
      "robots.txt - search engines allowed, admin/api routes blocked",
      "PWA support - installable as a home screen app on mobile",
      "Mobile hamburger menu",
      "Nickname - permanent username, real-time availability check, required to contribute",
      "Email change with verification link",
      "Two-factor authentication (TOTP) with 10 recovery codes",
      "Report an issue page - topic, description, optional screenshot attachment",
      "Anonymous reports require email + captcha; logged-in users skip both",
      "Reports visible in admin panel with New / Read / Resolved tabs",
      "Contribute page - users can submit new flashlights or suggest edits to existing ones",
      "All submissions go into a pending queue, reviewed before going live",
      "Edit existing flashlight - search and pick any flashlight, form pre-fills with current data",
      "Cloudflare Turnstile captcha on sign up, forgot password, and submit forms",
      "Login rate limiting - locked for 10 minutes after 5 failed attempts",
      "Shorter flashlight URLs - /surefire-m600df instead of /flashlight/surefire-m600df",
      "UI cleanup: removed breadcrumb, neutral gray background, compare bar matches header",
      "Server-side filtering with pagination - loads 32 flashlights at a time instead of all at once",
      "Multi-LED support: emitters stored as array, filter works with overlapping values",
      "Shared Header component across all pages",
      "GitHub link added to sidebar",
      "Updates page (this page)"
    ]
  },
  {
    "date": "May 31, 2026",
    "title": "User accounts, wishlists, collections & image hosting",
    "items": [
      "Sign in / sign up with email + password",
      "Forgot password & reset password flow",
      "Wishlist - save flashlights you want",
      "Collection - track flashlights you own, with price, material, color, date",
      "Change password page",
      "My Collection button in header",
      "All images migrated to Vercel Blob CDN - faster global loading",
      "Notes and user manual section on flashlight detail pages",
      "Rebrand to torch.EDC.wiki with warm yellow color scheme",
      "Compact sticky header, mobile-friendly layout",
      "Brand filter list in sidebar",
      "Vercel Analytics and Speed Insights added"
    ]
  },
  {
    "date": "May 30, 2026",
    "title": "Initial launch",
    "version": "Alpha",
    "items": [
      "Flashlight database with specs, images, and filters",
      "Browse, search, and filter by brand, category, battery, lumens, price",
      "Flashlight detail pages with full specifications",
      "Compare up to 4 flashlights side by side",
      "First data: Surefire, Malkoff, Weltool"
    ]
  }
]
