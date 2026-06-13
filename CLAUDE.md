@AGENTS.md

# Torch EDC.wiki — Project Overview

Flashlight database web app. Live at **https://torch.edc.wiki**.

**Licensing (layered):** code → MIT (`LICENSE`); original content & data compilation → CC BY 4.0 (`LICENSE-CONTENT.md`, incl. sui generis database right); factual specs → not copyrightable; product images → property of their manufacturers, non-commercial reference use only, **never CC-licensed**, notice-and-takedown. Keep the "non-commercial reference project, not affiliated with any brand" framing (it's the fair-use shield for brand images). Footer (in `FilterPanel.tsx`) and README carry the dual CC BY 4.0 / MIT notice.

## Tech Stack

- **Next.js 16.2.6** — App Router, Turbopack, TypeScript
- **Tailwind CSS v4** — custom `brand-*` color scale (`#eba00b`) defined in `app/globals.css` via `@theme`
- **Supabase** — PostgreSQL database (region: **us-east-1, North Virginia** — same region as Vercel iad1). Anon key for reads, service role key for writes in scripts.
- **Vercel Blob** — image storage with global CDN
- **Vercel** — hosting, Analytics, Speed Insights. Function region: `iad1` (US East, set in `vercel.json`)
- **Supabase Auth** — email/password + TOTP 2FA
- **Cloudflare Turnstile** — captcha on signup, forgot password, and contribution forms

## Environment Variables

In `.env.local` (never commit this file — no real values here):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
BLOB_READ_WRITE_TOKEN=...
BLOB_STORE_ID=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_ADMIN_EMAIL=...
REVALIDATE_SECRET=...   # shared secret for /api/revalidate from scripts/curl (any long random string)
```

**After `vercel env pull`:** re-add Supabase keys manually — Vercel pull only restores Blob + OIDC tokens.

## Database Schema (Supabase)

Key tables:
- `flashlights` — main product table. RLS disabled (public read). Key columns:
  - specs: `max_lumens`, `min_lumens`, `beam_distance_m`, `beam_type`, `emitter` (legacy text), `emitters` (text[]), `battery_type` (legacy text), `battery_count` (legacy int), `battery_types` (text[]), `battery_options` (jsonb `[{type,count}]`), `charging_type`, `has_usb_charging`, `length_mm`, `head_diameter_mm`, `body_diameter_mm`, `weight_g`, `material`, `ip_rating`, `impact_resistance_m`, `category`, `price_usd`, `year`
  - content: `image_url` (Vercel Blob URL), `slug`, `notes`, `manual_url` (legacy), `manual_urls` (text[]), `description`, `is_discontinued`
  - ordering: `sort_seed` (double precision, default `random()`) — backs the **Random** browse sort (the default). Reshuffled nightly by a pg_cron job `reshuffle-flashlights` (`0 17 * * *` UTC = midnight Vietnam) so the order rotates daily. Browse orders by `sort_seed` then `id` (tie-break).
  - attribution: `updated_by` (uuid → auth.users) = the admin/mod who approved; `submitted_by` (uuid → profiles) = the original contributor. Both set on approval in `/api/admin/submissions`.
- `flashlight_images` — extra images per flashlight (`url`, `sort_order`)
- `reviews` — review links per flashlight (`title`, `reviewer`, `url`, `type`, `summary`, `published_at`). Editable in the contribute/edit form: paste a URL → `/api/fetch-review-meta` (server-side, auth-gated, SSRF-guarded) fetches the og/JSON-LD `title` + published date, prefilled and editable. Multiple links per light. Stored as `_reviews` in the submission `data` and applied **replace-all** on approval (the edit form always loads existing reviews first, so nothing is lost). Detail page renders Reviews **below** the User manual, newest first (icon + title + date + link).
- `user_wishlists` — `(user_id, flashlight_id)` — RLS: user sees own rows only
- `user_collections` — `(user_id, flashlight_id, purchase_price, material, color, purchase_date, quantity)` — RLS: user sees own rows only
- `profiles` — `(id, nickname, is_admin, is_moderator, show_collection, updated_at)` — RLS: public SELECT, owner INSERT/UPDATE. Nickname: letters/numbers/`-`/`_` only, 3–30 chars, unique, **permanent once set**. Real-time availability check (debounced 500ms) on the input. `is_admin` / `is_moderator` control access — set via SQL. `show_collection` (bool, default false): when on, the user's collection appears on their public `/u/[nickname]` page (flashlight + quantity only — never price/date); toggled in My Account → Profile.
- `settings` — `(key, value)` — site-wide config. Keys: `ga_measurement_id`, `ga_enabled`. **RLS: public SELECT, admin-only write** (AdminDashboard writes with the admin's session via the anon client; the policy enforces `profiles.is_admin`). Service role (API routes) bypasses RLS.
- `brands` — `(name pk, country, made_in, founded_year, headquarters, website, about, logo_url, created_at, updated_by, updated_at)` — per-brand metadata (brand's origin country + where products are made). `updated_by`/`updated_at` drive the "Added by / Updated by" footer on brand pages (same logic as flashlights: updated_by null = system). RLS: public SELECT. `name` must match `flashlights.brand` exactly. Detail page looks it up by brand name and shows "Brand Origin" / "Made In". Also powers the **"Made in" browse filter** — BrowsePage loads `brands(name, made_in)` into the meta cache and resolves a selected country to the matching brand names (`.in('brand', …)`, since `made_in` isn't a flashlights column). Managed centrally (SQL/script), not via the contribute form.
- `flashlight_submissions` — user-submitted new flashlights or edits. `type` (new|edit), `status` (pending|approved|rejected), `target_id` (flashlight being edited), `data` (jsonb), `user_id`
- `submission_images` — images attached to a submission (`url`, `sort_order`, `is_primary`)
- `recovery_codes` — hashed 2FA recovery codes per user (`code_hash`, `used_at`)

**Migration — `profiles.show_collection`** (run once if missing; DDL must be run in the Supabase SQL editor — the REST/service key can't run ALTER):
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_collection boolean NOT NULL DEFAULT false;
```

**Migration — `brands` table** (run once in Supabase SQL editor):
```sql
CREATE TABLE IF NOT EXISTS brands (
  name text PRIMARY KEY,
  country text,
  made_in text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read brands" ON brands;
CREATE POLICY "public read brands" ON brands FOR SELECT USING (true);

INSERT INTO brands (name, country, made_in) VALUES
  ('Acebeam', 'China', 'China'),
  ('Imalent', 'China', 'China'),
  ('Weltool', 'China', 'China'),
  ('Malkoff', 'USA', 'USA'),
  ('SureFire', 'USA', 'USA'),
  ('LED Lenser', 'Germany', 'China')
ON CONFLICT (name) DO UPDATE SET country = EXCLUDED.country, made_in = EXCLUDED.made_in;
```

**Migration — brand attribution + review post-date** (run once in Supabase SQL editor):
```sql
ALTER TABLE brands  ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE brands  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS published_at timestamptz;
```

**Migration — contributor attribution** (run once in Supabase SQL editor):
```sql
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id);
```

**Migration — random browse sort + nightly reshuffle** (run once in Supabase SQL editor; needs the `pg_cron` extension enabled in Dashboard → Database → Extensions):
```sql
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS sort_seed double precision DEFAULT random();
UPDATE flashlights SET sort_seed = random() WHERE sort_seed IS NULL;
CREATE INDEX IF NOT EXISTS idx_flashlights_sort_seed ON flashlights (sort_seed);
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('reshuffle-flashlights', '0 17 * * *', $$update flashlights set sort_seed = random()$$);
```

**Migration — lock down `settings` writes (RLS)** (run once in Supabase SQL editor):
```sql
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings read" ON settings;
CREATE POLICY "settings read" ON settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "settings admin write" ON settings;
CREATE POLICY "settings admin write" ON settings FOR ALL
  USING      (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
```

**Note on emitters:** `emitter` (text) is legacy. `emitters` (text[]) is canonical — always use for filtering and display.

**Note on batteries:** `battery_type`/`battery_count` (single value) are legacy. Canonical is `battery_options` (jsonb array of `{type, count}` — supports lights that take alternatives, e.g. `2× 18350` OR `1× 18650`) plus `battery_types` (text[], the distinct sizes, used by the `.overlaps()` filter). Forms write all four (legacy fields mirror `battery_options[0]`). Display via `formatBatteries()` in `lib/battery.ts` (joins alternatives with ` / `; pass `withCount: false` for compact card display). Migration (run once in Supabase SQL editor — REST can't run ALTER):
```sql
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS battery_options jsonb DEFAULT '[]';
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS battery_types text[] DEFAULT '{}';
UPDATE flashlights
SET battery_options = jsonb_build_array(jsonb_build_object('type', battery_type, 'count', COALESCE(battery_count, 1))),
    battery_types   = ARRAY[battery_type]
WHERE battery_type IS NOT NULL AND (battery_options IS NULL OR battery_options = '[]');
```

**Emitter naming convention** (so duplicates don't fragment the `get_distinct_emitters` filter list):
- Brand name in **proper case**, never ALL-CAPS: `Cree` (not CREE), `Luxeon` (not LUXEON), `Luminus`, `Nichia`, `Osram`. Always include the brand prefix (`Luminus SST-36R`, not bare `SST-36R`).
- Cree **XHP** series gets a hyphen: `Cree XHP-70.2`, `Cree XHP-70.3 HI`, `Cree XHP-50.3 HI`. XP-series already hyphenated: `Cree XP-L`, `Cree XP-LR`.
- Luminus series hyphenated: `Luminus SFT-90X`, `Luminus SST-20`, `Luminus SBT-90.3`.
- LEP / laser lights use emitter `LEP`.
- To normalize after a bad import, extend the `EMITTER_MAP` in `scripts/normalize-emitters.mjs` and re-run, then force-clear cache.

**Database indexes** (run once if missing):
```sql
create index if not exists idx_flashlights_brand on flashlights(brand);
create index if not exists idx_flashlights_category on flashlights(category);
create index if not exists idx_flashlights_battery_type on flashlights(battery_type);
create index if not exists idx_flashlights_charging_type on flashlights(charging_type);
create index if not exists idx_flashlights_max_lumens on flashlights(max_lumens);
create index if not exists idx_flashlights_price_usd on flashlights(price_usd);
create index if not exists idx_flashlights_beam_distance on flashlights(beam_distance_m);
create index if not exists idx_flashlights_weight on flashlights(weight_g);
```

**RPC functions** (run once if missing):
```sql
CREATE OR REPLACE FUNCTION get_distinct_emitters()
RETURNS TABLE(emitter text) LANGUAGE SQL AS $$
  SELECT DISTINCT unnest(emitters) AS emitter FROM flashlights WHERE cardinality(emitters) > 0 ORDER BY emitter;
$$;

CREATE OR REPLACE FUNCTION get_distinct_brands()
RETURNS TABLE(brand text) LANGUAGE SQL AS $$
  SELECT DISTINCT brand FROM flashlights WHERE brand IS NOT NULL ORDER BY brand;
$$;
```

## Auth Flow

- Sign in / Sign up via `AuthModal` (email + password)
- **Login rate limiting** — 5 failed attempts → locked 10 minutes (localStorage)
- Forgot password → `supabase.auth.resetPasswordForEmail()` → email link → `/reset-password`
- **2FA (TOTP)** — enroll via `/account` → Security tab → QR code → 10 recovery codes (SHA-256 hashed in `recovery_codes` table)
- Login with 2FA → AuthModal shows TOTP step; "lost authenticator" → recovery code → calls `/api/recover-account` (admin API deletes factor)
- Change password → `/account` → Security tab (re-authenticates with current password first)
- **Email change** → `/account` → Profile tab → sends verification link to new address; change only takes effect after confirmation
- Nickname is **permanent** once saved — field becomes read-only, no edit allowed
- Captcha (Cloudflare Turnstile) on signup, forgot password, contribution forms

## User Icon (Header)

- Logged out → `User` icon, white
- Logged in → `User` icon, brand amber (`#eba00b`)
- Dropdown shows nickname (if set) or email, plus: My Lists / Contribute / My Account / Sign out

## User Profiles (`/u/[username]`)

- Public page, `force-dynamic`
- Fetches profile by nickname via anon client (RLS: public SELECT on profiles)
- Fetches approved submissions via **service role** (bypasses RLS on `flashlight_submissions`)
- Shows: flashlights added (type=new), edit contributions (type=edit, deduplicated by flashlight)
- Submission images looked up from `flashlights` table by slug for thumbnails

## Contribution System (`/contribute`)

Three tabs:
1. **Add flashlight** — full spec form + image upload → pending queue
2. **Edit existing** — search + pick flashlight → pre-filled form → pending queue
3. **My submissions** — list of user's past submissions with status

- Requires account + **nickname** (blocked if no nickname set)
- Captcha verification server-side before DB insert
- Images uploaded to Vercel Blob at `submissions/{submission_id}/{uuid}.{ext}`
- "Suggest an edit" link on each flashlight detail page → `/contribute?suggest={id}`

## Admin (`/admin`)

- Access decided by `profiles.is_admin` / `profiles.is_moderator`. The bootstrap `NEXT_PUBLIC_ADMIN_EMAIL` match is enforced **server-side only** (API routes via `getAdminUser`); the `/admin` page + `useIsAdmin` use the profiles flags so the admin email never ships in client JS. (Owner account already has `is_admin = true`.)
- **2FA required** — blocks access until TOTP factor enrolled
- Sections: **Submissions** | **Reports** | **Users** | **Settings** (users + settings: admin only)
- Submissions fetched via `/api/admin/submissions` (service role — bypasses RLS, sees all users' submissions)
- Approve/Reject via PATCH `/api/admin/submissions` — server-side: validates action, looks up user_id from DB (not client), moves PDFs, handles image removals (`_removeExtraDbIds`, `_primaryImageUrl` directives stored in submission data), returns slug for revalidation
- PDF move on approval: `submissions/manuals/{uuid}.pdf` → `flashlights/{slug}/manual.pdf` (or `manual-1.pdf`, etc.) using Vercel Blob `copy()` + `del()`
- Reject → saves reviewer note shown to the submitter

**Inline edit (admin/mod only):** On each flashlight detail page, admins/mods see an "Edit" button (users see "Suggest an edit"). Both go to `/contribute?suggest={id}`. For admin/mod, the form auto-approves on submit (calls PATCH immediately, redirects to flashlight page). For users, submission goes into pending queue.

**Image management in edit form:** Existing images loaded from `flashlight_images` table. On submit, image changes are stored as `_primaryImageUrl` and `_removeExtraDbIds` directives in the submission `data` JSONB. These are applied by the approval handler for both admin auto-approve and mod review.

**Note on `manual_urls` DB column:** requires SQL migration:
```sql
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS manual_urls text[] DEFAULT '{}';
UPDATE flashlights SET manual_urls = ARRAY[manual_url] WHERE manual_url IS NOT NULL AND (manual_urls IS NULL OR manual_urls = '{}');
```

## Security

- **Admin auth helper** — `lib/verify-admin.ts` → `getAdminUser(request)` authenticates the bearer token and returns `{ id, email, isAdmin, isModerator }`. Each route applies its own level: **content** routes (`brand`, `brand-submissions`, `flashlight`, `submissions`, `revalidate`) accept `isAdmin || isModerator`; **role-management** routes (`users`, `set-role`, `list-moderators`) require `isAdmin`. The bootstrap admin email is checked **inside the helper, server-side only** — it is no longer read by client code, so it never ships in the client bundle (`app/admin/page.tsx` + `lib/use-is-admin.ts` rely on `profiles` flags). `list-admins` (cookie/session auth) and `upload-image` (clientPayload token) keep their own auth on purpose.
- **`/api/upload`** — does not mint Vercel Blob tokens for anyone. `onBeforeGenerateToken` requires a `clientPayload` JSON of `{ session }` (a Supabase access token, validated via `getUser`) **or** `{ turnstile }` (verified via Turnstile siteverify). Callers: MarkdownEditor + SubmitFlashlightForm send the session token; the report page sends the session token when logged in, else the Turnstile token (anonymous attachments). The report page only runs the standalone captcha-verify when there's **no** attachment (the upload consumes the single-use token otherwise).
- **`/api/upload-manual`** — admin/mod only; validates the slug shape (path-traversal) and checks the real `%PDF-` magic bytes (not just the declared Content-Type).
- **`/api/fetch-review-meta`** — SSRF-guarded: follows redirects manually and re-validates each hop's host; blocklist covers IPv4 private/loopback/link-local + CGNAT 100.64/10, IPv6 ULA/link-local/mapped, `.lan`/`.internal`, and the cloud-metadata host.
- **`/api/recover-account`** — protect against recovery-code brute-force with a Vercel Firewall rate-limit rule (edge); an AAL1 (password-only) session could otherwise brute the codes to drop 2FA.
- **Security headers** — `next.config.ts` `headers()` sets HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy` on every response (no CSP — would need to allow Supabase/Blob/GA/Turnstile/video embeds).
- **JSON-LD** — `safeJson()` escapes `<` in `app/layout.tsx` and `app/[slug]/page.tsx`.
- **Recommended (Vercel dashboard)** — Firewall → Custom Rules: rate-limit `/api/upload`, `/api/recover-account`, `/api/fetch-review-meta`, `/api/admin/`, `/api/revalidate`. Keep **AI Bots = Off** (we want crawlers + `llms.txt`). The WAF OWASP managed ruleset is Enterprise-only.

## Image Optimization & Cost

- All product images are optimized by Vercel's image optimizer (`/_next/image`). Billed per **transformation** (a unique image×size×format), cached for `minimumCacheTTL = 1 year`. Free/Hobby has a quota — exceeding it returns **HTTP 402** and images break site-wide (this happened; fixed by upgrading to Pro).
- `next.config.ts` trims variants to keep transformations low: `deviceSizes: [640, 828, 1080, 1920]`, `imageSizes: [128, 384]` (≈6 variants/image instead of up to 16), matched to the actual card/hero/thumbnail layouts. `remotePatterns` restricted to Blob + `cdn.shopify.com`.
- Blob URLs are immutable (random suffix) → safe to cache "forever"; changing an image yields a new URL.
- **LCP — browse card images (`FlashlightCard`):** the **default sort is random**, so which card becomes the LCP element changes every load — you can't reliably mark "the" LCP image. Two rules cover the whole initial viewport instead:
  - **No JS opacity fade.** The old `.img-load { opacity:0 } → .is-loaded` (flipped on `onLoad`) kept the image invisible until React hydrated → ~1.2s of LCP "render delay". `FlashlightCard` no longer applies `img-load`; images paint as soon as they decode. (The `.img-load` CSS lives on, still used by `app/[slug]/ImageGallery.tsx`.)
  - **Eager near-fold, lazy beyond.** `BrowseGrid` passes `priority={i < 4}` (Next preload + explicit `fetchPriority="high"` — this build does **not** derive fetchpriority from `priority`, so set it by hand; it also lands on the preload `<link>`) and `eager={i < 12}` → `loading="eager"` so cards 4–11 fetch immediately too. Without this a lazy LCP image waited on layout (~1.4s resource-load delay). Cards 12+ stay `loading="lazy"`.
- **Browse JS (perf):** card detail/brand `<Link>`s use **`prefetch={false}`** — a 32+ card grid was eagerly prefetching every SSG detail route, pulling the react-markdown chunk (~44KB, unused on browse) + 32 RSC requests into the initial load. Detail pages are edge SSG so click-through stays fast. `package.json` sets a modern **`browserslist`** (safari≥15.4 etc.), but note the ~14KB "legacy JavaScript" Lighthouse still flags is **core-js bundled inside a dependency** — Next doesn't re-transpile `node_modules`, so browserslist can't strip it (would need `transpilePackages`; not worth it). JS is Brotli-compressed at the edge automatically — no manual compression. Don't re-introduce `@vercel/speed-insights` (removed — billed, was disabled in dashboard); `@vercel/analytics` is kept on purpose.

## Image Workflow

**All images on Vercel Blob.**

Blob path format: `flashlights/{slug}/primary.{ext}`

```bash
# 1. Insert data to DB (SQL or seed script)
# 2. Migrate images from external URLs → Vercel Blob
node scripts/migrate-to-vercel-blob.mjs
```

Script skips images already on Vercel Blob — safe to re-run anytime.

**CDN hotlink protection:** some brands (e.g. Weltool) require a `Referer` header. The migrate script handles this via `refererMap` — add new entries there if a brand's CDN blocks downloads.

### Scripts reference

| Script | Purpose |
|---|---|
| `scripts/migrate-to-vercel-blob.mjs` | Download images from any URL → upload to Vercel Blob → update DB |
| `scripts/seed-ledlenser.mjs` | Scrape LED Lenser Shopify API → insert |
| `scripts/seed-acebeam-edc.mjs` · `seed-acebeam-tactical.mjs` · `seed-acebeam-more.mjs` | Acebeam EDC / tactical / headlamp+high-power+LEP+diving seeds |
| `scripts/seed-prometheus.mjs` · `scripts/seed-foursevens.mjs` | Prometheus (6) / Foursevens (7) seeds — combined pattern: re-host product images from darksucks.com (Shopify `/products/<handle>.json`) onto Vercel Blob in the same run |
| `scripts/seed-nextorch.mjs` (+ `scripts/nextorch-data.json`) | Nextorch (72) seed — scraped from Shopify `collections/<h>/products.json`, normalized into a committed `nextorch-data.json`, then images re-hosted to Blob in the same upsert. NEXDOT kept under the Nextorch brand (model prefixed). Scratch dump under `scripts/.nextorch-raw/` is gitignored. |
| `scripts/normalize-emitters.mjs` | Normalize emitter names DB-wide (see emitter naming convention above) |

**Seeding convention:** Always set `image_url` in the **same upsert** as the row data, then migrate the blob in the same script (see `seed-acebeam-tactical.mjs` / `seed-acebeam-more.mjs` for the combined pattern). Do NOT insert rows first and add images in a second pass — detail pages are SSG with `revalidate = false`, so a page rendered during the null-image window freezes with "No image" (the browse grid still shows it because it fetches client-side). After any direct DB seed/edit, force-clear cache: `curl -X POST https://torch.edc.wiki/api/revalidate -H 'Content-Type: application/json' -H "x-revalidate-secret: $REVALIDATE_SECRET" -d '{"force":true}'`. (The route now requires either this secret header or an admin/mod bearer token — see Security below. The admin "Force clear cache" button uses the session token automatically.)

## Key Components & Pages

| File | Purpose |
|---|---|
| `lib/auth-context.tsx` | Auth context — user, nickname, wishlistIds, collectionIds, toggle methods |
| `lib/supabase-admin.ts` | `getSupabaseAdmin()` — service role client, lazy init (runtime only) |
| `lib/types.ts` | TypeScript types for all DB tables |
| `components/AuthModal.tsx` | Sign in / Sign up / Forgot / MFA challenge / Recovery code |
| `components/UserMenu.tsx` | User icon in header — dropdown menu |
| `components/Header.tsx` | Shared sticky header — logo, nav, UserMenu. **Note:** the browse page does NOT use this — it has its own header `components/browse/BrowseHeader.tsx` (with an integrated search box). Header style/nav changes must be made in BOTH places to stay in sync. |
| `components/BrowsePage.tsx` | Main browse page — owns filter/sort state + infinite-scroll observer. **Seeded by the server** via optional `initialItems`/`initialCount`/`initialMeta` props (see Caching → Browse first-paint); skips the first client fetch when seeded. Page size: **mobile 16, desktop 32** (`PAGE_SIZE_MOBILE/DESKTOP`, chosen once from viewport at mount). Default sort = **random** (`sort_seed`). Split into `components/browse/{BrowseHeader, BrowseGrid, CompareBar}` (presentational; the sentinel ref is forwarded to BrowseGrid so fetch/scroll logic stays in the parent). |
| `lib/browse.ts` | Shared browse query layer used by **both** `app/page.tsx` (server) and `BrowsePage` (client): `DEFAULT_FILTERS`, `PAGE_SIZE_*`, `BROWSE_COLS` (card-only column list), `buildQuery()` (`count: 'estimated'`), `madeInBrandNames()`, `fetchBrowseMeta()`. Single source of truth so the server-seeded first page and client refetches stay identical. |
| `components/Providers.tsx` | Global `AuthProvider` + auth-modal portal. `AuthModal` is **`next/dynamic` (`ssr: false`)** — its Turnstile dependency only loads when the user opens sign-in, keeping it out of the first-paint bundle. |
| `components/browse/BrowseHeader.tsx` · `BrowseGrid.tsx` · `CompareBar.tsx` | Extracted browse pieces — floating header+search, results grid, bottom compare bar |
| `components/FilterPanel.tsx` | Sidebar filters — incl. the Sort by select (`SORT_OPTIONS`, default `random`) |
| `components/FlashlightCard.tsx` | Grid card with compare + wishlist/collection buttons. `memo`-wrapped; takes `isSelected: boolean` (not the compareIds array) so only the toggled card re-renders. |
| `components/ErrorState.tsx` | Shared on-brand error UI used by `app/error.tsx` + `app/[slug]/error.tsx` error boundaries |
| `lib/verify-admin.ts` | `getAdminUser(request)` — shared bearer-token admin/mod auth for API routes (see Security) |
| `components/SubmitFlashlightForm.tsx` | Full spec form — image/PDF management, Markdown description, Turnstile captcha (skipped for admin), admin auto-approve |
| `components/MarkdownContent.tsx` | Renders Markdown with Tailwind styles — used in flashlight detail and form preview |
| `components/SuggestEditButton.tsx` | Smart "Suggest an edit" / "Edit" link — shows "Edit" for admin/mod, "Suggest an edit" for users |
| `lib/use-is-admin.ts` | `useIsAdmin()` hook — checks `profiles.is_admin/is_moderator` client-side |
| `app/[slug]/page.tsx` | Flashlight detail page — gallery, specs, reviews, manual, attribution timeline |
| `app/[slug]/ImageGallery.tsx` | Image gallery — white main area, warm thumbnails, amber active border |
| `app/u/[username]/page.tsx` | Public user profile — shows approved contributions (added + edits), uses service role to bypass RLS |
| `app/top/page.tsx` | Top Lists page — recently added, newest, most expensive, best value |
| `app/api/ping/route.ts` | Health check endpoint — called daily by Vercel Cron to keep Supabase alive |
| `app/api/admin/submissions/route.ts` | GET (list by status, service role bypass RLS) + PATCH (approve/reject, move PDFs, apply image directives, replace `_reviews`, **regenerate slug from edited brand+model** with collision guard + revalidate old URL, validate action) |
| `app/api/admin/flashlight/route.ts` | PATCH — direct flashlight update (used by admin auto-approve path) |
| `app/api/admin/upload-image/route.ts` | Admin image upload handler — auth via clientPayload bearer token |
| `app/api/upload-pdf/route.ts` | Client upload handler for PDFs in contribute form — auth via clientPayload bearer token |
| `app/api/upload-manual/route.ts` | Direct **admin/mod-only** PDF upload — stores to `flashlights/{slug}/manual.pdf`; validates slug + `%PDF-` magic bytes |
| `lib/cdn.ts` | `cdnUrl()` — rewrites Vercel Blob PDF URLs to Cloudflare CDN proxy domain |
| `lib/seo.ts` | `SITE_URL`, `SITE_NAME`, `OG_IMAGE` — single source of truth for canonical origin + default share image (`public/og-default.jpg`, 1200×630) |
| `app/api/fetch-review-meta/route.ts` | POST `{url}` (auth-gated, SSRF-guarded) → og/JSON-LD title + published date; uses YouTube/Vimeo **oEmbed** first (reliable title), HTML fallback for the date |
| `app/llms.txt/route.ts` | `/llms.txt` (llmstxt.org) — site overview + brand list for AI crawlers, hourly revalidate |
| `app/robots.ts` | robots.txt — explicit allow for AI bots (GPTBot, ClaudeBot…), disallow `/admin /api/ /my /account /reset-password /change-password` |
| `components/FlashlightCardSkeleton.tsx` | Shimmer skeleton card shown while browse page loads |
| `components/PageFade.tsx` | Wraps page content with fade-in animation on navigation |
| `scripts/seed-ledlenser.mjs` | Scrapes ledlenserusa.com Shopify API → inserts flashlights/headlamps/area lights |
| `app/my/page.tsx` | My Lists — wishlist + collection |
| `app/account/page.tsx` | My Account — profile (email change, nickname), security (password, 2FA) |
| `app/contribute/page.tsx` | Contribute — add/edit flashlights, submission history |
| `app/admin/page.tsx` + `AdminDashboard.tsx` | Admin review queue + reports + settings |
| `app/compare/page.tsx` | Side-by-side spec comparison (up to 4) |
| `app/updates/page.tsx` | Static changelog |
| `app/api/captcha-verify/route.ts` | Verifies Cloudflare Turnstile token |
| `app/api/recover-account/route.ts` | Verifies recovery code hash → unenrolls TOTP via admin API |
| `app/api/upload/route.ts` | Vercel Blob client upload handler — gated by `clientPayload` `{ session }` (Supabase token) or `{ turnstile }` (see Security) |
| `app/api/revalidate/route.ts` | On-demand cache invalidation — called by admin on approval or force-clear |
| `app/api/ga-settings/route.ts` | Returns GA `{ enabled, id }` from `settings` table. **Edge-cached** via `Cache-Control: s-maxage=300` (global value, rarely changes) — without `s-maxage` only the browser cached and every fresh visit invoked this function cold (~800ms, was the slowest request on the page). |
| `app/sitemap.ts` | Auto-generated `/sitemap.xml` — all flashlight slugs + static pages (1hr revalidate) |
| `app/robots.ts` | `/robots.txt` — allow all crawlers, block `/admin` and `/api/` |
| `components/GoogleAnalytics.tsx` | Loads GA script client-side if enabled; skipped for admin users **and until cookie consent === 'accepted'** (so `_ga` is never set without consent). Reads settings via `useGaSettings()` |
| `components/CookieConsent.tsx` | Small bottom-left consent banner, links to `/privacy`; writes the choice and gates GA. **Hidden entirely unless GA is configured** (`gaActive` — Measurement ID set + enabled) and never shown to admins, so with no GA the site is cookieless and needs no banner |
| `lib/use-ga-settings.ts` | `useGaSettings()` hook + `gaActive(s)` — shared, module-cached fetch of `/api/ga-settings` (one request for GoogleAnalytics + CookieConsent) |
| `components/ThemeToggle.tsx` | 4-state theme switcher (Dark/Light/System/Auto). Writes `localStorage['theme-mode']`, sets `<html data-theme>`. See **Theming** section |
| `lib/analytics.ts` | `trackEvent()` wrapper + `AnalyticsEvent` names for Vercel Analytics custom events / conversion goals (Signup, Collection/Wishlist Add, Contribution New/Edit). Contribution events fire only on the non-admin submit path |
| `lib/use-consent.ts` | `useConsent()` (SSR-safe via `useSyncExternalStore`) + `getConsent`/`setConsent`; localStorage key `torch-cookie-consent`, syncs same-tab via custom event and cross-tab via storage event |
| `app/privacy/page.tsx` | `/privacy` — Privacy & Cookies page (essential vs analytics cookies, cookieless Vercel Analytics, account data, images, notice-and-takedown) |
| `app/[slug]/page.tsx` | Flashlight detail — `generateMetadata` (dynamic title/description/OG), JSON-LD Product schema |

## Caching Strategy

| Page type | Cache | Cleared by |
|---|---|---|
| `/[slug]` flashlight pages | Static (SSG) — served from Vercel edge | Deploy · Admin approves submission · Force clear button |
| `/` browse page | **ISR `revalidate = 3600`** — server renders the first 32 cards + filter meta next to the DB (iad1), ships them in the HTML; client takes over for filter/scroll | Deploy · hourly revalidate |
| `/my` `/account` `/contribute` `/compare` `/report` | `force-dynamic` — never cached | Always fresh |
| Brand/emitter filter lists | Server-seeded on first load (ISR 1h); localStorage 5 min TTL on client navigation | Auto-expire · Admin approve/force-clear clears immediately |

**Vercel Cron:** `vercel.json` schedules `/api/ping` daily at 08:00 UTC — queries DB to prevent Supabase free tier from pausing.

**On-demand revalidation flow:**
- Admin approves an **edit** → `revalidatePath('/slug')` clears that one page instantly
- Admin approves a **new** flashlight → `revalidatePath('/', 'layout')` clears browse
- Admin edits DB directly (Supabase Table Editor) → use **"Force clear cache"** button in `/admin` to clear all flashlight pages at once
- Every **deploy** → Vercel rebuilds all static pages automatically

**Browse first-paint (perf):** `app/page.tsx` is an async Server Component (`revalidate = 3600`) that runs `buildQuery(DEFAULT_FILTERS, …)` + `fetchBrowseMeta()` from `lib/browse.ts` at iad1 (same region as Supabase, sub-ms) and passes `initialItems`/`initialCount`/`initialMeta` into `BrowsePage`. The client seeds its state from those props and **skips the first fetch** (`skipNextFetch` ref) — no client round-trip to the DB on first load (was the root cause of the slow FCP when testing from far away). Browse queries select only `BROWSE_COLS` (the columns the card renders), never `select('*')` — ~⅓ the old payload. Counts use `count: 'estimated'` (exact for this small table, no full scan). Infinite-scroll `loadMore` offsets by `items.length` (not `page × size`) so a server-seeded 32 + a client `pageSize` of 16 never overlap. `brands`/`emitters` lists fall back to **localStorage (5 min)** only on client navigation.

## Flashlight Detail Page

Sections in order:
1. Image gallery (white bg, `rounded-2xl`, warm thumbnails)
2. Hero: category badge (gray), brand, model, discontinued tag, price, wishlist, "Edit"/"Suggest an edit"
3. Description — Markdown rendered, hairline top border separator
4. Specifications — flat table, hairline row borders, `font-mono` values, no zebra
5. Reviews — hairline-separated list
6. User Manual — hairline-separated PDF links
7. Attribution timeline — newest event on top, bullet "–" prefix, links to `/u/[nickname]`

**Attribution logic:**
- `updated_by != null && updated_at == created_at` → "Added by [user]" (user submitted new flashlight)
- `updated_by == null` → "Added by system"
- `updated_by != null && updated_at != created_at` → also show "Updated by [user]" above

**Notes field (`flashlight.notes`):** still exists in DB but no longer displayed or editable. Preserved for backward compat.

## Filter Options

**Categories:** EDC, Tactical, Weapon Light, Thrower, Flood, Headlamp, Search & Rescue, Diving, Work, Custom

**Battery types:** CR123A, D-cell, AA, AAA, 10440, 14500, 16340, 16650, 18350, 18650, 21700, 26650, Built-in

(Note: `16340` = RCR123 rechargeable Li-ion — use for lights with USB-C charging in a CR123-size cell, e.g. Acebeam W20/E10/G10. Reserve `CR123A` for lights that take non-rechargeable primaries, e.g. SureFire/Malkoff. Both `CATEGORIES` and `BATTERY_TYPES` are hardcoded in `components/FilterPanel.tsx` — adding a value there is a code change that needs a deploy to show on prod.)

**Charging:** Any / USB / Magnetic / None

**Lumens buckets** (range min–max on `max_lumens`; sentinel max 50000): `<100`, `100–300`, `300–600`, `600–1000`, `1K–2K`, `2K–5K`, `5K–10K`, `>10K`, Any. Single-select; a bucket sets `minLumens`+`maxLumens` (query: `gte`/`lte` on `max_lumens`).

**Price buckets** (range min–max on `price_usd`; sentinel max 99999): `<$50`, `$50–100`, `$100–200`, `$200–300`, `$300–500`, `$500+`, `$1K+`, `$2K+`, `$3K+`, Any. Single-select; sets `minPrice`+`maxPrice`. The `+` buckets have no upper bound (max = sentinel).

(Both rendered by the shared `RangeButtons` group in `components/FilterPanel.tsx`; buckets are defined in `LUMEN_BUCKETS` / `PRICE_BUCKETS` there.)

**Sort by** (`SORT_OPTIONS` in `FilterPanel.tsx`): **Random** (default), Model A–Z, Lumens (High–Low / Low–High), Price (Low–High / High–Low), Beam Distance (Far–Near), Weight (Light–Heavy). Random orders by `flashlights.sort_seed` (+ `id` tie-break) and reshuffles nightly via pg_cron — see the schema note.

## Color System

Brand color `#eba00b` (refined amber) defined as `brand-*` scale in `app/globals.css`:
- `brand-500` → primary accents, active filter buttons, active wishlist/collection, logo
- `brand-100` / `brand-50` → light backgrounds (rare)
- **Never use `amber-*`** — always use `brand-*`

Page surface: `#f6f6f3` (warm off-white) — defined via `--color-gray-100` override in `@theme`, and as body background. All pages use `bg-gray-100` which resolves to this.

Card borders: `#e7e7e1` (warm light gray). Hover border: `#c8c8c0`. Use these instead of `border-slate-200`.

No box-shadows anywhere. Hover = border darkens only.

**Inter** is the single site-wide typeface — a self-hosted variable font (`app/fonts/inter-variable.woff2`) loaded via `next/font/local` in `app/layout.tsx` as the `--font-inter` CSS variable (no Google Fonts / third-party request). The old SF stack + JetBrains Mono were dropped; `font-mono` is still used as a Tailwind class for numeric values (lumens, price, dimensions, spec table values), now resolving to Inter's tabular figures.

**Custom checkbox/radio CSS** in `globals.css` — classes `.cb` (checkbox) and `.rb` (radio). Flat, amber accent on check. Use instead of `accent-brand-500`.

## Theming — light/dark (added 2026-06-13)

Dark mode is a **token flip on `<html data-theme="light|dark">`**, not per-element overrides. Strategy:
- **Semantic color tokens** in `app/globals.css` `@theme` map Tailwind utilities to runtime CSS vars so they flip automatically: `text-ink`/`-2`/`-3`, `border-line`/`-strong`, `bg-surface`, `bg-plate` (product-image plate), `bg-panel` (cards/modals/inputs/white panels). `:root` holds the light values; `:root[data-theme="dark"]` overrides them (warm graphite `#17181b`, brighter amber `#f4a820`, `--card-plate` stays light `#e9e9e5`). Glass/body/pill/nav/checkbox/shimmer rules all read tokens.
- **`@custom-variant dark`** is bound to `data-theme` (NOT `prefers-color-scheme`), so `dark:` utilities follow the switcher.
- **`components/ThemeToggle.tsx`** (in both `Header` and `browse/BrowseHeader`) is the 4-state switcher (Dark/Light/System/Auto-by-time). It writes `localStorage['theme-mode']` and sets `data-theme`. **Default is light** until the user picks. An **inline FOUC script in `app/layout.tsx`** resolves the theme before first paint (`<html suppressHydrationWarning>`), plus two `<meta name=theme-color>` tags (light/dark) synced at runtime.
- **When writing new UI:** use the semantic tokens, never raw `bg-white`/`text-slate-*`/hard hexes. Product-image containers = `bg-plate` (so dark-bodied lights stay legible). Active tabs / dark buttons that were `bg-[#17171a] text-white` use `bg-ink text-surface` (inverts correctly per theme). White-alpha highlights on the dark nav (`bg-white/…`) are intentional and stay.
- **Nav-link/hover highlights are warm (~4000K, `#ffe8c8`)** not pure white; the floating-nav capsule is a graphite (light `--nav-bg rgba(31,33,38,.92)`, dark `rgba(37,39,44,.92)`).

## Material Options (CollectionEditModal)

`Aluminum, Raw Aluminum, 7075 Aluminum, Anodized Aluminum, Cerakote Aluminum, Copper, Brass, Bronze, Zirconium, Zircuti, Timascus, Damasteel, Damasteel Fenja, Other`

## Database Migration (future reference)

To migrate Supabase to a new region without losing users, use the CLI:
```bash
npm install -g supabase
supabase login          # needs access token from supabase.com/dashboard/account/tokens
supabase link --project-ref <old-project-ref>
supabase db dump --file backup.sql   # includes auth.users with password hashes
# create new project, then:
supabase link --project-ref <new-project-ref>
supabase db restore --file backup.sql
```
Users only need to sign in again (sessions expire), passwords are preserved.

**Do NOT use the JS API to migrate users** — the API does not expose password hashes.

## Deployment

Push to `main` → Vercel auto-deploys to `https://torch.edc.wiki`.

Git remote: `https://TOKEN@github.com/joiha-steven/torch-wiki.git`
(Replace TOKEN with a fresh GitHub Personal Access Token — never commit the token)

Git author:
```bash
git config user.name "Hung Tran"
git config user.email "hung.tran@joiha.com"
```
