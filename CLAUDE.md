@AGENTS.md

# Torch EDC.wiki — Project Overview

Flashlight database web app. Live at **https://torch.edc.wiki**.

## Tech Stack

- **Next.js 16.2.6** — App Router, Turbopack, TypeScript
- **Tailwind CSS v4** — custom `brand-*` color scale (`#FFBE00`) defined in `app/globals.css` via `@theme`
- **Supabase** — PostgreSQL database (region: ap-southeast-2, Sydney). Anon key for reads, service role key for writes in scripts.
- **Vercel Blob** — image storage with global CDN (replaces Supabase Storage)
- **Vercel** — hosting, Analytics, Speed Insights. Function region: `iad1` (US East, set in `vercel.json`)
- **Supabase Auth** — email/password authentication for wishlist/collection features

## Environment Variables

In `.env.local` (never commit this file — no real values here):
```
NEXT_PUBLIC_SUPABASE_URL=https://nssuhfyymlgkkclmtlhg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
BLOB_STORE_ID=store_73qdbLjAtmX1zWRW
```

**After `vercel env pull`:** re-add the two Supabase keys manually — Vercel pull only restores Blob + OIDC tokens.

## Database Schema (Supabase)

Key tables:
- `flashlights` — main product table. RLS disabled (public read). Key columns:
  - specs: `max_lumens`, `min_lumens`, `beam_distance_m`, `beam_type`, `emitter` (text), `emitters` (text[]), `battery_type`, `battery_count`, `charging_type`, `has_usb_charging`, `length_mm`, `head_diameter_mm`, `body_diameter_mm`, `weight_g`, `material`, `ip_rating`, `impact_resistance_m`, `category`, `price_usd`, `year`
  - content: `image_url` (Vercel Blob URL), `slug`, `notes`, `manual_url`, `description`, `is_discontinued`
- `flashlight_images` — extra images per flashlight (`url`, `sort_order`)
- `reviews` — review links per flashlight (`title`, `reviewer`, `url`, `type`, `summary`)
- `user_wishlists` — `(user_id, flashlight_id)` — RLS: user sees own rows only
- `user_collections` — `(user_id, flashlight_id, purchase_price, material, color, purchase_date, quantity)` — RLS: user sees own rows only

**Note on emitters:** `emitter` (text) stores the raw/legacy value. `emitters` (text[]) is the canonical array — always use this for filtering and display. Multi-LED flashlights have multiple entries e.g. `{Cree XHP70.2, Luminus SBT90.3}`.

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

**RPC function** (run once if missing):
```sql
CREATE OR REPLACE FUNCTION get_distinct_emitters()
RETURNS TABLE(emitter text) LANGUAGE SQL AS $$
  SELECT DISTINCT unnest(emitters) AS emitter
  FROM flashlights
  WHERE cardinality(emitters) > 0
  ORDER BY emitter;
$$;
```

## Auth Flow

- Sign in / Sign up via `AuthModal` (email + password)
- Forgot password → `supabase.auth.resetPasswordForEmail()` → email link → `/reset-password`
- Change password (logged in) → `/change-password` — re-authenticates with current password first
- `UserMenu` shows "My Collection": `My` white / `Collection` brand yellow when logged in; all white when logged out

## Image Workflow

**All images on Vercel Blob.** Supabase Storage not used.

Blob path format: `flashlights/{slug}/primary.{ext}`

### Adding new brand/flashlights

```bash
# 1. Insert data to DB (SQL or seed script)
# 2. Migrate images from external URLs → Vercel Blob
node scripts/migrate-to-vercel-blob.mjs
```

Script skips images already on Vercel Blob — safe to re-run anytime.

**CDN hotlink protection:** some brands (e.g. Weltool) require a `Referer` header. The migrate script handles this via `refererMap` in the download function — add new entries there if a brand's CDN blocks downloads.

### Scripts reference

| Script | Purpose |
|---|---|
| `scripts/migrate-to-vercel-blob.mjs` | Download images from any URL → upload to Vercel Blob → update DB |
| `scripts/rename-images.mjs` | One-time rename of legacy image filenames to SEO format |
| `scripts/seed-*.mjs` | Historical seed scripts per brand (Surefire, Malkoff) |
| `scripts/cleanup-supabase-storage.mjs` | Already ran — deleted old Supabase Storage files |

## Key Components

| File | Purpose |
|---|---|
| `lib/auth-context.tsx` | Supabase Auth context — user, wishlistIds, collectionIds, toggle methods |
| `lib/types.ts` | TypeScript types: Flashlight, Review, FilterState, CollectionItem, WishlistItem |
| `components/Providers.tsx` | Client wrapper for AuthProvider + AuthModal — used in `app/layout.tsx` |
| `components/AuthModal.tsx` | Sign in / Sign up / Forgot password modal |
| `components/UserMenu.tsx` | Header "My Collection" button — dropdown with My Lists, Change Password, Sign out |
| `components/BrowsePage.tsx` | Main browse page — server-side filter/sort, pagination (32/page), compare, search |
| `components/FilterPanel.tsx` | Sidebar filters — brand, lumens, price, category, battery, LED, charging |
| `components/FlashlightCard.tsx` | Grid card — image, key specs, compare checkbox, wishlist/collection buttons |
| `components/CollectionEditModal.tsx` | Edit collection metadata (price, qty, date, material, color) |
| `app/flashlight/[slug]/page.tsx` | Detail page — gallery, specs table, notes, reviews, user manual |
| `app/flashlight/[slug]/ImageGallery.tsx` | Image gallery with thumbnail strip |
| `app/flashlight/[slug]/WishlistButtons.tsx` | Wishlist + collection toggle buttons |
| `app/my/page.tsx` | My Lists — wishlist tab + collection tab, grid/list toggle |
| `app/compare/page.tsx` | Side-by-side spec comparison (up to 4 flashlights) |
| `app/reset-password/page.tsx` | Password reset via email link (PASSWORD_RECOVERY event) |
| `app/change-password/page.tsx` | Change password while logged in (re-auth + updateUser) |

## Filter Options

**Categories:** EDC, Tactical, Weapon Light, Thrower, Flood, Headlamp, Search & Rescue, Work, Custom

**Battery types (primary first, then rechargeable small→large):**
CR123A, D-cell, AA, AAA, 10440, 14500, 18350, 18650, 21700, 26650, Built-in

**Charging:** Any / USB / Magnetic / None

**Lumen steps:** 100, 300, 500, 800, 1K, 2K, 5K, 10K, Any

**Price steps:** $50, $100, $200, $300, $500, $800, $1K, $2K, $3K, $5K, $10K, Any

## Color System

Brand color `#FFBE00` (warm yellow ~3500K) defined as `brand-*` scale in `app/globals.css`:
- `brand-500` → primary accents, buttons, active states
- `brand-100` / `brand-50` → light backgrounds
- **Never use `amber-*`** — always use `brand-*`

## Material Options (CollectionEditModal)

Ordered: Aluminum → Copper-based → Exotic

`Aluminum, Raw Aluminum, 7075 Aluminum, Anodized Aluminum, Cerakote Aluminum, Copper, Brass, Bronze, Zirconium, Zircuti, Timascus, Damasteel, Damasteel Fenja, Other`

## Flashlight Detail Page

Sections in order:
1. Image gallery (ImageGallery component)
2. Hero info (brand, model, category, key stats, price, wishlist buttons)
3. Notes block — shown only if `flashlight.notes` is not null
4. Specifications table
5. Reviews — shown only if reviews exist
6. User Manual — shown only if `flashlight.manual_url` is not null

## Deployment

Push to `main` → Vercel auto-deploys to `https://torch.edc.wiki`.

Git remote: `https://TOKEN@github.com/joiha-steven/torch-wiki.git`
(Replace TOKEN with a fresh GitHub Personal Access Token — never commit the token)

Git author:
```bash
git config user.name "Hung Tran"
git config user.email "hung.tran@joiha.com"
```
