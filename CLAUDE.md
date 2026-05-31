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

In `.env.local` (never commit this file):
```
NEXT_PUBLIC_SUPABASE_URL=https://nssuhfyymlgkkclmtlhg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
BLOB_STORE_ID=store_73qdbLjAtmX1zWRW
```

To restore `.env.local` after `vercel env pull` overwrites it: re-add the Supabase keys manually (Vercel pull only pulls Blob + OIDC tokens).

## Database Schema (Supabase)

Key tables:
- `flashlights` — main product table with specs, `image_url` (Vercel Blob URL), `slug`
- `flashlight_images` — extra images per flashlight (`url`, `sort_order`)
- `reviews` — review links per flashlight
- `user_wishlists` — `(user_id, flashlight_id)` — RLS: user sees own rows only
- `user_collections` — `(user_id, flashlight_id, purchase_price, material, color, purchase_date, quantity)` — RLS: user sees own rows only

## Image Workflow

**All images are stored on Vercel Blob** (global CDN). Supabase Storage is no longer used.

Image URL format: `https://73qdbljatmx1zwrw.public.blob.vercel-storage.com/flashlights/{slug}/primary.jpg`

### Adding new flashlights (standard flow)

```bash
# Step 1: run seed script (writes hotlinks to DB)
node scripts/seed-xyz.mjs

# Step 2: migrate images to Vercel Blob (downloads hotlinks → uploads to Blob → updates DB)
node scripts/migrate-to-vercel-blob.mjs
```

The migrate script skips images already on Vercel Blob — safe to re-run.

### Uploading an image manually in code

```js
import { put } from '@vercel/blob'

const { url } = await put('flashlights/my-light/primary.jpg', fileBuffer, {
  access: 'public',
  token: process.env.BLOB_READ_WRITE_TOKEN,
})
// url is the CDN URL — store this in flashlights.image_url
```

### Scripts reference

| Script | Purpose |
|---|---|
| `scripts/seed-*.mjs` | Seed flashlight data (scrape + insert to DB) |
| `scripts/migrate-to-vercel-blob.mjs` | Download images from any URL → upload to Vercel Blob → update DB |
| `scripts/cleanup-supabase-storage.mjs` | Delete all files from old Supabase Storage bucket (already ran) |
| `scripts/migrate-images-to-storage.mjs` | Old script — migrated hotlinks to Supabase Storage (no longer needed) |

## Key Components

| File | Purpose |
|---|---|
| `lib/auth-context.tsx` | Supabase Auth context — user state, wishlist/collection Sets, toggle methods |
| `components/Providers.tsx` | Client wrapper for `AuthProvider` + `AuthModal` — used in `app/layout.tsx` |
| `components/AuthModal.tsx` | Sign in / Sign up modal (email + password) |
| `components/UserMenu.tsx` | Header avatar dropdown — sign in button or user email + My Lists + Sign out |
| `components/FilterPanel.tsx` | Sidebar filters — brand, lumens, price, category, battery, LED, charging |
| `components/FlashlightCard.tsx` | Grid card with heart (wishlist) + bookmark (collection) toggle buttons |
| `components/CollectionEditModal.tsx` | Edit collection item metadata (price paid, quantity, date, material, color) |
| `app/my/page.tsx` | My Lists page — wishlist tab + collection tab with grid/list view toggle |
| `app/flashlight/[slug]/ImageGallery.tsx` | Main image + thumbnail strip (client component) |
| `app/flashlight/[slug]/WishlistButtons.tsx` | Wishlist/collection buttons on detail page (client component) |

## Color System

Brand color `#FFBE00` (3500K warm yellow) defined as `brand-*` scale in `app/globals.css`:
- Use `brand-500` for primary accents, buttons, active states
- Use `brand-100` / `brand-50` for light backgrounds
- Never use `amber-*` — always use `brand-*`

## Material Options (CollectionEditModal)

Ordered: Aluminum → Copper-based → Exotic
`Aluminum, Raw Aluminum, 7075 Aluminum, Anodized Aluminum, Cerakote Aluminum, Copper, Brass, Bronze, Zirconium, Zircuti, Timascus, Damasteel, Damasteel Fenja, Other`

## Deployment

Push to `main` → Vercel auto-deploys to `https://torch.edc.wiki`.

Git author: `hung.tran@joiha.com` (run `git config --global user.email "hung.tran@joiha.com"` if on a new machine).
