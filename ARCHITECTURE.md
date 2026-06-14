# Architecture — torch.EDC.wiki

A high-level map of how the app is put together. This is the **living overview**;
the source code is the truth, and deeper specifics live elsewhere:

- **`CLAUDE.md`** — DB schema, conventions, design system, caching rules (source of truth for details).
- **`AGENTS.md`** — this is a customized Next.js 16 build; read `node_modules/next/dist/docs/` before Next-specific code.
- **`SCRAPING.md`** — data-import/scraping notes. **`README.md`** — project intro + licensing.

> Keep this file high-level and current. Don't document individual functions here —
> they rot; describe structure and flow, and let the code speak for specifics.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** App Router, **Turbopack**, TypeScript, React 19 |
| Styling | **Tailwind CSS v4** (`@theme` in `app/globals.css`; `brand-*` amber scale; "Liquid Glass" design) |
| Data | **Supabase** — Postgres + Auth (email/pwd + TOTP 2FA) + RLS. Region `us-east-1` |
| Files | **Vercel Blob** (images + manual PDFs), global CDN |
| Hosting | **Vercel** — functions `iad1`, Analytics. Captcha: **Cloudflare Turnstile** |

Anchor on **US-East** (Supabase `us-east-1` ↔ Vercel `iad1`); global users are served via CDN cache, not by moving the origin.

## Directory map

```
app/                     # App Router — routes + API
  page.tsx               # home; [slug]/ flashlight detail (SSG); brand/[slug], brands/
  browse is rendered by components/BrowsePage (home embeds it)
  compare/ contribute/ top/ updates/ privacy/ report/   # public pages
  account/ my/ change-password/ reset-password/          # user pages (force-dynamic)
  u/[username]/          # public profile
  admin/                 # admin dashboard (client)
  api/                   # route handlers (see "API" below)
  sitemap.ts robots.ts manifest.ts llms.txt/ layout.tsx globals.css
components/               # UI. Big features split into subfolders:
  admin/   (AdminDashboard panels: Submissions/Brands/Reports/Users/Settings/Team + shared)
  browse/  (BrowseHeader, BrowseGrid, CompareBar — BrowsePage orchestrates)
  submit/  (SubmitFlashlightForm sections: Basic/Spec/Battery/Pdf/Reviews/Images/Footer + shared)
  account/ (ChangePassword, TwoFactor + shared)
  Header, AuthModal, FilterPanel, FlashlightCard, Markdown*, … (shared/top-level)
lib/                     # supabase(.ts/-admin/auth-context), verify-admin, validate,
                         # seo, browse, brand, battery, cdn, nav, analytics, hooks (use-*)
scripts/                 # smoke.mjs, health-daily.mjs, audit-rls.{mjs,sql}, seed/migrate utilities
email-templates/         # branded Supabase auth emails (Resend SMTP) — pasted into the dashboard
public/                  # icons, static assets
```

## Request & data flow

**Reads (pages).** Browser → Next route. Public catalog pages prerender as **SSG**
(`/[slug]`, `/brand/[slug]`) or server-render their first paint (browse); user pages are
`force-dynamic`. Server code reads Supabase with the **anon** key (RLS-guarded public data).
Responses are cached at the **Vercel edge** (`s-maxage`); the browse default order is a
nightly-reshuffled random (`flashlights.sort_seed`, pg_cron).

**Writes (mutations).** Client → an **API route** under `app/api/`. Each route: validates
input (`lib/validate.ts`), checks auth (`lib/verify-admin.ts` for admin routes), then writes
via the **service-role** client (`lib/supabase-admin.ts`, bypasses RLS). After a write it
calls `revalidatePath()` (or `/api/revalidate`) so the affected SSG pages refresh.

```
read :  browser → Next (SSG/SSR, anon Supabase) → Vercel edge cache → browser
write:  client → /api/* (validate → verify-admin → service-role Supabase) → revalidatePath
```

## Key subsystems

- **Auth** — Supabase email/password + TOTP 2FA. Client state in `lib/auth-context`; UI in
  `AuthModal`. API routes authorize via `verify-admin` (admin/mod) or a bearer/session check.
  Login rate-limited (5 → 10-min lockout, localStorage). Auth emails go through **Resend** SMTP
  (see `email-templates/` + workspace runbook).
- **Contributions** — `/contribute` → `SubmitFlashlightForm` writes a row to
  `flashlight_submissions` (+ `submission_images`) as **pending**. Admin/mod approve via
  `/api/admin/submissions`, which applies the data to `flashlights` (+ images/reviews), moves
  PDFs in Blob, and revalidates. Admins auto-approve; regular users wait in the queue.
- **Admin** — `/admin` → `AdminDashboard` orchestrator + `components/admin/*` panels. All
  `/api/admin/*` routes start with `verify-admin`. (Brand edits + brand submissions mirror this.)
- **Images & PDFs** — stored on **Vercel Blob**. Client uploads mint a scoped token via
  `/api/upload*` (auth- or Turnstile-gated, content-type + size + magic-byte checks). Always set
  `image_url` in the same insert (SSG freezes null otherwise).
- **Caching** — SSG for catalog pages; `s-maxage` edge cache for dynamic JSON (e.g.
  `/api/ga-settings`); on-demand revalidation on approve/edit. Details in `CLAUDE.md`.
- **Governance/tooling** — `lib/validate.ts` (input guards), pre-commit hook (eslint + `tsc`),
  `npm run smoke|health|audit-rls`. Every source file is kept ≤400 lines.

## Conventions (quick)

- Amber `#eba00b` is scarce (logo, active filters, primary button, saved items only).
- `emitters` (text[]) is canonical; numerics in `font-mono` (JetBrains Mono).
- `tsc --noEmit` + `npm run build` must pass before commit (hook enforces). Deploy = push to
  `main` (Vercel auto-build; fallback `npx vercel --prod --yes`), then verify on prod.
- Every push also updates `app/updates/page.tsx` (the public changelog).
