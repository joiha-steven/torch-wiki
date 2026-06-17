# Caching strategy

## Caching Strategy

| Page type | Cache | Cleared by |
|---|---|---|
| `/[slug]` flashlight pages | Static (SSG) — served from Vercel edge | Deploy · Admin approves submission · Force clear button |
| `/` browse page | **ISR `revalidate = 3600`** — server renders the first 32 cards + filter meta next to the DB (iad1), ships them in the HTML; client takes over for filter/scroll | Deploy · hourly revalidate |
| `/my` `/account` `/contribute` `/compare` `/report` | `force-dynamic` — never cached | Always fresh |
| Brand/emitter filter lists | Server-seeded on first load (ISR 1h); localStorage 5 min TTL on client navigation | Auto-expire · Admin approve/force-clear clears immediately |

**Vercel Cron:** `vercel.json` schedules `/api/ping` daily at 08:00 UTC — queries DB to prevent Supabase free tier from pausing.

**On-demand revalidation flow:**
- Admin approves an **edit** → `revalidatePath('/slug')` clears that one page instantly
- Admin approves a **new** flashlight → `revalidatePath('/', 'layout')` clears browse
- Admin edits DB directly (Supabase Table Editor) → use **"Force clear cache"** button in `/admin` to clear all flashlight pages at once
- Every **deploy** → Vercel rebuilds all static pages automatically

**Browse first-paint (perf):** `app/page.tsx` is an async Server Component (`revalidate = 3600`) that runs `buildQuery(DEFAULT_FILTERS, …)` + `fetchBrowseMeta()` from `lib/browse.ts` at iad1 (same region as Supabase, sub-ms) and passes `initialItems`/`initialCount`/`initialMeta` into `BrowsePage`. The client seeds its state from those props and **skips the first fetch** (`skipNextFetch` ref) — no client round-trip to the DB on first load (was the root cause of the slow FCP when testing from far away). Browse queries select only `BROWSE_COLS` (the columns the card renders), never `select('*')` — ~⅓ the old payload. Counts use `count: 'estimated'` (exact for this small table, no full scan). Infinite-scroll `loadMore` offsets by `items.length` (not `page × size`) so a server-seeded 32 + a client `pageSize` of 16 never overlap. `brands`/`emitters` lists fall back to **localStorage (5 min)** only on client navigation.

