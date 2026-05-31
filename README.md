# Torch EDC.wiki

A community reference database for flashlight collectors and enthusiasts. Built by a flashlight hobbyist, for flashlight hobbyists.

No ads. No fees. No profit.

**Live site:** [torch.edc.wiki](https://torch.edc.wiki)

---

## What is this?

Flashlight collecting is a niche hobby with a passionate community but no central, structured reference. Specs are scattered across manufacturer pages, forum threads, and YouTube reviews. This project aims to fix that — one flashlight at a time.

---

## Features

- **Flashlight database** — specs sourced from manufacturers: lumens, beam distance, emitter, battery type, dimensions, weight, IP rating, charging type, and more
- **Filter & sort** — narrow down by brand, category, battery type, LED, max lumens, price range, and charging method
- **Compare** — select up to 4 flashlights and compare specs side by side
- **Detail pages** — full spec sheet per model, image gallery, and linked reviews (articles & videos)
- **Wishlist** — save flashlights you want (requires free account)
- **Collection** — track flashlights you own, with purchase price, date, material variant, and quantity
- **My Lists** — personal dashboard with wishlist and collection tabs, grid/list view toggle
- **Mobile friendly** — responsive layout with filter drawer on small screens

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

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
BLOB_READ_WRITE_TOKEN=...
```

```bash
npm run dev
```

---

## Content & images

All product information, specifications, and images belong to their respective manufacturers and brands. This site is a non-commercial reference project with no affiliation to any flashlight brand.
