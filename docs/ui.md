# UI — page structure, filters, color & theming

## User Icon (Header)

- Logged out → `User` icon, white
- Logged in → `User` icon, brand amber (`#eba00b`)
- Dropdown shows nickname (if set) or email, plus: My Lists / Contribute / My Account / Sign out

## Flashlight Detail Page

Sections in order:
1. Image gallery (white bg, `rounded-2xl`, warm thumbnails)
2. Hero: category badge (gray), brand, model, discontinued tag, price, wishlist, "Edit"/"Suggest an edit"
3. Description — Markdown rendered, hairline top border separator
4. Specifications — flat table, hairline row borders, `font-mono` values, no zebra
5. Reviews — hairline-separated list
6. User Manual — hairline-separated PDF links
7. Change history — full public create/edit record via `flashlight_change_log` RPC (`components/ChangeLog.tsx`): newest first, bullet "–" prefix, links to `/u/[nickname]` (staff in amber, regular users in strong grey via `is_staff`), timestamped by submit time, collapses past 5 with "See more". Falls back to a synthetic "added · system" entry for seeded lights. (Replaced the old derived "Added by / Updated by" timeline.)

**Attribution logic:**
- `updated_by != null && updated_at == created_at` → "Added by [user]" (user submitted new flashlight)
- `updated_by == null` → "Added by system"
- `updated_by != null && updated_at != created_at` → also show "Updated by [user]" above

**Notes field (`flashlight.notes`):** still exists in DB but no longer displayed or editable. Preserved for backward compat.

## Filter Options

**Categories:** EDC, Tactical, Weapon Light, Thrower, Flood, Headlamp, Search & Rescue, Diving, Work, Custom

**Battery types:** disposables (AAAA/AAA/AA/C-cell/D-cell/9V/CR123A/CR2), coin cells (CR2032/CR2025/CR2016/LR44), Li-ion (10180…32650), Built-in — full list in **`lib/constants.ts`** (`BATTERY_TYPES`).

(Note: `16340` = RCR123 rechargeable Li-ion — use for lights with USB-C charging in a CR123-size cell, e.g. Acebeam W20/E10/G10. Reserve `CR123A` for lights that take non-rechargeable primaries, e.g. SureFire/Malkoff. **`CATEGORIES` and `BATTERY_TYPES` now live in `lib/constants.ts`** — shared by the browse `FilterPanel` and the contribute/edit form (`components/submit/*`). Adding a value is a code change that needs a deploy. The contribute form's battery type is a **select only** (no free typing), max **4 battery options** per light each with its own cell count; the browse filter only surfaces battery types actually in use, via facet narrowing.)

**Charging:** Any / USB / Magnetic / None

**Lumens & Price** are **dual-thumb drag sliders** (`RangeSlider` in `components/FilterPanel.tsx`), not buckets. Lumens slider runs 0–50000 (`max_lumens`); Price slider runs 0–3000 in display units (`PRICE_CEIL`). The **max thumb at the end = "no upper bound"**: lumens hi 50000 = `LUMEN_MAX` sentinel; price hi 3000 maps to `PRICE_MAX` (99999) sentinel. `buildQuery` applies `gte` when min>0 and `lte` only when max < sentinel (so the top thumb drops the upper bound — covers the few lights above 50000 lm / 3000 USD). Thumb CSS = `.dual-range` in `globals.css`.

**Sort by** (`SORT_OPTIONS` in `FilterPanel.tsx`): **Random** (default), Model A–Z, Lumens (High–Low / Low–High), Price (Low–High / High–Low), Beam Distance (Far–Near), Weight (Light–Heavy). Random orders by `flashlights.sort_seed` (+ `id` tie-break) and reshuffles nightly via pg_cron — see the schema note.

## Color System

Brand color `#eba00b` (refined amber) defined as `brand-*` scale in `app/globals.css`:
- `brand-500` → primary accents, active filter buttons, active wishlist/collection, logo
- `brand-100` / `brand-50` → light backgrounds (rare)
- **Never use `amber-*`** — always use `brand-*`

Page surface: `#f6f6f3` (warm off-white) — defined via `--color-gray-100` override in `@theme`, and as body background. All pages use `bg-gray-100` which resolves to this.

Card borders: `#e7e7e1` (warm light gray). Hover border: `#c8c8c0`. Use these instead of `border-slate-200`.

No box-shadows anywhere. Hover = border darkens only.

**Inter** is the single site-wide typeface — a self-hosted variable font (`app/fonts/inter-variable.woff2`) loaded via `next/font/local` in `app/layout.tsx` as the `--font-inter` CSS variable (no Google Fonts / third-party request). The old SF stack + JetBrains Mono were dropped; `font-mono` is still used as a Tailwind class for numeric values (lumens, price, dimensions, spec table values), now resolving to Inter's tabular figures.

**Custom checkbox/radio CSS** in `globals.css` — classes `.cb` (checkbox) and `.rb` (radio). Flat, amber accent on check. Use instead of `accent-brand-500`.

## Theming — light/dark (added 2026-06-13)

Dark mode is a **token flip on `<html data-theme="light|dark">`**, not per-element overrides. Strategy:
- **Semantic color tokens** in `app/globals.css` `@theme` map Tailwind utilities to runtime CSS vars so they flip automatically: `text-ink`/`-2`/`-3`, `border-line`/`-strong`, `bg-surface`, `bg-plate` (product-image plate), `bg-panel` (cards/modals/inputs/white panels). `:root` holds the light values; `:root[data-theme="dark"]` overrides them (warm graphite `#17181b`, brighter amber `#f4a820`, `--card-plate` stays light `#e9e9e5`). Glass/body/pill/nav/checkbox/shimmer rules all read tokens.
- **`@custom-variant dark`** is bound to `data-theme` (NOT `prefers-color-scheme`), so `dark:` utilities follow the switcher.
- **`components/ThemeToggle.tsx`** (in both `Header` and `browse/BrowseHeader`) is the 4-state switcher (Dark/Light/System/Auto-by-time). It writes `localStorage['theme-mode']` and sets `data-theme`. **Default is light** until the user picks. An **inline FOUC script in `app/layout.tsx`** resolves the theme before first paint (`<html suppressHydrationWarning>`), plus two `<meta name=theme-color>` tags (light/dark) synced at runtime.
- **When writing new UI:** use the semantic tokens, never raw `bg-white`/`text-slate-*`/hard hexes. Product-image containers = `bg-plate` (so dark-bodied lights stay legible). Active tabs / dark buttons that were `bg-[#17171a] text-white` use `bg-ink text-surface` (inverts correctly per theme). White-alpha highlights on the dark nav (`bg-white/…`) are intentional and stay.
- **Nav-link/hover highlights are warm (~4000K, `#ffe8c8`)** not pure white; the floating-nav capsule is a graphite (light `--nav-bg rgba(31,33,38,.92)`, dark `rgba(37,39,44,.92)`).

## Material Options (CollectionEditModal)

`Aluminum, Raw Aluminum, 7075 Aluminum, Anodized Aluminum, Cerakote Aluminum, Copper, Brass, Bronze, Zirconium, Zircuti, Timascus, Damasteel, Damasteel Fenja, Other`

