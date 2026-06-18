# Code map — key components, pages & API routes

## Key Components & Pages

| File | Purpose |
|---|---|
| `lib/auth-context.tsx` | Auth context — user, nickname, wishlistIds, collectionIds, toggle methods |
| `lib/supabase-admin.ts` | `getSupabaseAdmin()` — service role client, lazy init (runtime only) |
| `lib/types.ts` | TypeScript types for all DB tables |
| `components/AuthModal.tsx` | Sign in / Sign up / Forgot / MFA challenge / Recovery code |
| `components/UserMenu.tsx` | User icon in header — dropdown menu |
| `components/Header.tsx` | Shared sticky header — logo, nav, UserMenu. **Note:** the browse page does NOT use this — it has its own header `components/browse/BrowseHeader.tsx` (with an integrated search box). Header style/nav changes must be made in BOTH places to stay in sync. |
| `components/BrowsePage.tsx` | Main browse page — owns filter/sort state + infinite-scroll observer. **Seeded by the server** via optional `initialItems`/`initialCount`/`initialMeta` props (see Caching → Browse first-paint); skips the first client fetch when seeded. Page size: **mobile 16, desktop 32** (`PAGE_SIZE_MOBILE/DESKTOP`, chosen once from viewport at mount). Default sort = **random** (`sort_seed`). Also owns the **grid/list `view`** state (persisted in `localStorage['browseView']`, read after mount → no hydration mismatch). Split into `components/browse/{BrowseHeader, BrowseGrid, CompareBar, ViewToggle}` (presentational; the sentinel ref is forwarded to BrowseGrid so fetch/scroll logic stays in the parent). |
| `components/browse/ViewToggle.tsx` | Grid/list segmented toggle. `BrowseGrid` renders the card grid (`FlashlightCard`) or a `flex-col` of `FlashlightRow` by the `view` prop; the toggle sits left of the results count on desktop and in the mobile toolbar. |
| `components/FlashlightRow.tsx` | **List-mode** row (horizontal): thumbnail + brand/model + inline spec strip (lumens·throw·battery·weight) + price + the same compare/wishlist/collection actions + `HoverPrefetchLink` as the card. `memo`-wrapped. |
| `lib/browse.ts` | Shared browse query layer used by **both** `app/page.tsx` (server) and `BrowsePage` (client): `DEFAULT_FILTERS`, `PAGE_SIZE_*`, `BROWSE_COLS` (card-only column list), `buildQuery()` (`count: 'estimated'`), `madeInBrandNames()`, `fetchBrowseMeta()`. Single source of truth so the server-seeded first page and client refetches stay identical. The headline **"X users"** count comes from the `public_user_count()` RPC (counts `auth.users`, not `profiles`) so accounts that never set a username still count. |
| `components/Providers.tsx` | Global `AuthProvider` + auth-modal portal. `AuthModal` is **`next/dynamic` (`ssr: false`)** — its Turnstile dependency only loads when the user opens sign-in, keeping it out of the first-paint bundle. |
| `components/browse/BrowseHeader.tsx` · `BrowseGrid.tsx` · `CompareBar.tsx` | Extracted browse pieces — floating header+search, results grid, bottom compare bar |
| `components/FilterPanel.tsx` | Sidebar filters — incl. the Sort by select (`SORT_OPTIONS`, default `random`) |
| `components/FlashlightCard.tsx` | Grid card with compare + wishlist/collection buttons. `memo`-wrapped; takes `isSelected: boolean` (not the compareIds array) so only the toggled card re-renders. |
| `components/ErrorState.tsx` | Shared on-brand error UI used by `app/error.tsx` + `app/[slug]/error.tsx` error boundaries |
| `lib/verify-admin.ts` | `getAdminUser(request)` — shared bearer-token admin/mod auth for API routes (see Security) |
| `components/SubmitFlashlightForm.tsx` | Thin (~104-line) composition root for the contribute/edit form — renders `components/submit/*` sections; all state/handlers/submit live in `useFlashlightForm`. Per-field `hint` encodes naming/format conventions. |
| `components/submit/useFlashlightForm.ts` | Hook holding ALL form state + handlers + the submit/auto-approve flow (image/PDF upload, reviews, build submission, captcha, rollback). Lets the component stay thin (CLAUDE.md #7 split-don't-trim). |
| `components/submit/SuggestInput.tsx` | Single-value typeahead (Brand, Model) suggesting existing DB values; BasicFields warns when brand+model duplicates an existing flashlight (excludes self in edit). Brands from `brands`; models/dup from a session-cached `flashlights(brand,model,slug)` fetch |
| `components/submit/MaterialSection.tsx` | Up to 3 structured material rows (Material ▸ Finish ▸ Colour). Finish list + colour visibility driven by `lib/materials.ts`; Damasteel's colour slot = etch state. Self-managed (emits `MaterialEntry[]`) |
| `lib/materials.ts` | Material vocabulary: `MATERIALS`, per-material `FINISHES`, `COLOR_BEARING`, `COLORS` (30), Damasteel patterns/states, `showsColor`/`defaultFinish`/`defaultColor`, `formatMaterials()` for display |
| `components/MarkdownContent.tsx` | Renders Markdown with Tailwind styles — used in flashlight detail and form preview |
| `components/SuggestEditButton.tsx` | Smart "Suggest an edit" / "Edit" link — shows "Edit" for admin/mod, "Suggest an edit" for users |
| `lib/use-is-admin.ts` | `useIsAdmin()` hook — checks `profiles.is_admin/is_moderator` client-side |
| `app/[slug]/page.tsx` | Flashlight detail page — gallery, specs, reviews, manual, attribution timeline |
| `app/[slug]/ImageGallery.tsx` | Image gallery — white main area, warm thumbnails, amber active border |
| `app/u/[username]/page.tsx` | Public user profile — shows approved contributions (added + edits), uses service role to bypass RLS |
| `app/top/page.tsx` | Top Lists page — recently added, newest, most expensive, best value |
| `app/api/ping/route.ts` | Health check endpoint — called daily by Vercel Cron to keep Supabase alive |
| `app/api/admin/submissions/route.ts` | GET (list by status, service role bypass RLS, **enriches each row with `submitter_nickname`** via a profiles lookup) + PATCH (approve/reject, move PDFs, apply image directives, replace `_reviews`, **regenerate slug from edited brand+model** with collision guard + revalidate old URL, validate action, **stamp add/update time = submit time**) |
| `app/api/admin/flashlight/route.ts` | PATCH — direct flashlight update (used by admin auto-approve path) |
| `app/api/admin/upload-image/route.ts` | Admin image upload handler — auth via clientPayload bearer token |
| `app/api/upload-pdf/route.ts` | Client upload handler for PDFs in contribute form — auth via clientPayload bearer token |
| `app/api/upload-manual/route.ts` | Direct **admin/mod-only** PDF upload — stores to `flashlights/{slug}/manual.pdf`; validates slug + `%PDF-` magic bytes |
| `lib/cdn.ts` | `cdnUrl()` — rewrites Vercel Blob PDF URLs to Cloudflare CDN proxy domain |
| `lib/seo.ts` | `SITE_URL`, `SITE_NAME`, `OG_IMAGE` — single source of truth for canonical origin + default share image (`public/og-default.jpg`, 1200×630) |
| `app/api/fetch-review-meta/route.ts` | POST `{url}` (auth-gated, SSRF-guarded) → og/JSON-LD title + published date; uses YouTube/Vimeo **oEmbed** first (reliable title), HTML fallback for the date |
| `app/llms.txt/route.ts` | `/llms.txt` (llmstxt.org) — site overview + brand list for AI crawlers, hourly revalidate |
| `app/robots.ts` | robots.txt — explicit allow for AI bots (GPTBot, ClaudeBot…), disallow `/admin /api/ /my /account /reset-password /change-password` |
| `components/FlashlightCardSkeleton.tsx` | Shimmer skeleton card shown while browse page loads |
| `components/PageFade.tsx` | Wraps page content with fade-in animation on navigation |
| `app/my/page.tsx` | My Lists — wishlist + collection |
| `app/account/page.tsx` | My Account — profile (email change, nickname), security (password, 2FA) |
| `app/contribute/page.tsx` | Contribute — add/edit flashlights, submission history |
| `app/admin/page.tsx` + `AdminDashboard.tsx` | Admin review queue + reports + settings |
| `app/compare/page.tsx` | Side-by-side spec comparison (up to 4) |
| `app/log/page.tsx` + `log/updates-data.ts` | The **Log** page (was `/updates`; `/updates` now 308-redirects here via `next.config.ts`). Centered hero + version chip linking to the deployed commit on GitHub (`process.env.VERCEL_GIT_COMMIT_SHA`), then a **page-level two-column layout** (`max-w-6xl`, `grid lg:grid-cols-2`, stacks to one column / left-content-first on mobile): **left** = a detailed `FEATURES` list (`{title, body}`, rendered as a list in a panel — not a card grid) + the "Built with" `STACK`; **right** = the static changelog. Changelog data is the `UPDATES` array in `app/log/updates-data.ts` (page just renders it). **One entry per calendar day** - add items to today's entry rather than creating a second one for the same date; adjust the day's umbrella `title` if needed. Newest day first. |
| `app/guide/page.tsx` | Static **Guide**: how to use the site, the visitor/member/moderator permission hierarchy, community rules + ban policy, install-as-app, privacy, and license. Same **page-level two-column layout** as Log (`max-w-6xl`, stacks left-first on mobile): **left** = Using the site / Install / Privacy / License; **right** = Roles / Community rules + enforcement / Deleting your account; footer note full-width below. Prose kept in JS string arrays (rendered via `{}`) to avoid `react/no-unescaped-entities`. |
| `app/api/admin/trash/route.ts` + `lib/trash.ts` | **Delete/Trash** (admin-only). POST `{id, action: trash\|restore\|purge}`; GET lists trashed lights and opportunistically purges expired ones. `lib/trash.ts`: `purgeFlashlight()` (deletes Blob assets — primary/extra images + manuals — then DB rows), `purgeExpiredTrash()` (everything past `TRASH_RETENTION_DAYS`=30). |
| `app/api/cron/purge-trash/route.ts` | Daily Vercel Cron (`vercel.json`, 08:30 UTC) → `purgeExpiredTrash()`. Requires `CRON_SECRET` (503 if unset). |
| `components/admin/DeletePanel.tsx` · `TrashPanel.tsx` | Admin "Delete" subtab (search → preview → confirm → move to Trash; **plus a list of mod delete-suggestions with Approve/Dismiss per item + Approve-all**) and "Trash" subtab (list with days-left, Restore / Delete-permanently, **Empty-trash** = purge_all). Both gated to `isAdmin` in `AdminDashboard`. The trash route POST handles `trash/restore/purge` (by id), `purge_all`, and `approve_suggestion/reject_suggestion/approve_all_suggestions` (by submissionId). |
| `components/SuggestDeleteButton.tsx` | Admin/mod "Suggest delete" link next to Edit on the flashlight page. Confirms, then inserts a pending `type:'delete'` submission (deletion needs admin approval) → shows in the admin Delete tab. |
| `app/api/admin/brand-trash/route.ts` + `components/admin/BrandDeletePanel.tsx` · `BrandTrashPanel.tsx` | Brand Delete/Trash (admin-only subtabs in the **Brands** section). Deleting a brand asks what to do with its products: **mode `products`** (trash the brand + all its flashlights) or **mode `reassign`** (move its flashlights to an existing brand — slugs kept stable — then trash the now-empty brand). `lib/trash.ts` `purgeBrand` (logo blob + still-trashed products + brand row) and `purgeExpiredBrandTrash` handle the 30-day purge (cron + opportunistic on trash view). |
| `app/log/page.tsx` (Database tab) + `app/log/DataUpdatesTab.tsx` | **Database updates** — the community data-change feed (flashlight/brand add/edit), via the `data_change_log` RPCs, folded into `/log` as the "Database" tab (was the standalone `/data-log` page; `/data-log` + `/data-log/:page*` permanent-redirect to `/log`). `page.tsx` server-fetches up to 500 rows + count and passes to `LogTabs`; `DataUpdatesTab` (client) renders each line: GMT+7 timestamp + "{nickname} added/edited {Brand Model}" or "{nickname} created/updated brand {Brand}". ISR 300s; approvals `revalidatePath('/log')`. |
| `components/InfoMenu.tsx` | "Information" nav dropdown (Log + Guide + Terms), styled like `UserMenu`. Sub-links live in `INFO_NAV` (`lib/nav.ts`); `NAV` holds the flat top-level links. Both `Header` and `browse/BrowseHeader` render `{NAV.map} + <InfoMenu/>` (desktop) and flatten `INFO_NAV` under an "Information" label (mobile). |
| `app/api/captcha-verify/route.ts` | Verifies Cloudflare Turnstile token |
| `app/api/recover-account/route.ts` | Verifies recovery code hash → unenrolls TOTP via admin API |
| `app/api/upload/route.ts` | Vercel Blob client upload handler — gated by `clientPayload` `{ session }` (Supabase token) or `{ turnstile }` (see Security) |
| `app/api/revalidate/route.ts` | On-demand cache invalidation — called by admin on approval or force-clear |
| `app/api/ga-settings/route.ts` | Returns GA `{ enabled, id }` from `settings` table. **Edge-cached** via `Cache-Control: s-maxage=300` (global value, rarely changes) — without `s-maxage` only the browser cached and every fresh visit invoked this function cold (~800ms, was the slowest request on the page). |
| `app/sitemap.ts` | Auto-generated `/sitemap.xml` — all flashlight slugs + static pages (1hr revalidate) |
| `app/robots.ts` | `/robots.txt` — allow all crawlers, block `/admin` and `/api/` |
| `components/GoogleAnalytics.tsx` | Loads GA script client-side if enabled; skipped for admin users **and until cookie consent === 'accepted'** (so `_ga` is never set without consent). Reads settings via `useGaSettings()` |
| `components/CookieConsent.tsx` | Small bottom-left consent banner, links to `/privacy`; writes the choice and gates GA. **Hidden entirely unless GA is configured** (`gaActive` — Measurement ID set + enabled) and never shown to admins, so with no GA the site is cookieless and needs no banner |
| `lib/use-ga-settings.ts` | `useGaSettings()` hook + `gaActive(s)` — shared, module-cached fetch of `/api/ga-settings` (one request for GoogleAnalytics + CookieConsent) |
| `components/ThemeToggle.tsx` | 4-state theme switcher (Dark/Light/System/Auto). Writes `localStorage['theme-mode']`, sets `<html data-theme>`. See **Theming** section |
| `lib/analytics.ts` | `trackEvent()` wrapper + `AnalyticsEvent` names for Vercel Analytics custom events / conversion goals (Signup, Collection/Wishlist Add, Contribution New/Edit). Contribution events fire only on the non-admin submit path |
| `lib/use-consent.ts` | `useConsent()` (SSR-safe via `useSyncExternalStore`) + `getConsent`/`setConsent`; localStorage key `torch-cookie-consent`, syncs same-tab via custom event and cross-tab via storage event |
| `app/privacy/page.tsx` | `/privacy` — Privacy & Cookies page (essential vs analytics cookies, cookieless Vercel Analytics, account data, images, notice-and-takedown) |
| `app/terms/page.tsx` | `/terms` — Terms of Use (acceptance, who-can-use, community rules, contribution licensing CC BY 4.0, IP, notice-and-takedown, no-warranty, liability). Implied-consent notices (no checkbox) on signup (`AuthModal`), contribute (`FormFooter`) and `/report`. Linked in `INFO_NAV` + FilterPanel footer |
| `app/[slug]/page.tsx` | Flashlight detail — `generateMetadata` (dynamic title/description/OG), JSON-LD Product schema |

