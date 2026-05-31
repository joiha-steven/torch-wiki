# Torch EDC.wiki

A community reference database for flashlight collectors and enthusiasts. Built by a flashlight hobbyist, for flashlight hobbyists.

No ads. No fees. No profit.

**Live site:** [torch.edc.wiki](https://torch.edc.wiki) — **GitHub:** [joiha-steven/torch-wiki](https://github.com/joiha-steven/torch-wiki)

---

## What is this?

Flashlight collecting is a niche hobby with a passionate community but no central, structured reference. Specs are scattered across manufacturer pages, forum threads, and YouTube reviews. This project aims to fix that — one flashlight at a time.

---

## Features

- **Flashlight database** — specs sourced from manufacturers: lumens, beam distance, emitter, battery type, dimensions, weight, IP rating, charging type, and more
- **Filter & sort** — narrow down by brand, category, battery type, LED/emitter, max lumens, price range, and charging method
- **Compare** — select up to 4 flashlights and compare specs side by side
- **Detail pages** — full spec sheet per model, image gallery, notes, linked reviews (articles & videos), user manual
- **Wishlist** — save flashlights you want (requires free account)
- **Collection** — track flashlights you own, with purchase price, date, material variant, and quantity
- **My Lists** — personal dashboard with wishlist and collection tabs, grid/list view toggle
- **Account** — sign up, sign in, forgot password (email reset link), change password
- **Mobile friendly** — responsive layout with filter drawer on small screens
- **Fast** — server-side filtering and pagination, loads 32 items at a time

---

## Tech Stack

- [Next.js](https://nextjs.org) — App Router, TypeScript
- [Supabase](https://supabase.com) — PostgreSQL database + auth
- [Vercel](https://vercel.com) — hosting, image storage (Blob), analytics
- [Tailwind CSS](https://tailwindcss.com)

---

## Running locally

```bash
git clone https://github.com/joiha-steven/torch-wiki.git
cd torch-wiki
npm install
```

Create `.env.local` (get values from Supabase + Vercel dashboards):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
BLOB_READ_WRITE_TOKEN=...
```

Or pull env vars from Vercel CLI (then add Supabase keys manually):
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

---

## Content & images

All product information, specifications, and images belong to their respective manufacturers and brands. This site is a non-commercial reference project with no affiliation to any flashlight brand.
