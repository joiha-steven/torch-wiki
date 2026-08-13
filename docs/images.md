# Images & PDFs — storage, optimization, workflow, scripts

## Storage (self-hosted since 2026-08-13)

**All product images + manuals live on the box**: `/home/torch/files`, served by nginx at
`https://torch.edc.wiki/files/<pathname>` (1y immutable + `nosniff`), cached at the
Cloudflare edge by default (extensions). Uploads go through `lib/storage.ts`
(`STORAGE_DRIVER=local`) — see `docs/code-map.md`. Vercel Blob is the legacy backend; the
DB no longer references it (3,549 URLs rewritten at cutover; reverse mapping in workspace
`02_Audit/2026-08-13-url-rewrite-backup.json`).

**Pathnames are immutable by rule.** Everything cached 1y (nginx + CF) keys on the
pathname, so replacing a file must mint a NEW name: manuals are timestamped
(`manual-<Date.now()>.pdf`, both upload routes), images carry unique names
(uuid/suffix). Never write code that overwrites an existing `/files/` pathname.

## Image Optimization

- `/_next/image` runs **on the box** (sharp, in the Next process — no per-transformation
  billing anymore; the old Vercel 402-quota story is history). Two cache layers in front:
  nginx `proxy_cache` (`conf.d/zz-cache-torch.conf`, 30d, honors `Vary: Accept` so
  avif/webp/jpeg variants cache separately; HIT ≈ 7 ms on-box) and, once the owner's CF
  cache rule is active, the Cloudflare edge.
- `next.config.ts` keeps the trimmed variant set: `deviceSizes: [640, 828, 1080, 1920]`,
  `imageSizes: [128, 384]`, `minimumCacheTTL = 1y`. `remotePatterns`: Blob (legacy),
  `cdn.shopify.com` (safety net), `torch.edc.wiki` (the live host).
- The optimizer fetches source URLs (`https://torch.edc.wiki/files/…`) through Cloudflare
  and back — a hairpin. Cold cost only; both caches make repeats cheap. Don't "fix" it
  with `NODE_TLS_REJECT_UNAUTHORIZED` or `/etc/hosts` loopback tricks (breaks TLS
  verification / hits the self-signed origin cert).
- **LCP — browse card images (`FlashlightCard`):** default sort is random, so the LCP
  element changes every load. Two rules cover the initial viewport:
  - **No JS opacity fade** on cards (`.img-load` removed there; still used by
    `app/[slug]/ImageGallery.tsx`) — the fade cost ~1.2s of LCP render delay.
  - **Eager near-fold, lazy beyond**: `BrowseGrid` passes `priority={i < 4}` + explicit
    `fetchPriority="high"` (this Next build does NOT derive fetchpriority from `priority`)
    and `eager={i < 12}`; cards 12+ stay lazy.
- **Browse JS (perf):** `components/HoverPrefetchLink.tsx` = hover/focus/touch-triggered
  prefetch middle ground (nothing on load, pointed-at cards warm). The ~14KB "legacy
  JavaScript" Lighthouse flags is core-js inside a dependency — browserslist can't strip
  it (would need `transpilePackages`; not worth it). Brotli to the client is handled by
  Cloudflare; Node gzips origin→CF.

## Image Workflow

File path format: `flashlights/{slug}/primary.{ext}` (+ `extra-N`, `manual-<ts>.pdf`).

```bash
# 1. Insert data to DB (SQL or seed script)
# 2. Migrate images from external URLs → storage
node scripts/migrate-to-vercel-blob.mjs   # name is historical; it writes via the storage driver's target
```

Script skips already-migrated images — safe to re-run. **CDN hotlink protection:** some
brand CDNs (e.g. Weltool) need a `Referer` header — extend `refererMap` in the script.

### Scripts reference

| Script | Purpose |
|---|---|
| `scripts/migrate-to-vercel-blob.mjs` | Download images from any URL → storage → update DB (historical name) |
| `scripts/normalize-emitters.mjs` | Normalize emitter names DB-wide |

**⚠ Brand scraper / seed scripts are PRIVATE — not in this public repo.** All `seed-*.mjs`
and their `*-data.json` live in the workspace repo at `edc.wiki/04_Codebase/scrapers/`
(private), symlinked into `scripts/` and gitignored here. New scrapers go there too, never
committed here (owner rule, 2026-06-17). See `04_Codebase/scrapers/README.md`.

**Seeding convention:** set `image_url` in the **same upsert** as the row data, migrate the
file in the same script. Do NOT insert rows first and add images later — detail pages are
SSG `revalidate = false`; a page rendered in the null-image window freezes with "No image".
After any direct DB seed/edit, force-clear: `curl -X POST
https://torch.edc.wiki/api/revalidate -H 'Content-Type: application/json' -H
"x-revalidate-secret: $REVALIDATE_SECRET" -d '{"force":true}'` (secret header or admin/mod
bearer token — the admin "Force clear cache" button sends the session token). Remember the
CF HTML rule (once active) can keep an edge copy up to 10 more minutes.
