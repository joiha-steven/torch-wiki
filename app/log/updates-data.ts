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
    "date": "June 17, 2026",
    "title": "Public change history, grid/list browse & slider filters",
    "items": [
      "You can now pick a username when you sign up (optional) - it checks availability as you type and becomes your public @handle right away, instead of having to set it later in Account",
      "The homepage \"users\" count now counts every registered account, including ones that haven't set a username yet",
      "Added a Submit button in the top bar for quickly contributing a flashlight",
      "Change history now tells team and community edits apart: moderator and admin contributors show in amber, regular members in strong grey",
      "Change history now timestamps each entry by when it was submitted, not when it was approved - so a light that waited in the review queue still shows the real add/edit time",
      "The review queue now shows who submitted each entry",
      "Fixed a bug where a moderator adding a new flashlight could still land in the review queue instead of publishing right away",
      "Fixed image uploads failing partway through with a \"Failed to retrieve the client token\" error when adding a flashlight with several photos - each image now retries on its own, so one hiccup no longer fails the whole submission (which used to leave it stuck waiting for review)",
      "A submission that fails partway through now cleans itself up instead of leaving a half-finished, empty draft sitting in the review queue - so the queue only ever shows real, complete submissions and there's no need to double-check whether a light already exists",
      "Browse now has a grid/list toggle (top-right of the results). List view shows a thin row per light with a larger preview image and the key specs inline - lumens, throw, battery and weight - so you can scan and compare more at a glance. Your choice is remembered",
      "The Specifications section now also covers beam intensity (candela), number of LEDs, and driver type - on every flashlight page, the side-by-side Compare, and the contribute/edit form",
      "Every flashlight and brand page now shows its full Change history - who added or edited it and when (GMT+7), newest first, with a \"See more\" button when there are more than 5 entries. Edits are public and on the record",
      "The Lumens and Price filters are now drag sliders instead of fixed buckets, so you can dial in any range - drag the max thumb to the end for \"no upper limit\"",
      "Redesigned this Log page into two tabs - \"About\" (what the site does and what it's built with, as a tidy card grid) and \"Changelog\" - and the changelog now collapses by day, with the newest day open and older days a tap away, so the page stays short instead of one endless column",
      "Fixed a sneaky bug in the contribute/edit forms: scrolling the page while your cursor sat over a number field (like Price) would quietly change the value - type 349 then scroll and it became 348, 347... Number fields now ignore the mouse wheel, so what you type is what gets saved",
      "Added the 10880 cell to the battery options",
      "Behind the scenes: tightened the project's own engineering rules so it can grow long-term and stay easy for the AI that builds it to maintain (every file kept small by splitting into more files rather than padding, and a consistent house style), and refactored the contribute form along those lines (no change to how it works)",
      "Fixed infinite scroll on Browse not loading more results after the page refreshed its list (e.g. when your remembered filters reloaded)",
      "Refreshed the top navigation bar: flat modern glass with a crisp light edge instead of the old glossy 3D look, a touch slimmer, pure black in dark mode, and sitting slightly wider than the page content (with comfortable margins on mobile). The search box is more compact too. Browse also remembers when you've hit \"Show more\" in a filter group (e.g. the full Brand list)",
      "Browse now remembers your filters: pick brands, ranges and so on, open a light, hit Back, and your filters (and which filter groups you'd expanded) are still there instead of resetting. The Brand group is open by default now, the Filters heading stands out more, and Clear all resets everything to default",
      "Added a Terms of Use page (under Information, and linked in the footer) covering how to use the site, the community rules, how contributions are licensed (CC BY 4.0), product-image ownership, and notice-and-takedown. Signing up, contributing or sending a report now shows a short line noting you agree to the Terms - no extra checkbox to tick",
      "Material is now structured instead of free text: pick up to 3 materials, each with a finish (e.g. anodized, stonewashed, PVD) and - where it applies - a colour, so specs read consistently (e.g. \"Aluminum · Anodized · Black + Titanium · Stonewashed\"). Damasteel lets you choose the pattern and whether it's etched. Existing flashlights keep their current material text until they're edited",
      "Added a short notice at the top of the add-a-flashlight form: verify details first, don't add duplicates (they won't be approved - search the catalog first), and fields marked * are required. The Model field now also suggests matches before you've picked a brand",
      "The contribute/edit form now guides you as you go: Brand and Model suggest existing entries as you type (so you reuse the right name), and if a flashlight with the same brand + model already exists it warns you with a link to it before you add a duplicate. Each field also has a short hint - e.g. enter numbers only for lumens/candela/price (no units), and how to name LEDs cleanly (brand + model, no CRI or colour temp)",
      "Tidied the filter sidebar: the Sort by control is now a clean bordered dropdown (no more doubled-up underlines near Brand), and the divider line above the credits at the bottom is gone",
      "Moved the site credits/licensing line back to the bottom of the filter column where it belongs",
      "Made the Browse filter sidebar much more compact: each filter group now collapses (Lumens, Price and Category open by default, the rest a tap away), and long lists like Brand, Battery and LED/Emitter show the top few with a \"Show more\" - a count next to a collapsed group still tells you it's filtering. Far less scrolling to reach what you want",
      "Behind the scenes: closed a database permission gap so the catalog tables are read-only to the public (edits still go through the proper review/admin paths) and tightened a few internal database functions",
      "Behind the scenes: the brand data-import scripts and the scraping playbook are now kept in our private workspace rather than the public code repo - they're a maintenance tool, not part of the site",
      "Behind the scenes: the Database updates page is now edge-cached so it loads instantly (it refreshes whenever a change is approved), flashlight pages build a little faster, and lint now runs in the pre-deploy quality gate",
      "Behind the scenes: reorganized the internal project documentation so it stays easy to navigate as the project grows - the main guide is now a lean rules-and-index file pointing to focused topic docs (database, auth, caching, UI, images, a glossary, and a code map)"
    ]
  },
  {
    "date": "June 16, 2026",
    "title": "Installable app, a new Guide, admin delete tools & fixes",
    "items": [
      "Behind the scenes: public profile pages are now edge-cached for a minute, so they load faster on repeat visits",
      "Browse cards now quietly preload a flashlight page the moment you hover over it, so opening it feels instant - without slowing the initial page load (nothing is preloaded until you show interest)",
      "Redesigned the Log and Guide pages to use the full width on desktop - they now lay out in two columns, and the Log's feature list is fuller, explaining what each feature actually does",
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
      "The “Discontinued” tag on browse cards now spells out the full word (was a clipped “Disc.”) and uses a lighter chip in the bottom corner of the photo, matching the rest of the design",
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
    "title": "Browse sorting, security & privacy",
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
      "Clear, layered licensing: the site code is MIT and our original content & data compilation is CC BY 4.0, while product specs stay factual data and product images remain the property of their respective manufacturers (non-commercial reference use, with notice-and-takedown)",
      "New cookie consent banner - Google Analytics now loads only after you accept, and a new Privacy & Cookies page explains exactly what is and isn’t collected",
      "Footer now states the project’s licensing and non-commercial, brand-independent status",
      "Mobile polish - tidied the spacing between price and the Compare / wishlist / collection controls on flashlight cards"
    ]
  },
  {
    "date": "June 11, 2026",
    "title": "Reviews, brand pages & Liquid Glass redesign",
    "items": [
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
    "title": "Multi-battery support & public collections",
    "items": [
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
      "\"Edit\" button on flashlight pages for admin/mod - skips review queue and saves directly",
      "Regular users still submit edits for review via \"Suggest an edit\"",
      "Edit form shows existing images - hover to remove or set as primary, add new images",
      "Edit form shows existing PDFs - remove or upload new ones",
      "All image changes (removals, primary swap) applied correctly on approval for pending submissions",
      "Description field supports Markdown - bold, italic, lists, headings, links",
      "Write/Preview toggle on the description field",
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
    "title": "Accounts, contributions, admin panel & SEO",
    "items": [
      "Infinite scroll - browse page loads more flashlights automatically as you scroll down",
      "Skeleton loading - browse grid shows shimmer placeholders while data loads",
      "Page fade-in animation on navigation for smoother feel",
      "Image optimization - correct sizes per grid column, priority preload for above-the-fold images",
      "Daily Supabase ping via Vercel Cron to prevent database from pausing on free tier",
      "Results count shown above flashlight grid",
      "Brand/emitter filter cache reduced to 5 minutes; cleared immediately when admin adds flashlights",
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
      "Compare up to 4 flashlights side by side"
    ]
  }
]
