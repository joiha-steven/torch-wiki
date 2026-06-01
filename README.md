# Torch EDC.wiki

A community reference database for flashlight collectors and enthusiasts. Built by a flashlight hobbyist, for flashlight hobbyists.

No ads. No fees. No profit.

**Live site:** [torch.edc.wiki](https://torch.edc.wiki) — **GitHub:** [joiha-steven/torch-wiki](https://github.com/joiha-steven/torch-wiki)

---

## What is this?

Flashlight collecting is a niche hobby with a passionate community but no central, structured reference. Specs are scattered across manufacturer pages, forum threads, and YouTube reviews. This project aims to fix that — one flashlight at a time.

---

## Features

**Browsing & discovery**
- Filter by brand, category, battery type, LED/emitter, max lumens, price range, and charging method
- Sort by model, lumens, price, beam distance, or weight
- Search by brand or model name
- Compare up to 4 flashlights side by side

**Flashlight pages**
- Full spec sheet: lumens, beam distance, emitter, battery, dimensions, weight, IP rating, charging
- Image gallery, product notes, linked reviews (articles & videos), user manual
- Attribution: who added it and who last updated it

**User accounts**
- Free sign up with email + password
- Wishlist — save flashlights you want
- Collection — track flashlights you own (purchase price, date, material, quantity)
- My Account — change email (with verification), permanent nickname, change password
- Two-factor authentication (TOTP) with recovery codes

**Community contributions**
- Submit new flashlights or suggest edits to existing ones
- All submissions go into a pending queue — reviewed before going live
- Requires a nickname to contribute

**Security**
- Cloudflare Turnstile captcha on signup, forgot password, and submission forms
- Login rate limiting: 5 failed attempts → 10-minute lockout
- 2FA with SHA-256 hashed recovery codes

---

## Tech Stack

- [Next.js](https://nextjs.org) — App Router, TypeScript, Turbopack
- [Supabase](https://supabase.com) — PostgreSQL database + Auth (email/password + TOTP 2FA)
- [Vercel](https://vercel.com) — hosting, Blob CDN (images), Analytics, Speed Insights
- [Tailwind CSS v4](https://tailwindcss.com)
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

```bash
npm run dev
```

---

## Adding flashlights

1. Insert data via Supabase Table Editor or SQL
2. Run image migration to host images on Vercel Blob:
```bash
node scripts/migrate-to-vercel-blob.mjs
```

Script is safe to re-run — skips images already on Blob. Some brand CDNs require a `Referer` header (handled via `refererMap` in the script).

---

## Content & images

All product information, specifications, and images belong to their respective manufacturers and brands. This site is a non-commercial reference project with no affiliation to any flashlight brand.
