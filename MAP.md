# MAP — torch-wiki

File map, env vars and table summary, moved out of `CLAUDE.md` (not loaded automatically). Keep it current: new table/column, env var, component or route is recorded here or in `docs/`.

## Where to read more (`docs/`)

| Topic | File |
|-------|------|
| Full DB schema, every migration SQL, indexes, RPCs, emitter naming | `docs/database.md` |
| Auth flow, 2FA, user profiles, contributions, admin queue | `docs/auth-admin-contrib.md` |
| Security posture (auth, uploads, SSRF, headers) | `docs/security.md` |
| Image/PDF storage, optimization, caching layers, seeding workflow | `docs/images.md` |
| Caching strategy + browse first-paint + revalidation | `docs/caching.md` |
| Page structure, filters, color system, light/dark theming, materials | `docs/ui.md` |
| PWA / installable app | `docs/pwa.md` |
| Per-file index of components, pages & API routes | `docs/code-map.md` |
| Flashlight domain terms (emitter, candela, throw, CRI…) | `docs/glossary.md` |


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
NEXT_PUBLIC_ADMIN_EMAIL=...
REVALIDATE_SECRET=...   # shared secret for /api/revalidate from scripts/curl (any long random string)
CRON_SECRET=...         # required for the daily trash auto-purge cron (/api/cron/purge-trash). /etc/cron.d/torch-wiki on the box sends it as `Authorization: Bearer <CRON_SECRET>`; without it that route returns 503 (the admin Trash view still purges expired items opportunistically).
NEXT_PUBLIC_CDN_DOMAIN=...  # optional: Cloudflare CDN proxy for Blob PDF URLs (lib/cdn.ts). Unset → serves the raw Blob URL.
ADMIN_EMAIL=...             # optional server-side fallback for NEXT_PUBLIC_ADMIN_EMAIL in the bootstrap admin check (lib/verify-admin.ts).
STORAGE_DRIVER=...          # 'local' → files on disk via lib/storage.ts (self-host, the live setup); unset → Vercel Blob (legacy).
NEXT_PUBLIC_STORAGE_DRIVER=... # mirror of STORAGE_DRIVER for the client bundle (lib/upload-client.ts); set both together.
FILES_ROOT=...              # local driver: directory that holds stored files (default /home/torch/files). Outside the app dir on purpose.
FILES_PUBLIC_BASE=...       # local driver: public URL prefix nginx serves FILES_ROOT at, e.g. https://torch.edc.wiki/files
```

**Vercel env is unrecoverable** (all vars marked Sensitive — pull returns `[SENSITIVE]`, dashboard can't display them). Real values live in `/home/torch/app/.env.production` on the box; service-role key is re-fetchable via `npx supabase projects api-keys --project-ref uomhdtzlexevzkffnnfp` after `supabase login`; Turnstile keys from the Cloudflare dashboard.

## Database Schema — summary

Full column lists, all run-once migration SQL, indexes, RPCs and the emitter naming
convention live in **`docs/database.md`**. Quick map of the tables:

| Table | Purpose / key notes |
|-------|---------------------|
| `flashlights` | Main product table. RLS: public SELECT, no write policy (writes via service role). Soft delete via `deleted_at` (null = live). **Any new public read MUST filter `.is('deleted_at', null)`.** `emitters` (text[]), `battery_options` (jsonb) + `materials` (jsonb, structured material/finish/colour) are canonical; legacy single-value columns (`emitter`, `battery_type`, `material`) kept for back-compat/display fallback. `sort_seed` backs the random browse order (nightly pg_cron reshuffle). |
| `flashlight_images` | Extra images per light (`url`, `sort_order`). |
| `reviews` | Review links per light (`title`, `url`, `type`, `published_at`). |
| `brands` | Per-brand metadata (`name` pk must match `flashlights.brand`, `country`, `made_in`, …). Soft delete via `deleted_at`. |
| `flashlight_submissions` / `submission_images` | Pending community new/edit/delete contributions + their images. |
| `profiles` | `(id, nickname, is_admin, is_moderator, show_collection)`. Nickname permanent once set. Created lazily. |
| `user_wishlists` / `user_collections` | Per-user saved lists (RLS: owner-only). |
| `settings` | Site config (`ga_*`). RLS: public read, admin write. |
| `recovery_codes` | Hashed 2FA recovery codes. |

**Reminder:** when adding any new public `flashlights` (or `brands`) query, filter `.is('deleted_at', null)` so trashed rows never leak. See `docs/database.md` for the full list of reads that already do.
