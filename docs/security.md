# Security posture

## Security

Hardened defensively. **Operational specifics and the hardening checklist are kept
in private workspace notes** (`06_Wiki/security-internals.md`, not in this public
repo) so we don't publish an attack map. High-level posture:

- **API auth** — routes are bearer-token authenticated via `lib/verify-admin.ts`
  (`getAdminUser`): content routes allow admin **or** moderator, role-management
  routes require admin. The bootstrap admin email is checked server-side only and
  never ships in the client bundle.
- **Uploads** — Vercel Blob tokens are never minted unauthenticated; uploads are
  gated by a validated Supabase session **or** a Turnstile captcha token. PDF
  uploads are admin/mod-only and verified by magic bytes.
- **SSRF** — server-side link fetching (`/api/fetch-review-meta`) re-validates
  every redirect hop against a private/loopback/cloud-metadata blocklist.
- **Headers** — `next.config.ts` sets HSTS, `nosniff`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` on every response (no CSP by choice).
- **JSON-LD** — `safeJson()` escapes `<` to prevent `<script>` breakout.

(Exact auth/token internals and the edge hardening checklist live in the private
notes above.)

