@AGENTS.md

# Torch EDC.wiki — Project Overview

Flashlight database web app. Live at **https://torch.edc.wiki**.

> New here? Read **`ARCHITECTURE.md`** first for the high-level map (stack, directory
> layout, request/data flow, subsystems). This file is the **operating manual**: the rules
> every change must follow, a schema summary, and pointers into `docs/` for deep detail.

**Licensing (layered):** code → MIT (`LICENSE`); original content & data compilation → CC BY 4.0 (`LICENSE-CONTENT.md`, incl. sui generis database right); factual specs → not copyrightable; product images → property of their manufacturers, non-commercial reference use only, **never CC-licensed**, notice-and-takedown. Keep the "non-commercial reference project, not affiliated with any brand" framing (it's the fair-use shield for brand images). Footer (in `BrowsePage.tsx`) and README carry the dual CC BY 4.0 / MIT notice.

## Definition of Done (every change)

A change is **not finished** until all of these hold. Run the gate, don't eyeball it.

1. **`npm run pre-deploy` passes** — build · typecheck · lint · unit tests · zero `any` · every source file ≤400 lines. (One command runs them all.)
2. **Docs updated** — new table/column → `docs/database.md`; new env var → **Environment Variables** below; new component/route → `docs/code-map.md`; new gotcha → `06_Wiki/gotchas.md` (workspace).
3. **Changelog updated in the SAME push** — add today's item to `app/log/updates-data.ts` (one entry per calendar day; the `/log` page renders it).
4. **New pure `lib/` function → unit test; bug fix in tested code → regression test.**
5. **New user-facing page/endpoint → add its URL to `scripts/smoke.mjs`.**
6. **Pushed to `main`, then verified on prod** — `npm run smoke` (and curl the changed URL); don't trust the deploy alone. If Vercel didn't auto-build: `npx vercel --prod --yes`.

## Where to read more (`docs/`)

| Topic | File |
|-------|------|
| Full DB schema, every migration SQL, indexes, RPCs, emitter naming | `docs/database.md` |
| Auth flow, 2FA, user profiles, contributions, admin queue | `docs/auth-admin-contrib.md` |
| Security posture (auth, uploads, SSRF, headers) | `docs/security.md` |
| Image optimization + Vercel cost, blob workflow, scripts | `docs/images.md` |
| Caching strategy + browse first-paint + revalidation | `docs/caching.md` |
| Page structure, filters, color system, light/dark theming, materials | `docs/ui.md` |
| PWA / installable app | `docs/pwa.md` |
| Per-file index of components, pages & API routes | `docs/code-map.md` |
| Flashlight domain terms (emitter, candela, throw, CRI…) | `docs/glossary.md` |

## Tech Stack

- **Next.js 16.2.6** — App Router, Turbopack, TypeScript
- **Tailwind CSS v4** — custom `brand-*` color scale (`#eba00b`) defined in `app/globals.css` via `@theme`
- **Supabase** — PostgreSQL database (region: **us-east-1, North Virginia** — same region as Vercel iad1). Anon key for reads, service role key for writes in scripts.
- **Vercel Blob** — image storage with global CDN
- **Vercel** — hosting, Analytics (`@vercel/analytics`). Function region: `iad1` (US East, set in `vercel.json`). **No Speed Insights** — `@vercel/speed-insights` was removed on purpose (billed; don't re-add).
- **Supabase Auth** — email/password + TOTP 2FA
- **Cloudflare Turnstile** — captcha on signup, forgot password, and contribution forms

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
CRON_SECRET=...         # required for the daily trash auto-purge cron (/api/cron/purge-trash). Set this in Vercel → Vercel sends it as `Authorization: Bearer <CRON_SECRET>`; without it that route returns 503 (the admin Trash view still purges expired items opportunistically).
NEXT_PUBLIC_CDN_DOMAIN=...  # optional: Cloudflare CDN proxy for Blob PDF URLs (lib/cdn.ts). Unset → serves the raw Blob URL.
ADMIN_EMAIL=...             # optional server-side fallback for NEXT_PUBLIC_ADMIN_EMAIL in the bootstrap admin check (lib/verify-admin.ts).
```

**After `vercel env pull`:** re-add Supabase keys manually — Vercel pull only restores Blob + OIDC tokens.

## Rules (MUST follow for every change)

Enforced partly by tooling: `.husky/pre-commit` runs `lint-staged` (eslint --fix on
staged `*.ts/*.tsx`) then `npm run typecheck` (`tsc --noEmit`) — a commit is blocked
if either fails. `npm run smoke` checks prod endpoints; `npm run health` is the daily summary;
`npm run audit-rls` is a weekly Supabase RLS check (one-time setup: run `scripts/audit-rls.sql`).
API routes validate input via the shared helpers in `lib/validate.ts` (`readJson`/`isUuid`/`isEmail`/`isStr`/`bad`…).

### Type Safety
1. No `any` type. Use a proper type, or `unknown` + a type guard. (Codebase is at 0 — keep it there.)
2. Function parameters and API route handlers have explicit request/response types.

### Input Validation
3. Every API route validates input before processing: required fields exist, types/ranges/lengths checked, UUID/email format where relevant. Return `400` with a clear message on failure.
4. Never trust client data — validate server-side. (Admin routes: `verify-admin.ts` first, before anything else.)

### Security
5. Service-role key never appears in client-side code. Queries go through the Supabase client (parameterized) — never string-concatenated SQL.
6. User-uploaded / user-authored content is sanitized before storage.

### Code Quality
7. Prefer files under ~400 lines; split oversized files into components. As of 2026-06-14 every source file is ≤400 — the former offenders were split: `AdminDashboard`→`components/admin/*`, `SubmitFlashlightForm`→`components/submit/*`, `account/page`→`components/account/*`. Keep it that way.
8. Every mutation (INSERT/UPDATE/DELETE) is in try/catch with a user-friendly error message.
9. No dead code — delete instead of commenting out (git history preserves it).
10. New user-facing pages/endpoints get a URL added to `scripts/smoke.mjs`.

### Commit Discipline
11. Keep commits focused (≈5 source files). Don't mix a DB schema change + API route + frontend in one commit — schema changes get their own commit with the migration SQL in the message.
12. Commit messages say WHAT changed and WHY (not "update"/"fix").

### Documentation
13. New table/column → `docs/database.md`. New env var → **Environment Variables** above. New component/route → `docs/code-map.md`. New gotcha → `06_Wiki/gotchas.md` (workspace repo).
14. **Write all docs/`.md`/code-comments terse, for AI not humans** (owner never reads them; uses Claude Code 100%). Dense facts, tables/lists/keywords, no decorative or "why-it-matters" prose. Comments: keep only load-bearing gotchas, drop obvious narration. Exception: **user-facing text stays human** — `/log` changelog, `/guide`, error messages, UI copy.

## Testing

- Framework: **Vitest** (unit tests only, `environment: 'node'` — no DOM/React plugin installed by design).
- Run: `npm test` (single run) · `npm run test:watch` (dev) · `npm run test:coverage`.
- Scope: **pure functions in `lib/`** (validators, formatters, slug/url helpers). Component tests were deliberately skipped — UI components pull in the Supabase client + auth context and need heavy, brittle mocking for low return. To add them later: install `jsdom`, `@vitejs/plugin-react`, `@testing-library/react`, and flip `environment` to `jsdom` in `vitest.config.ts`.
- **Every new pure function** in `lib/` should get unit tests; **every bug fix** in tested code should add a regression test.
- Test files live in `tests/` mirroring source: `tests/lib/validate.test.ts` → `lib/validate.ts`. Import from the real module (`@/lib/...`), test edge cases not just the happy path.
- Tests run on **every commit** (`.husky/pre-commit`: lint-staged → typecheck → `npm test --reporter=dot --bail=1`) and in the **pre-deploy gate**.

## Pre-Deploy Quality Gate

`npm run pre-deploy` (`scripts/pre-deploy.mjs`) runs all gates in sequence and exits 1 if any fail: **build · typecheck · lint (eslint) · unit tests · zero `any` types · every source file ≤400 lines**. Run it before any non-trivial push. (Smoke is NOT in this gate — it verifies the *deployed* site, so `npm run smoke` runs *after* deploy.)

## Deployment Workflow

Solo-owner project: default is **commit directly to `main` → push → Vercel auto-deploys → `npm run smoke`**. No PR/branch-protection ceremony (no second reviewer; would only add friction). Optional `feat/*` branches give a preview URL for risky/large changes, merged back with `git merge --ff-only`. Full process + **rollback procedures** (Vercel `npx vercel rollback`, `git revert`, DB rollback SQL) are in the workspace doc `06_Wiki/deployment-workflow.md`; the (disabled) branch-protection checklist is in `06_Wiki/branch-protection.md`.

Push to `main` → Vercel auto-deploys to `https://torch.edc.wiki`.

Git remote: `https://TOKEN@github.com/joiha-steven/torch-wiki.git`
(Replace TOKEN with a fresh GitHub Personal Access Token — never commit the token)

Git author:
```bash
git config user.name "Hung Tran"
git config user.email "hung.tran@joiha.com"
```

## Database Schema — summary

Full column lists, all run-once migration SQL, indexes, RPCs and the emitter naming
convention live in **`docs/database.md`**. Quick map of the tables:

| Table | Purpose / key notes |
|-------|---------------------|
| `flashlights` | Main product table. RLS: public SELECT, no write policy (writes via service role). Soft delete via `deleted_at` (null = live). **Any new public read MUST filter `.is('deleted_at', null)`.** `emitters` (text[]) + `battery_options` (jsonb) are canonical; legacy single-value columns kept for back-compat. `sort_seed` backs the random browse order (nightly pg_cron reshuffle). |
| `flashlight_images` | Extra images per light (`url`, `sort_order`). |
| `reviews` | Review links per light (`title`, `url`, `type`, `published_at`). |
| `brands` | Per-brand metadata (`name` pk must match `flashlights.brand`, `country`, `made_in`, …). Soft delete via `deleted_at`. |
| `flashlight_submissions` / `submission_images` | Pending community new/edit/delete contributions + their images. |
| `profiles` | `(id, nickname, is_admin, is_moderator, show_collection)`. Nickname permanent once set. Created lazily. |
| `user_wishlists` / `user_collections` | Per-user saved lists (RLS: owner-only). |
| `settings` | Site config (`ga_*`). RLS: public read, admin write. |
| `recovery_codes` | Hashed 2FA recovery codes. |

**Reminder:** when adding any new public `flashlights` (or `brands`) query, filter `.is('deleted_at', null)` so trashed rows never leak. See `docs/database.md` for the full list of reads that already do.
