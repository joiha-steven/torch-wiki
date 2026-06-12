# Torch EDC.wiki

[![Code: MIT](https://img.shields.io/badge/Code-MIT-blue.svg)](./LICENSE) [![Content: CC BY 4.0](https://img.shields.io/badge/Content-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

A community reference database for flashlight collectors and enthusiasts. Built by a flashlight hobbyist, for flashlight hobbyists.

No ads. No fees. No profit.

**Live site:** [torch.edc.wiki](https://torch.edc.wiki) — **GitHub:** [joiha-steven/torch-wiki](https://github.com/joiha-steven/torch-wiki)

---

## What is this?

Flashlight collecting is a niche hobby with a passionate community but no central, structured reference. Specs are scattered across manufacturer pages, forum threads, and YouTube reviews. This project aims to fix that — one flashlight at a time.

---

## Features

**Browsing & discovery**
- Filter by brand, category, battery type, LED/emitter, country of manufacture ("Made in"), max lumens, price range, and charging method
- Sort by Random (the default — reshuffled daily so every brand gets fair exposure), model, lumens, price, beam distance, or weight
- Multi-word search — "surefire 6px" matches brand + model simultaneously
- Compare up to 4 flashlights side by side
- Top Lists — recently added, newest releases, most expensive, best value

**Appearance**
- Light and dark themes, switchable from the header — Light, Dark, Follow system, or Auto (dark 6pm–6am)
- Choice is saved and applied before first paint (no flash on reload); defaults to Light until you choose
- Warm graphite dark palette built on CSS color tokens flipped by `data-theme`; product photos stay on a light plate so dark-bodied lights remain legible
- Fonts and the Liquid Glass effects are shared across both themes

**Flashlight pages**
- Full spec sheet: lumens, beam distance, emitter, battery, dimensions, weight, IP rating, charging
- Multiple battery options per light (e.g. 2× 18350 or 1× 18650), with per-type cell counts
- Brand origin and country of manufacture ("Made in")
- Image gallery, Markdown description, user manual PDFs
- Linked reviews (articles & videos) — add by pasting a URL; the title and post date are fetched automatically (YouTube, Vimeo, blogs)
- Attribution timeline — links to contributor profile

**Brand pages** (`/brand/[name]`)
- Per-maker page with company info and history, flashlights grouped by release year
- "Added by / Updated by" credit, like flashlight pages
- Editable by admins/mods directly; users can suggest edits

**User profiles** (`/u/[username]`)
- Public profile with Contribute and Collection tabs
- Contribute tab: flashlights added and edits contributed, with thumbnails and dates
- Collection tab (opt-in): flashlights owned and quantity — price and purchase date stay private

**User accounts**
- Free sign up with email + password
- Wishlist — save flashlights you want
- Collection — track flashlights you own (purchase price, date, material, quantity); optionally make it public on your profile
- My Account — change email (verification link sent to new address), set a permanent nickname (can't be changed after saving), change password
- Two-factor authentication (TOTP) with recovery codes

**Community contributions**
- Submit new flashlights or suggest edits to existing ones
- Edit form shows existing images and PDFs — remove, reorder, or upload new
- Attach one or more PDF user manuals to any submission
- All submissions go into a pending queue — reviewed before going live
- Requires a nickname to contribute

**Admin panel** (`/admin`)
- Role-based access: admin (full control) and moderator (review only)
- 2FA required to access the admin panel
- "Edit" button on each flashlight page — admin/mod edits apply instantly, bypassing the queue
- Review queue with before/after diff for edits
- User management: search, reset password, ban, delete
- On approval: PDFs moved from temp storage to `flashlights/{slug}/`, removed images deleted from Blob
- Google Analytics toggle and Measurement ID setting
- Force cache clear button

**Security**
- Cloudflare Turnstile captcha on signup, forgot password, and submission forms
- Login rate limiting: 5 failed attempts → 10-minute lockout
- 2FA with SHA-256 hashed recovery codes
- Image-upload tokens require a valid session or a passed Turnstile (no open upload endpoint)
- Site settings restricted to admins at the database level (Row-Level Security)
- SSRF-guarded link-preview fetcher; baseline security headers (HSTS, nosniff, frame, referrer, permissions)
- Admin email kept server-side only — never shipped in the client bundle

**Performance**
- Flashlight detail pages pre-rendered at build time (SSG), served from Vercel edge
- Browse page server-renders its first batch + filter lists (ISR, hourly) next to the database, so the grid arrives in the HTML — no client round-trip to the DB on first paint
- Browse grid fetches only the columns each card renders (not whole rows), cutting first-load payload by ~⅔; counts use estimated mode to avoid full table scans
- Sign-in modal (and its captcha) is lazy-loaded only when opened, off the first-paint bundle
- On-demand cache invalidation when admin approves changes — no stale data
- User pages (`/my`, `/account`, `/contribute`) never cached — always fresh
- Supabase and Vercel both in `us-east-1` (North Virginia) for minimal latency
- Infinite scroll on browse page — loads more flashlights automatically as you scroll (mobile loads a smaller first batch for a faster open)
- Skeleton loading with shimmer effect while data loads
- Image optimization tuned to the actual layouts (fewer size variants, 1-year cache) for faster LCP and lower cost
- Random browse order reshuffled nightly via a Postgres `pg_cron` job
- Daily Vercel Cron ping keeps Supabase free tier from pausing

**SEO**
- Dynamic `<title>`, `<meta description>`, and Open Graph tags per flashlight page
- JSON-LD Product structured data on every flashlight page
- Auto-generated `/sitemap.xml` — updates on deploy or when admin adds a flashlight
- `/robots.txt` — search engines allowed, admin/api routes blocked

**Analytics & privacy**
- Google Analytics — toggle on/off and set Measurement ID from admin panel
- Admin user excluded from tracking automatically
- Cookie consent banner — shown only when Google Analytics is configured; GA loads (and the `_ga` cookie is set) only after the visitor clicks Accept. With no Measurement ID set, the banner is hidden and the site runs purely on cookieless Vercel Analytics
- Conversion goals tracked via cookieless Vercel Analytics custom events (sign-up, wishlist/collection adds, contributions)
- Privacy & Cookies page (`/privacy`) explaining what is and isn't collected

---

## Tech Stack

- [Next.js](https://nextjs.org) — App Router, TypeScript, Turbopack
- [Supabase](https://supabase.com) — PostgreSQL database + Auth (email/password + TOTP 2FA)
- [Vercel](https://vercel.com) — hosting, Blob CDN (images + PDFs), Analytics, Speed Insights
- [Tailwind CSS v4](https://tailwindcss.com) — custom brand scale (`#eba00b`), warm off-white surface, light/dark themes via `data-theme` color tokens
- [Inter](https://rsms.me/inter/) — single self-hosted variable typeface (no third-party font requests)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) — captcha

---

## Running locally

```bash
git clone https://github.com/joiha-steven/torch-wiki.git
cd torch-wiki
npm install
```

Create `.env.local` with values from your Supabase, Vercel, and Cloudflare dashboards:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
BLOB_READ_WRITE_TOKEN=...
BLOB_STORE_ID=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

Or pull from Vercel CLI (then add Supabase keys + Turnstile keys manually):
```bash
npx vercel env pull .env.local
```

Set `NEXT_PUBLIC_ADMIN_EMAIL` to the email address that should have admin access (bootstrapping fallback — proper admin access is controlled by `profiles.is_admin` in the database).

```bash
npm run dev
```

---

## Database migration (manual_urls)

To support multiple PDFs per flashlight, run this SQL in Supabase:

```sql
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS manual_urls text[] DEFAULT '{}';
UPDATE flashlights
SET manual_urls = ARRAY[manual_url]
WHERE manual_url IS NOT NULL AND (manual_urls IS NULL OR manual_urls = '{}');
```

---

## Adding flashlights

1. Insert data via Supabase Table Editor or SQL
2. Run image migration to host images on Vercel Blob:
```bash
node scripts/migrate-to-vercel-blob.mjs
```

Script is safe to re-run — skips images already on Blob. Some brand CDNs require a `Referer` header (handled via `refererMap` in the script).

**Bulk seeding a whole brand:** each brand gets a `scripts/seed-<brand>.mjs` that inserts rows and re-hosts images to Vercel Blob in the same run. Shopify-based stores (Nextorch, LED Lenser, Foursevens/Prometheus…) are pulled straight from `products.json`. See [`SCRAPING.md`](./SCRAPING.md) for the full rules.

---

## How this was built

This site was created by **Steven Tran (Trần Mạnh Hùng)** — a flashlight hobbyist, not a software developer. The application is built almost entirely with [Claude Code](https://claude.com/claude-code), Anthropic's agentic coding tool: the author directs the work in plain language and Claude writes the code. The author doesn't hand-write the code and doesn't formally review it.

Because of that, the sensitive parts are deliberately handled by trusted, managed services rather than custom code:

- **Accounts, passwords, and two-factor authentication are managed by [Supabase Auth](https://supabase.com/auth).** Passwords are hashed and stored inside Supabase's managed auth system (never in this app's own tables or code), and TOTP 2FA is handled by Supabase — so credential security does not depend on hand-written code.
- **Database access is guarded by Supabase Row-Level Security**, enforced at the database layer, plus Cloudflare Turnstile captcha and login rate-limiting.
- The site is **non-commercial** and stores minimal personal data — your email, an optional public nickname, and your own wishlist/collection. See [Privacy & Cookies](https://torch.edc.wiki/privacy).

If you spot a security or data issue, please [open an issue on GitHub](https://github.com/joiha-steven/torch-wiki/issues) — it will be taken seriously.

---

## License & content

This is a **non-commercial reference project** with no affiliation to any flashlight brand. Different layers of the project carry different legal status — they are **not** under a single blanket license. Full details in [`LICENSE`](./LICENSE) (code) and [`LICENSE-CONTENT.md`](./LICENSE-CONTENT.md) (everything else).

| Layer | What it covers | Owner | License / status |
|---|---|---|---|
| **Source code** | The application code in this repository | torch.edc.wiki | [MIT](./LICENSE) |
| **Compilation & original text** | Schema, data selection/arrangement, descriptions, notes, comparisons | torch.edc.wiki | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (incl. sui generis database right) |
| **Factual specifications** | Lumens, battery, dimensions, IP rating, etc. | No one (facts) | Not copyrightable — no license needed |
| **Product images** | Photos of products | Respective manufacturers | Not licensed; non-commercial reference use only; notice-and-takedown |

Product images belong to their respective manufacturers and are shown for non-commercial identification and reference only. We make no copyright or licensing claim over them. **Rights holders:** if you'd like an image removed, contact us and we'll take it down promptly.
