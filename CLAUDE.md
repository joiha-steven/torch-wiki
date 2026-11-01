@AGENTS.md

# Torch EDC.wiki — Project Overview

Flashlight database web app. Live at **https://torch.edc.wiki**.

> New here? Read **`ARCHITECTURE.md`** first for the high-level map (stack, directory
> layout, request/data flow, subsystems). This file is the **operating manual**: the rules
> every change must follow, a schema summary, and pointers into `docs/` for deep detail.

**Licensing (layered):** code → MIT (`LICENSE`); original content & data compilation → CC BY 4.0 (`LICENSE-CONTENT.md`, incl. sui generis database right); factual specs → not copyrightable; product images → property of their manufacturers, non-commercial reference use only, **never CC-licensed**, notice-and-takedown. Keep the "non-commercial reference project, not affiliated with any brand" framing (it's the fair-use shield for brand images). Footer (in `FilterPanel.tsx`) and README carry the dual CC BY 4.0 / MIT notice.

## Definition of Done (every change)

A change is **not finished** until all of these hold. Run the gate, don't eyeball it.

1. **`npm run pre-deploy` passes** — build · typecheck · lint · unit tests · zero `any` · every source file ≤400 lines. (One command runs them all.)
2. **Docs updated** — new table/column → `docs/database.md`; new env var → `MAP.md`; new component/route → `docs/code-map.md`; new gotcha → `06_Wiki/gotchas.md` (workspace).
3. **Changelog updated in the SAME push** — add today's item to `app/log/updates-data.ts` (one entry per calendar day; the `/log` page renders it).
4. **New pure `lib/` function → unit test; bug fix in tested code → regression test.**
5. **New user-facing page/endpoint → add its URL to `scripts/smoke.mjs`.**
6. **Pushed to `main`, deployed (`torch-deploy.sh` on the box — see Deployment Workflow), then verified on prod** — `npm run smoke` (and curl the changed URL); don't trust the deploy alone.

## Where to read more

`MAP.md`: docs index (`docs/*.md`), env var list, table summary. `HISTORY.md`: incidents and hosting moves. Working flow and workspace folders: skill `torch-flow`. Architecture: `ARCHITECTURE.md`.

## Tech Stack

- **Next.js 16.2.6** — App Router, Turbopack, TypeScript
- **Tailwind CSS v4** — custom `brand-*` color scale (`#eba00b`) defined in `app/globals.css` via `@theme`
- **Supabase** — PostgreSQL database (region: **us-east-1, North Virginia**; ~200 ms from the origin box — ISR absorbs it for reads). Anon key for reads, service role key for writes in scripts.
- **File storage: local disk** (`/home/torch/files`, served by nginx at `/files/`, 1y immutable) via `lib/storage.ts` (`STORAGE_DRIVER=local`). Vercel Blob is the legacy backend (driver default when unset); the old store is no longer referenced by the DB (see `HISTORY.md`).
- **Hosting: self-hosted on `sv3-usa` `209.50.62.147`** (UpCloud us-sjo1, 2 vCPU / 4 GB). systemd `torch-wiki.service` (`next start -p 3300`, capped `MemoryMax=1200M CPUQuota=200%`), nginx vhost, **Cloudflare proxied** (origin firewall = CF IPs only; origin TLS self-signed, CF SSL mode Full). Crons in `/etc/cron.d/torch-wiki` (vercel.json crons are legacy). Analytics: GA only.
- **Supabase Auth** — email/password + TOTP 2FA
- **Cloudflare Turnstile** — captcha on signup, forgot password, and contribution forms

## Environment Variables

Full list with meanings: `MAP.md`. Real values live only in `/home/torch/app/.env.production` on the box (and `.env.local`, never committed). Vercel env is unrecoverable (all Sensitive).

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
7. **Every source file ≤400 lines (hard gate). When a file approaches the cap, SPLIT it — never trim comments / blank lines to squeeze under.** Gaming the number is forbidden; the cap exists to keep files small enough for an AI to load and edit cheaply/accurately as the project grows. **The project scales by adding files, not by growing them.** Split via these seams, in order: ① extract a UI section into its own component (`components/<area>/*`); ② extract stateful logic into a hook (`use*`) so the component is thin JSX; ③ extract pure helpers into `lib/`; ④ extract constants/config/types into their own file. The big file becomes a thin orchestrator that composes the small ones.
8. Every mutation (INSERT/UPDATE/DELETE) is in try/catch with a user-friendly error message.
9. No dead code — delete instead of commenting out (git history preserves it).
10. New user-facing pages/endpoints get a URL added to `scripts/smoke.mjs`.

### Commit Discipline
11. Keep commits focused (≈5 source files). Don't mix a DB schema change + API route + frontend in one commit — schema changes get their own commit with the migration SQL in the message.
12. Commit messages say WHAT changed and WHY (not "update"/"fix").

### Documentation
13. New table/column → `docs/database.md`. New env var → `MAP.md`. New component/route → `docs/code-map.md`. New gotcha → `06_Wiki/gotchas.md` (workspace repo).
14. **Every file is written in English, for AI — never the owner.** Owner doesn't code; the project is maintained 100% via Claude Code and the owner only ever reads the **shipped frontend**. So all code, comments, docs, `.md`, commit messages, identifiers, test names, and workspace notes are **English** (so any AI model parses them cleanly) and **terse**: dense facts, tables/lists/keywords, no decorative or "why-it-matters" prose; comments keep only load-bearing gotchas, drop obvious narration. **Only exception — human-facing surfaces stay human and may be localized:** the shipped UI copy, `/log` changelog, `/guide`, `/privacy`, `/terms`, error messages. (Never write Vietnamese or other non-English text inside repo files; chat with the owner is separate and stays in his language.)

## Testing

- Framework: **Vitest** (unit tests only, `environment: 'node'` — no DOM/React plugin installed by design).
- Run: `npm test` (single run) · `npm run test:watch` (dev) · `npm run test:coverage`.
- Scope: **pure functions in `lib/`**. Component tests deliberately skipped (heavy mocking, low return); to add them: `jsdom`, `@vitejs/plugin-react`, `@testing-library/react`, flip `environment` in `vitest.config.ts`.
- **Every new pure function** in `lib/` should get unit tests; **every bug fix** in tested code should add a regression test.
- Test files live in `tests/` mirroring source: `tests/lib/validate.test.ts` → `lib/validate.ts`. Import from the real module (`@/lib/...`), test edge cases not just the happy path.
- Tests run on **every commit** (`.husky/pre-commit`: lint-staged → typecheck → `npm test --reporter=dot --bail=1`) and in the **pre-deploy gate**.

## Pre-Deploy Quality Gate

`npm run pre-deploy` (`scripts/pre-deploy.mjs`) runs all gates in sequence and exits 1 if any fail: **build · typecheck · lint (eslint) · unit tests · zero `any` types · every source file ≤400 lines**. Run it before any non-trivial push. (Smoke is NOT in this gate — it verifies the *deployed* site, so `npm run smoke` runs *after* deploy.)

## Deployment Workflow

**Self-hosted** on **`sv3-usa` `209.50.62.147`**, behind Cloudflare (orange
cloud REQUIRED — the box firewall only accepts Cloudflare IPs on 80/443). Vercel no longer
serves the site; do NOT `vercel --prod`.

Solo-owner project: commit directly to `main` → push → deploy to the box → `npm run smoke`.
Deploy = ONE command (blue-green, near-zero downtime — the live slot keeps serving while
the idle slot builds, then a symlink swap + ~2s restart):
```bash
ssh -i ~/.ssh/id_ed25519_jellykey root@209.50.62.147 /usr/local/bin/torch-deploy.sh
```
The script (`/usr/local/bin/torch-deploy.sh`) owns the gotchas: it always builds from a
clean `.next` (Next's build cache persists fetched DB data across builds and silently ships
stale content — bit us at cutover), alternates `/home/torch/slot-a|slot-b` behind the
`/home/torch/current` symlink (systemd WorkingDirectory), copies env from the canonical
`/home/torch/app-env/.env.production` (chmod 600), and prewarms key pages. NEVER build in
the live slot — that's what caused a restart-loop outage window on 2026-08-13. Rollback:
`git revert` + redeploy (or point `current` back at the previous slot and restart). Vercel
env vars are all `Sensitive` and cannot be pulled back; `app-env/.env.production` is the
single source of truth — back it up before editing.

**NEVER point `torch.edc.wiki` to `127.0.0.1` in the server's `/etc/hosts`**: Next's image SSRF guard then returns 400 on every `/_next/image`. When checking images, use FRESH URLs from the HTML, not a cached one (nginx `torch_img` caches 30 days). Story and the check command: `HISTORY.md`.

Git author:
```bash
git config user.name "Hung Tran"
git config user.email "hung.tran@joiha.com"
```

## Database

Table summary: `MAP.md`; full schema: `docs/database.md`. **Any new public read on `flashlights` or `brands` MUST filter `.is('deleted_at', null)`** so trashed rows never leak.
