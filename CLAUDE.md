@AGENTS.md

# Torch EDC.wiki — Project Overview

Flashlight database web app. Live at **https://torch.edc.wiki**.

## Tech Stack

- **Next.js 16.2.6** — App Router, Turbopack, TypeScript
- **Tailwind CSS v4** — custom `brand-*` color scale (`#FFBE00`) defined in `app/globals.css` via `@theme`
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
```

**After `vercel env pull`:** re-add Supabase keys manually — Vercel pull only restores Blob + OIDC tokens.

## Database Schema (Supabase)

Key tables:
- `flashlights` — main product table. RLS disabled (public read). Key columns:
  - specs: `max_lumens`, `min_lumens`, `beam_distance_m`, `beam_type`, `emitter` (legacy text), `emitters` (text[]), `battery_type` (legacy text), `battery_count` (legacy int), `battery_types` (text[]), `battery_options` (jsonb `[{type,count}]`), `charging_type`, `has_usb_charging`, `length_mm`, `head_diameter_mm`, `body_diameter_mm`, `weight_g`, `material`, `ip_rating`, `impact_resistance_m`, `category`, `price_usd`, `year`
  - content: `image_url` (Vercel Blob URL), `slug`, `notes`, `manual_url` (legacy), `manual_urls` (text[]), `description`, `is_discontinued`
  - attribution: `updated_by` (uuid → auth.users) — set when admin approves a user edit
- `flashlight_images` — extra images per flashlight (`url`, `sort_order`)
- `reviews` — review links per flashlight (`title`, `reviewer`, `url`, `type`, `summary`)
- `user_wishlists` — `(user_id, flashlight_id)` — RLS: user sees own rows only
- `user_collections` — `(user_id, flashlight_id, purchase_price, material, color, purchase_date, quantity)` — RLS: user sees own rows only
- `profiles` — `(id, nickname, is_admin, is_moderator, show_collection, updated_at)` — RLS: public SELECT, owner INSERT/UPDATE. Nickname: letters/numbers/`-`/`_` only, 3–30 chars, unique, **permanent once set**. Real-time availability check (debounced 500ms) on the input. `is_admin` / `is_moderator` control access — set via SQL. `show_collection` (bool, default false): when on, the user's collection appears on their public `/u/[nickname]` page (flashlight + quantity only — never price/date); toggled in My Account → Profile.
- `settings` — `(key, value)` — site-wide config. Keys: `ga_measurement_id`, `ga_enabled`. RLS disabled.
- `brands` — `(name pk, country, made_in)` — per-brand metadata (brand's origin country + where products are made). RLS: public SELECT. `name` must match `flashlights.brand` exactly. Detail page looks it up by brand name and shows "Brand Origin" / "Made In". Also powers the **"Made in" browse filter** — BrowsePage loads `brands(name, made_in)` into the meta cache and resolves a selected country to the matching brand names (`.in('brand', …)`, since `made_in` isn't a flashlights column). Managed centrally (SQL/script), not via the contribute form.
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
- Logged in → `User` icon, brand yellow (`#FFBE00`)
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

- Accessible when `profiles.is_admin = true` OR `profiles.is_moderator = true` OR email = `NEXT_PUBLIC_ADMIN_EMAIL`
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
| `scripts/normalize-emitters.mjs` | Normalize emitter names DB-wide (see emitter naming convention above) |

**Seeding convention:** Always set `image_url` in the **same upsert** as the row data, then migrate the blob in the same script (see `seed-acebeam-tactical.mjs` / `seed-acebeam-more.mjs` for the combined pattern). Do NOT insert rows first and add images in a second pass — detail pages are SSG with `revalidate = false`, so a page rendered during the null-image window freezes with "No image" (the browse grid still shows it because it fetches client-side). After any direct DB seed/edit, force-clear cache: `curl -X POST https://torch.edc.wiki/api/revalidate -H 'Content-Type: application/json' -d '{"force":true}'`.

## Key Components & Pages

| File | Purpose |
|---|---|
| `lib/auth-context.tsx` | Auth context — user, nickname, wishlistIds, collectionIds, toggle methods |
| `lib/supabase-admin.ts` | `getSupabaseAdmin()` — service role client, lazy init (runtime only) |
| `lib/types.ts` | TypeScript types for all DB tables |
| `components/AuthModal.tsx` | Sign in / Sign up / Forgot / MFA challenge / Recovery code |
| `components/UserMenu.tsx` | User icon in header — dropdown menu |
| `components/Header.tsx` | Shared sticky header — logo, nav, UserMenu |
| `components/BrowsePage.tsx` | Main browse page — server-side filter/sort, pagination 32/page |
| `components/FilterPanel.tsx` | Sidebar filters |
| `components/FlashlightCard.tsx` | Grid card with compare + wishlist/collection buttons |
| `components/SubmitFlashlightForm.tsx` | Full spec form — image/PDF management, Markdown description, Turnstile captcha (skipped for admin), admin auto-approve |
| `components/MarkdownContent.tsx` | Renders Markdown with Tailwind styles — used in flashlight detail and form preview |
| `components/SuggestEditButton.tsx` | Smart "Suggest an edit" / "Edit" link — shows "Edit" for admin/mod, "Suggest an edit" for users |
| `lib/use-is-admin.ts` | `useIsAdmin()` hook — checks `profiles.is_admin/is_moderator` client-side |
| `app/[slug]/page.tsx` | Flashlight detail page — gallery, specs, reviews, manual, attribution timeline |
| `app/[slug]/ImageGallery.tsx` | Image gallery — white main area, warm thumbnails, amber active border |
| `app/u/[username]/page.tsx` | Public user profile — shows approved contributions (added + edits), uses service role to bypass RLS |
| `app/top/page.tsx` | Top Lists page — recently added, newest, most expensive, best value |
| `app/api/ping/route.ts` | Health check endpoint — called daily by Vercel Cron to keep Supabase alive |
| `app/api/admin/submissions/route.ts` | GET (list by status, service role bypass RLS) + PATCH (approve/reject, move PDFs, apply image directives, validate action) |
| `app/api/admin/flashlight/route.ts` | PATCH — direct flashlight update (used by admin auto-approve path) |
| `app/api/admin/upload-image/route.ts` | Admin image upload handler — auth via clientPayload bearer token |
| `app/api/upload-pdf/route.ts` | Client upload handler for PDFs in contribute form — auth via clientPayload bearer token |
| `app/api/upload-manual/route.ts` | Direct admin PDF upload — stores to `flashlights/{slug}/manual.pdf` |
| `lib/cdn.ts` | `cdnUrl()` — rewrites Vercel Blob PDF URLs to Cloudflare CDN proxy domain |
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
| `app/api/upload/route.ts` | Vercel Blob client upload handler |
| `app/api/revalidate/route.ts` | On-demand cache invalidation — called by admin on approval or force-clear |
| `app/api/ga-settings/route.ts` | Returns GA `{ enabled, id }` from `settings` table (5 min cache) |
| `app/sitemap.ts` | Auto-generated `/sitemap.xml` — all flashlight slugs + static pages (1hr revalidate) |
| `app/robots.ts` | `/robots.txt` — allow all crawlers, block `/admin` and `/api/` |
| `components/GoogleAnalytics.tsx` | Loads GA script client-side if enabled; skipped for admin users |
| `app/[slug]/page.tsx` | Flashlight detail — `generateMetadata` (dynamic title/description/OG), JSON-LD Product schema |

## Caching Strategy

| Page type | Cache | Cleared by |
|---|---|---|
| `/[slug]` flashlight pages | Static (SSG) — served from Vercel edge | Deploy · Admin approves submission · Force clear button |
| `/` browse page | Static shell (client fetches data) | Deploy |
| `/my` `/account` `/contribute` `/compare` `/report` | `force-dynamic` — never cached | Always fresh |
| Brand/emitter filter lists | localStorage, 5 min TTL | Auto-expire · Admin approve/force-clear clears immediately |

**Vercel Cron:** `vercel.json` schedules `/api/ping` daily at 08:00 UTC — queries DB to prevent Supabase free tier from pausing.

**On-demand revalidation flow:**
- Admin approves an **edit** → `revalidatePath('/slug')` clears that one page instantly
- Admin approves a **new** flashlight → `revalidatePath('/', 'layout')` clears browse
- Admin edits DB directly (Supabase Table Editor) → use **"Force clear cache"** button in `/admin` to clear all flashlight pages at once
- Every **deploy** → Vercel rebuilds all static pages automatically

`brands` and `emitters` filter lists are cached in **localStorage for 1 hour** (BrowsePage).

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

**Battery types:** CR123A, D-cell, AA, AAA, 10440, 14500, 16340, 18350, 18650, 21700, 26650, Built-in

(Note: `16340` = RCR123 rechargeable Li-ion — use for lights with USB-C charging in a CR123-size cell, e.g. Acebeam W20/E10/G10. Reserve `CR123A` for lights that take non-rechargeable primaries, e.g. SureFire/Malkoff. Both `CATEGORIES` and `BATTERY_TYPES` are hardcoded in `components/FilterPanel.tsx` — adding a value there is a code change that needs a deploy to show on prod.)

**Charging:** Any / USB / Magnetic / None

**Lumen steps:** 100, 300, 500, 800, 1K, 2K, 5K, 10K, Any

**Price steps:** $50, $100, $200, $300, $500, $800, $1K, $2K, $3K, $5K, $10K, Any

## Color System

Brand color `#eba00b` (refined amber) defined as `brand-*` scale in `app/globals.css`:
- `brand-500` → primary accents, active filter buttons, active wishlist/collection, logo
- `brand-100` / `brand-50` → light backgrounds (rare)
- **Never use `amber-*`** — always use `brand-*`

Page surface: `#f6f6f3` (warm off-white) — defined via `--color-gray-100` override in `@theme`, and as body background. All pages use `bg-gray-100` which resolves to this.

Card borders: `#e7e7e1` (warm light gray). Hover border: `#c8c8c0`. Use these instead of `border-slate-200`.

No box-shadows anywhere. Hover = border darkens only.

**JetBrains Mono** loaded via `next/font/google` in `app/layout.tsx` as `--font-mono` CSS variable. Used via `font-mono` Tailwind class for all numeric values (lumens, price, dimensions, spec table values).

**Custom checkbox/radio CSS** in `globals.css` — classes `.cb` (checkbox) and `.rb` (radio). Flat, amber accent on check. Use instead of `accent-brand-500`.

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
