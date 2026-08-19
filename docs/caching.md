# Caching strategy

**Self-hosted since 2026-08-13.** The chain is: browser → **Cloudflare edge** (orange
cloud, mandatory — origin firewall accepts only CF ranges) → **nginx** on `sv3-usa`
`209.50.62.147` → **Next.js** (`next start`, systemd `torch-wiki`) → Supabase (us-east-1).
There is no Vercel edge anymore; anything the old docs said about "Vercel edge" now maps to
the CF + nginx layers below.

## Per-layer map

| Layer | What it caches | TTL | Cleared by |
|---|---|---|---|
| Cloudflare edge | `/files/*` (has file extensions → CF default cache) | respects nginx `1y immutable` | new uploads mint NEW pathnames (timestamped manuals, suffixed images) — never overwrite |
| Cloudflare edge | `/_next/static/*` (js/css) | 1y immutable | build hash changes per deploy |
| Cloudflare edge | HTML + `/_next/image` | ⏳ **pending 2 Cache Rules** (owner): `/_next/image*` respect-origin; HTML Edge-TTL **10 min override** | HTML rule MUST be a short override — slug pages send `s-maxage=31536000` and `revalidatePath` cannot purge CF; 10 min bounds staleness. Long-TTL version requires wiring the CF purge API into the revalidate flow (not done) |
| nginx | `/_next/image` responses (`conf.d/zz-cache-torch.conf`, 2 GB, 30d, honors `Vary: Accept`) | 30d | `rm -rf /var/cache/nginx/torch && systemctl reload nginx` (rarely needed — variants are immutable) |
| Next.js | ISR/SSG pages + data cache + image variants (`.next/cache`) | per-route (below) | `revalidatePath` (approve flows), Force-clear button, deploy (torch-deploy.sh builds from a clean `.next`) |
| Client | brand/emitter filter lists in localStorage | 5 min | auto-expire · admin approve/force-clear |

## Per-page (Next layer — unchanged from the Vercel era)

| Page type | Cache | Cleared by |
|---|---|---|
| `/[slug]` flashlight pages | Static (SSG, `revalidate = false`) | Deploy · admin approves submission · Force clear button |
| `/` browse page | **ISR `revalidate = 3600`** — server renders first 32 cards + filter meta, ships in HTML; client takes over | Deploy · hourly revalidate |
| `/my` `/account` `/contribute` `/compare` `/report` | `force-dynamic` | Always fresh |

**Crons:** `/etc/cron.d/torch-wiki` on the box — 08:00 UTC `/api/ping` (keeps the Supabase
free tier from pausing), 08:30 purge-trash with `CRON_SECRET`. (`vercel.json` still lists
the old Vercel crons; it is inert and kept only as history.)

**On-demand revalidation flow:**
- Admin approves an **edit** → `revalidatePath('/slug')` clears that page in Next.
- Admin approves a **new** flashlight → `revalidatePath('/', 'layout')` clears browse.
- Direct DB edit (Supabase Table Editor) → **"Force clear cache"** button in `/admin`, or
  `curl -X POST https://torch.edc.wiki/api/revalidate -H "x-revalidate-secret: …"`.
- ⚠ All of the above clear the **Next** layer only. Once the CF HTML rule is active, the
  edge copy lives up to 10 more minutes; `/files/` assets never need purging because
  pathnames are immutable.

**Browse first-paint (perf):** `app/page.tsx` is an async Server Component (`revalidate =
3600`) that runs `buildQuery(DEFAULT_FILTERS, …)` + `fetchBrowseMeta()` from `lib/browse.ts`
next to nothing is client-fetched on first load — the client seeds from server props and
**skips the first fetch** (`skipNextFetch` ref). Note the DB is now ~200 ms away
(us-east-1 from the box) instead of sub-ms iad1 — ISR absorbs this for browse (renders
hourly, not per-request); dynamic pages pay it per query. Browse queries select only
`BROWSE_COLS`, `count: 'estimated'`; infinite-scroll offsets by `items.length`.
