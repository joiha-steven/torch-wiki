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
```

**After `vercel env pull`:** re-add Supabase keys manually — Vercel pull only restores Blob + OIDC tokens.

## Database Schema (Supabase)

Key tables:
- `flashlights` — main product table. RLS disabled (public read). Key columns:
  - specs: `max_lumens`, `min_lumens`, `beam_distance_m`, `beam_type`, `emitter` (legacy text), `emitters` (text[]), `battery_type`, `battery_count`, `charging_type`, `has_usb_charging`, `length_mm`, `head_diameter_mm`, `body_diameter_mm`, `weight_g`, `material`, `ip_rating`, `impact_resistance_m`, `category`, `price_usd`, `year`
  - content: `image_url` (Vercel Blob URL), `slug`, `notes`, `manual_url`, `description`, `is_discontinued`
  - attribution: `updated_by` (uuid → auth.users) — set when admin approves a user edit
- `flashlight_images` — extra images per flashlight (`url`, `sort_order`)
- `reviews` — review links per flashlight (`title`, `reviewer`, `url`, `type`, `summary`)
- `user_wishlists` — `(user_id, flashlight_id)` — RLS: user sees own rows only
- `user_collections` — `(user_id, flashlight_id, purchase_price, material, color, purchase_date, quantity)` — RLS: user sees own rows only
- `profiles` — `(id, nickname, updated_at)` — RLS: public SELECT, owner INSERT/UPDATE. Nickname: letters/numbers/`-`/`_` only, 3–30 chars, unique, **permanent once set**. Real-time availability check (debounced 500ms) on the input.
- `flashlight_submissions` — user-submitted new flashlights or edits. `type` (new|edit), `status` (pending|approved|rejected), `target_id` (flashlight being edited), `data` (jsonb), `user_id`
- `submission_images` — images attached to a submission (`url`, `sort_order`, `is_primary`)
- `recovery_codes` — hashed 2FA recovery codes per user (`code_hash`, `used_at`)

**Note on emitters:** `emitter` (text) is legacy. `emitters` (text[]) is canonical — always use for filtering and display.

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

## Contribution System (`/contribute`)

Three tabs:
1. **Add flashlight** — full spec form + image upload → pending queue
2. **Edit existing** — search + pick flashlight → pre-filled form → pending queue
3. **My submissions** — list of user's past submissions with status

- Requires account + **nickname** (blocked if no nickname set)
- Captcha verification server-side before DB insert
- Images uploaded to Vercel Blob at `submissions/{submission_id}/{uuid}.{ext}`
- "Suggest an edit" link on each flashlight detail page → `/contribute?suggest={id}`

## Admin (`/adminroot`)

- Only accessible when signed in as `hung.tran@joiha.com`
- Tabs: Pending / Approved / Rejected
- Each submission shows: type badge, before/after diff (highlighted changed fields), image previews
- Approve → writes to `flashlights` table (insert for new, update for edit), sets `updated_by = submission.user_id`
- Reject → saves reviewer note shown to the submitter

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
| `components/SubmitFlashlightForm.tsx` | Full spec form with image upload + Turnstile captcha |
| `app/[slug]/page.tsx` | Flashlight detail page — gallery, specs, reviews, manual, attribution |
| `app/my/page.tsx` | My Lists — wishlist + collection |
| `app/account/page.tsx` | My Account — profile (email change, nickname), security (password, 2FA) |
| `app/contribute/page.tsx` | Contribute — add/edit flashlights, submission history |
| `app/adminroot/page.tsx` + `AdminDashboard.tsx` | Admin review queue |
| `app/compare/page.tsx` | Side-by-side spec comparison (up to 4) |
| `app/updates/page.tsx` | Static changelog |
| `app/api/captcha-verify/route.ts` | Verifies Cloudflare Turnstile token |
| `app/api/recover-account/route.ts` | Verifies recovery code hash → unenrolls TOTP via admin API |
| `app/api/upload/route.ts` | Vercel Blob client upload handler |
| `app/api/revalidate/route.ts` | On-demand cache invalidation — called by admin on approval or force-clear |

## Caching Strategy

| Page type | Cache | Cleared by |
|---|---|---|
| `/[slug]` flashlight pages | Static (SSG) — served from Vercel edge | Deploy · Admin approves submission · Force clear button |
| `/` browse page | Static shell (client fetches data) | Deploy |
| `/my` `/account` `/contribute` `/compare` `/report` | `force-dynamic` — never cached | Always fresh |

**On-demand revalidation flow:**
- Admin approves an **edit** → `revalidatePath('/slug')` clears that one page instantly
- Admin approves a **new** flashlight → `revalidatePath('/', 'layout')` clears browse
- Admin edits DB directly (Supabase Table Editor) → use **"Force clear cache"** button in `/adminroot` to clear all flashlight pages at once
- Every **deploy** → Vercel rebuilds all static pages automatically

`brands` and `emitters` filter lists are cached in **localStorage for 1 hour** (BrowsePage).

## Flashlight Detail Page

Sections in order:
1. Image gallery
2. Hero info (brand, model, category, key stats, price, wishlist/collection buttons)
3. "Suggest an edit" link
4. Notes block — shown only if `flashlight.notes` is not null
5. Specifications table
6. Reviews — shown only if reviews exist
7. User Manual — shown only if `flashlight.manual_url` is not null
8. Attribution line — "Added by system · [date]" + "Last updated by [nickname] · [date]" if applicable

## Filter Options

**Categories:** EDC, Tactical, Weapon Light, Thrower, Flood, Headlamp, Search & Rescue, Work, Custom

**Battery types:** CR123A, D-cell, AA, AAA, 10440, 14500, 18350, 18650, 21700, 26650, Built-in

**Charging:** Any / USB / Magnetic / None

**Lumen steps:** 100, 300, 500, 800, 1K, 2K, 5K, 10K, Any

**Price steps:** $50, $100, $200, $300, $500, $800, $1K, $2K, $3K, $5K, $10K, Any

## Color System

Brand color `#FFBE00` (warm yellow ~3500K) defined as `brand-*` scale in `app/globals.css`:
- `brand-500` → primary accents, buttons, active states
- `brand-100` / `brand-50` → light backgrounds
- **Never use `amber-*`** — always use `brand-*`

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
