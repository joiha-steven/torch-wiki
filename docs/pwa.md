# PWA / installable app

## PWA / Installable App

The site is installable to the home screen and behaves like a native app (added 2026-06-16).

- **Manifest** (`app/manifest.ts` → `/manifest.webmanifest`): `display: standalone`, `id`/`scope` `/`, `background_color` + `theme_color` = **light surface `#f6f6f3`** (must match the app surface, or the OS launch screen flashes black before paint — this was the bug). Icons: full-bleed `icon-192/512.png` as `purpose: 'any'` **plus** padded `icon-192/512-maskable.png` as `purpose: 'maskable'` (the padding keeps the wordmark inside Android's adaptive-icon crop). Regenerate maskable variants by shrinking the logo to ~80% on a black canvas (`sips -z` + `--padToHeightWidth 512 512 --padColor 000000`).
- **iOS** (`app/layout.tsx`): `appleWebApp.statusBarStyle: 'default'` (NOT `black-translucent` — that pushes content under the clock and forces white text, unreadable on the light surface). `apple-touch-icon.png` is a dedicated **180×180 full-bleed** PNG (iOS rounds its own corners; don't point it at a maskable icon). `theme-color` is set via the **`viewport` export** (light/dark media), not hand-written `<meta>` tags.
- **`viewport` export**: `viewportFit: 'cover'` so the app uses the full screen on notch / Dynamic Island devices. Fixed bottom UI (`CompareBar`, brand-page compare bar, `CookieConsent`) uses `bottom-[calc(...+env(safe-area-inset-bottom))]` so it clears the home indicator.
- **Service worker** (`public/sw.js`, registered by `components/ServiceWorkerRegister.tsx`): hand-rolled, **no build integration** (this is a customized Next 16 build — `next-pwa`/`serwist` are avoided on purpose). Strategy: **cache-first** for hashed static assets (`/_next/static`, fonts, icons) → instant repeat opens; **network-first** for HTML navigations → online always fresh (the site is DB-driven), offline falls back to the last-cached page then `public/offline.html`; API + all cross-origin (Supabase/Blob/GA/Turnstile) → network only, never cached. Bump `CACHE_VERSION` in `sw.js` to invalidate. `/sw.js` is served `Cache-Control: max-age=0, must-revalidate` (in `next.config.ts`) so clients never get stuck on an old SW.

