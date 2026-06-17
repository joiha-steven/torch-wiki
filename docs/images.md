# Images & PDFs — optimization, cost, workflow, scripts

## Image Optimization & Cost

- All product images are optimized by Vercel's image optimizer (`/_next/image`). Billed per **transformation** (a unique image×size×format), cached for `minimumCacheTTL = 1 year`. Free/Hobby has a quota — exceeding it returns **HTTP 402** and images break site-wide (this happened; fixed by upgrading to Pro).
- `next.config.ts` trims variants to keep transformations low: `deviceSizes: [640, 828, 1080, 1920]`, `imageSizes: [128, 384]` (≈6 variants/image instead of up to 16), matched to the actual card/hero/thumbnail layouts. `remotePatterns` restricted to Blob + `cdn.shopify.com`.
- Blob URLs are immutable (random suffix) → safe to cache "forever"; changing an image yields a new URL.
- **LCP — browse card images (`FlashlightCard`):** the **default sort is random**, so which card becomes the LCP element changes every load — you can't reliably mark "the" LCP image. Two rules cover the whole initial viewport instead:
  - **No JS opacity fade.** The old `.img-load { opacity:0 } → .is-loaded` (flipped on `onLoad`) kept the image invisible until React hydrated → ~1.2s of LCP "render delay". `FlashlightCard` no longer applies `img-load`; images paint as soon as they decode. (The `.img-load` CSS lives on, still used by `app/[slug]/ImageGallery.tsx`.)
  - **Eager near-fold, lazy beyond.** `BrowseGrid` passes `priority={i < 4}` (Next preload + explicit `fetchPriority="high"` — this build does **not** derive fetchpriority from `priority`, so set it by hand; it also lands on the preload `<link>`) and `eager={i < 12}` → `loading="eager"` so cards 4–11 fetch immediately too. Without this a lazy LCP image waited on layout (~1.4s resource-load delay). Cards 12+ stay `loading="lazy"`.
- **Browse JS (perf):** card detail/brand links use **`components/HoverPrefetchLink.tsx`** (hover/focus/touch-triggered prefetch: `prefetch={active ? null : false}`, flipped on first pointer intent) instead of plain `<Link>`. A 32+ card grid prefetching every route on viewport-entry pulled the react-markdown chunk (~44KB, unused on browse) + 32 RSC requests into the initial load; eager `prefetch={false}` fixed that but then never prefetched at all. Hover-prefetch is the middle ground — nothing on load, but the card you point at is warmed so the click feels instant. Detail pages are edge SSG so click-through stays fast regardless. `package.json` sets a modern **`browserslist`** (safari≥15.4 etc.), but note the ~14KB "legacy JavaScript" Lighthouse still flags is **core-js bundled inside a dependency** — Next doesn't re-transpile `node_modules`, so browserslist can't strip it (would need `transpilePackages`; not worth it). JS is Brotli-compressed at the edge automatically — no manual compression. Don't re-introduce `@vercel/speed-insights` (removed — billed, was disabled in dashboard); `@vercel/analytics` is kept on purpose.

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
| `scripts/normalize-emitters.mjs` | Normalize emitter names DB-wide (see emitter naming convention above) |

**⚠ Brand scraper / seed scripts are PRIVATE — not in this public repo.** All
`seed-*.mjs` (LED Lenser, Acebeam, Prometheus, Foursevens, Nextorch, Lumintop,
Olight, …), `add-coolfall-trek.mjs`, and their `*-data.json` live in the workspace
repo at **`edc.wiki/04_Codebase/scrapers/`** (private), symlinked into `scripts/`
and gitignored here (`scripts/seed-*.mjs`, `scripts/*-data.json`). **New flashlight
scrapers go there too, never committed to this repo** (owner rule, 2026-06-17). They
still run normally from the repo root — `node scripts/<name>.mjs` — because a
`node_modules` symlink in the scrapers dir resolves the deps and `.env.local` loads
from the cwd. See `04_Codebase/scrapers/README.md`.

**Seeding convention:** Always set `image_url` in the **same upsert** as the row data, then migrate the blob in the same script (see the Acebeam tactical/more scrapers for the combined pattern). Do NOT insert rows first and add images in a second pass — detail pages are SSG with `revalidate = false`, so a page rendered during the null-image window freezes with "No image" (the browse grid still shows it because it fetches client-side). After any direct DB seed/edit, force-clear cache: `curl -X POST https://torch.edc.wiki/api/revalidate -H 'Content-Type: application/json' -H "x-revalidate-secret: $REVALIDATE_SECRET" -d '{"force":true}'`. (The route now requires either this secret header or an admin/mod bearer token — see Security below. The admin "Force clear cache" button uses the session token automatically.)

