# Database (Supabase) — schema, migrations, indexes, RPCs


Key tables:
- `flashlights` — main product table. **RLS enabled, public SELECT policy `public read flashlights` (`using (true)`); no write policy → anon/authenticated can read but not write** (writes go through the service role, which bypasses RLS). This closed a real hole: anon/authenticated held INSERT/UPDATE/DELETE grants while RLS was off, so the public anon key could mutate the table via PostgREST (migration `enable_rls_public_read_flashlights_images_reviews`). Same fix applied to `flashlight_images` and `reviews`. Key columns:
  - specs: `max_lumens`, `min_lumens`, `beam_distance_m`, `candela` (int, beam intensity cd), `beam_type`, `emitter` (legacy text), `emitters` (text[]), `led_count` (int, number of LEDs), `driver_type` (text, e.g. Buck/Boost/FET/Linear), `battery_type` (legacy text), `battery_count` (legacy int), `battery_types` (text[]), `battery_options` (jsonb `[{type,count}]`), `charging_type`, `has_usb_charging`, `length_mm`, `head_diameter_mm`, `body_diameter_mm`, `weight_g`, `material`, `ip_rating`, `impact_resistance_m`, `category`, `price_usd`, `year`
  - content: `image_url` (Vercel Blob URL), `slug`, `notes`, `manual_url` (legacy), `manual_urls` (text[]), `description`, `is_discontinued`
  - soft delete: `deleted_at` (timestamptz, null = live). Set = **in Trash / unpublished** — hidden from EVERY public read (browse, detail SSG + `generateStaticParams`, brand pages, top, compare, sitemap, llms.txt, contribute search, `/u`, and the `get_distinct_brands/emitters` RPCs all filter `.is('deleted_at', null)`). Purged permanently (DB rows + Blob assets) 30 days later. Migration: `alter table flashlights add column if not exists deleted_at timestamptz; create index if not exists idx_flashlights_deleted_at on flashlights(deleted_at);`. **When adding a new public flashlights query, remember to add `.is('deleted_at', null)`.**
  - ordering: `sort_seed` (double precision, default `random()`) — backs the **Random** browse sort (the default). Reshuffled nightly by a pg_cron job `reshuffle-flashlights` (`0 17 * * *` UTC = midnight Vietnam) so the order rotates daily. Browse orders by `sort_seed` then `id` (tie-break).
  - attribution: `updated_by` (uuid → auth.users) = the admin/mod who approved; `submitted_by` (uuid → profiles) = the original contributor. Both set on approval in `/api/admin/submissions`. On approval, `updated_at` (and `created_at` for a `new`) is set to the **submission's `created_at`** (submit time), not the approval time, so the displayed add/update time is when the user submitted.
- `flashlight_images` — extra images per flashlight (`url`, `sort_order`)
- `reviews` — review links per flashlight (`title`, `reviewer`, `url`, `type`, `summary`, `published_at`). Editable in the contribute/edit form: paste a URL → `/api/fetch-review-meta` (server-side, auth-gated, SSRF-guarded) fetches the og/JSON-LD `title` + published date, prefilled and editable. Multiple links per light. Stored as `_reviews` in the submission `data` and applied **replace-all** on approval (the edit form always loads existing reviews first, so nothing is lost). Detail page renders Reviews **below** the User manual, newest first (icon + title + date + link).
- `user_wishlists` — `(user_id, flashlight_id)` — RLS: user sees own rows only
- `user_collections` — `(user_id, flashlight_id, purchase_price, material, color, purchase_date, quantity)` — RLS: user sees own rows only
- `profiles` — `(id, nickname, is_admin, is_moderator, show_collection, updated_at)` — RLS: public SELECT, owner INSERT/UPDATE. Nickname: letters/numbers/`-`/`_` only, 3–20 chars (`nickError`), unique, **permanent once set**. Real-time availability check (debounced) on the input. A profile row is **created lazily** (no signup DB trigger): either when the user sets a nickname in My Account, or auto-created on first sign-in from a username chosen at sign-up (stored in `auth.users.user_metadata.username`; `auth-context.fetchLists` upserts it — silently skips if the name was taken meanwhile). So `auth.users` can exceed `profiles` (an account that never finished onboarding); the homepage count uses `public_user_count()` to count the former. `is_admin` / `is_moderator` control access — set via SQL. `show_collection` (bool, default false): when on, the user's collection appears on their public `/u/[nickname]` page (flashlight + quantity only — never price/date); toggled in My Account → Profile.
- `settings` — `(key, value)` — site-wide config. Keys: `ga_measurement_id`, `ga_enabled`. **RLS: public SELECT, admin-only write** (AdminDashboard writes with the admin's session via the anon client; the policy enforces `profiles.is_admin`). Service role (API routes) bypasses RLS.
- `brands` — `(name pk, country, made_in, founded_year, headquarters, website, about, logo_url, created_at, updated_by, updated_at, deleted_at)`. `deleted_at` = brand trash (see Delete/Trash below); the brand metadata reads (`brands/page.tsx`, `brand/[slug]`, `lib/browse` made-in) filter `.is('deleted_at', null)`. Brand pages/index also disappear automatically once a brand has no live products. Migration: `alter table brands add column if not exists deleted_at timestamptz;` — per-brand metadata (brand's origin country + where products are made). `updated_by`/`updated_at` drive the "Added by / Updated by" footer on brand pages (same logic as flashlights: updated_by null = system). RLS: public SELECT. `name` must match `flashlights.brand` exactly. Detail page looks it up by brand name and shows "Brand Origin" / "Made In". Also powers the **"Made in" browse filter** — BrowsePage loads `brands(name, made_in)` into the meta cache and resolves a selected country to the matching brand names (`.in('brand', …)`, since `made_in` isn't a flashlights column). Managed centrally (SQL/script), not via the contribute form.
- `flashlight_submissions` — user-submitted new flashlights or edits. `type` (new|edit|**delete**), `status` (pending|approved|rejected), `target_id` (flashlight being edited/deleted), `data` (jsonb), `user_id`. A `delete` row = a mod's **suggest-delete** request (see Delete/Trash); approving it soft-deletes the target. (`data_change_log` only counts new|edit.)
- `submission_images` — images attached to a submission (`url`, `sort_order`, `is_primary`)
- `recovery_codes` — hashed 2FA recovery codes per user (`code_hash`, `used_at`)

**Migration — `profiles.show_collection`** (run once if missing; DDL must be run in the Supabase SQL editor — the REST/service key can't run ALTER):
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_collection boolean NOT NULL DEFAULT false;
```

**Migration — `brands` table** (run once in Supabase SQL editor):
```sql
CREATE TABLE IF NOT EXISTS brands (
  name text PRIMARY KEY,
  country text,
  made_in text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read brands" ON brands;
CREATE POLICY "public read brands" ON brands FOR SELECT USING (true);

INSERT INTO brands (name, country, made_in) VALUES
  ('Acebeam', 'China', 'China'),
  ('Imalent', 'China', 'China'),
  ('Weltool', 'China', 'China'),
  ('Malkoff', 'USA', 'USA'),
  ('SureFire', 'USA', 'USA'),
  ('LED Lenser', 'Germany', 'China')
ON CONFLICT (name) DO UPDATE SET country = EXCLUDED.country, made_in = EXCLUDED.made_in;
```

**Migration — brand attribution + review post-date** (run once in Supabase SQL editor):
```sql
ALTER TABLE brands  ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE brands  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS published_at timestamptz;
```

**Migration — contributor attribution** (run once in Supabase SQL editor):
```sql
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id);
```

**Migration — random browse sort + nightly reshuffle** (run once in Supabase SQL editor; needs the `pg_cron` extension enabled in Dashboard → Database → Extensions):
```sql
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS sort_seed double precision DEFAULT random();
UPDATE flashlights SET sort_seed = random() WHERE sort_seed IS NULL;
CREATE INDEX IF NOT EXISTS idx_flashlights_sort_seed ON flashlights (sort_seed);
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('reshuffle-flashlights', '0 17 * * *', $$update flashlights set sort_seed = random()$$);
```

**Migration — lock down `settings` writes (RLS)** (run once in Supabase SQL editor):
```sql
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings read" ON settings;
CREATE POLICY "settings read" ON settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "settings admin write" ON settings;
CREATE POLICY "settings admin write" ON settings FOR ALL
  USING      (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
```

**Note on emitters:** `emitter` (text) is legacy. `emitters` (text[]) is canonical — always use for filtering and display.

**Note on batteries:** `battery_type`/`battery_count` (single value) are legacy. Canonical is `battery_options` (jsonb array of `{type, count}` — supports lights that take alternatives, e.g. `2× 18350` OR `1× 18650`) plus `battery_types` (text[], the distinct sizes, used by the `.overlaps()` filter). Forms write all four (legacy fields mirror `battery_options[0]`). Display via `formatBatteries()` in `lib/battery.ts` (joins alternatives with ` / `; pass `withCount: false` for compact card display). Migration (run once in Supabase SQL editor — REST can't run ALTER):
```sql
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS battery_options jsonb DEFAULT '[]';
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS battery_types text[] DEFAULT '{}';
UPDATE flashlights
SET battery_options = jsonb_build_array(jsonb_build_object('type', battery_type, 'count', COALESCE(battery_count, 1))),
    battery_types   = ARRAY[battery_type]
WHERE battery_type IS NOT NULL AND (battery_options IS NULL OR battery_options = '[]');
```

**Emitter naming convention** (so duplicates don't fragment the `get_distinct_emitters` filter list):
- Brand name in **proper case**, never ALL-CAPS: `Cree` (not CREE), `Luxeon` (not LUXEON), `Luminus`, `Nichia`, `Osram`. Always include the brand prefix (`Luminus SST-36R`, not bare `SST-36R`).
- Cree **XHP** series gets a hyphen: `Cree XHP-70.2`, `Cree XHP-70.3 HI`, `Cree XHP-50.3 HI`. XP-series already hyphenated: `Cree XP-L`, `Cree XP-LR`.
- Luminus series hyphenated: `Luminus SFT-90X`, `Luminus SST-20`, `Luminus SBT-90.3`.
- LEP / laser lights use emitter `LEP`. Other (non-LEP) lasers are just `Laser` (no colour, e.g. not "Green Laser").
- Generic non-model light sources are collapsed so the filter list stays tidy: `UV` (package-named UV with no wavelength; keep `UV 365nm` / `UV 395nm` when known), `IR` (no wavelength), `HID`, `Xenon`, `RGB`. **Weltool** lights carry **no** emitter (their house "X-LED" isn't a real model).
- To normalize after a bad import, extend `EMITTER_MAP` (renames) / `EMITTER_REMOVE` (drop a value) in `scripts/normalize-emitters.mjs` and re-run, then force-clear cache (or just redeploy).
- The contribute/edit form's LED field (`components/submit/EmitterInput.tsx`) type-aheads from `get_distinct_emitters`, so contributors reuse existing names — keep the DB list clean and the suggestions stay clean.

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

**RPC functions** (run once if missing):
```sql
CREATE OR REPLACE FUNCTION get_distinct_emitters()
RETURNS TABLE(emitter text) LANGUAGE SQL AS $$
  SELECT DISTINCT unnest(emitters) AS emitter FROM flashlights WHERE cardinality(emitters) > 0 ORDER BY emitter;
$$;

CREATE OR REPLACE FUNCTION get_distinct_brands()
RETURNS TABLE(brand text) LANGUAGE SQL AS $$
  SELECT DISTINCT brand FROM flashlights WHERE brand IS NOT NULL ORDER BY brand;
$$;
```

**`admin_mfa_user_ids()`** (migration `admin_mfa_user_ids_rpc`) — returns the user ids with a verified MFA factor, read from `auth.mfa_factors`. `SECURITY DEFINER`, **execute granted to `service_role` only** (anon/authenticated revoked). The admin Users panel uses it because `auth.admin.listUsers()` does **not** reliably populate per-user `factors` (it was always showing "No 2FA"). The route also derives a `verified` flag from `email_confirmed_at` to badge unactivated accounts.

**`flashlight_change_log(p_slug)` + `brand_change_log(p_brand)`** (migrations `per_entity_change_log_rpcs`, then `change_log_use_submit_time_and_staff_flag`) — power the public **"Change history"** section on each flashlight detail page and each brand page (`components/ChangeLog.tsx`, newest-first, collapses past 5 with "See more"). Same source/`SECURITY DEFINER`/anon-grant pattern as `data_change_log`: approved `flashlight_submissions` (+ `brand_submissions` for the brand version) resolved to who/when. `flashlight_change_log` returns that one light's create/edit events; `brand_change_log` returns the brand's create/edit events **plus** every flashlight create/edit under that brand (each row carries `model`/`slug` to link). **`ts` is the submission's `created_at` (when the user submitted), not `reviewed_at`** — a light can sit in the queue for hours. Each row also returns **`is_staff`** (submitter's `is_admin OR is_moderator`); `ChangeLog` renders staff in amber and regular users in strong grey. System-seeded rows have no submission, so the pages append a synthetic "added · system · created_at" base entry. (Return type changed, so the migration `DROP`s + recreates both and re-`GRANT`s execute to anon/authenticated.)

**`data_change_log(p_limit, p_offset)` + `data_change_log_count()`** (migration `data_change_log_rpc`) — power the **`/data-log` (Database updates)** page. `SECURITY DEFINER` (so they can read RLS-protected `flashlight_submissions` / `brand_submissions` and expose only safe public fields), `GRANT EXECUTE TO anon`. They UNION approved flashlight submissions (`new`→`added`, `edit`→`edited`; slug resolved via `target_id`, else by brand+model, else `data->>'slug'`) and approved brand submissions (first-for-that-brand → `created brand`, else `updated brand`), join `profiles` for the nickname, newest first. System-seeded flashlights have no submission row so they are naturally excluded. Page size 500, paginated with `?page=`.

**`public_user_count()`** (migration `public_user_count_rpc`) — returns the count of real auth accounts for the homepage "X users" headline. `SECURITY DEFINER` + `GRANT EXECUTE TO anon` because the anon client can't read `auth.users`; counts `auth.users` excluding soft-deleted (`deleted_at`) and currently-banned (`banned_until`). Used by `fetchBrowseMeta` instead of a `profiles` count so unfinished signups still count.


## Database Migration (future reference)

To migrate Supabase to a new region without losing users, use the CLI:
```bash
npm install -g supabase
supabase login          # needs access token from supabase.com/dashboard/account/tokens
supabase link --project-ref <old-project-ref>
supabase db dump --file backup.sql   # includes auth.users with password hashes
# create new project, then:
supabase link --project-ref <new-project-ref>
supabase db restore --file backup.sql
```
Users only need to sign in again (sessions expire), passwords are preserved.

**Do NOT use the JS API to migrate users** — the API does not expose password hashes.

