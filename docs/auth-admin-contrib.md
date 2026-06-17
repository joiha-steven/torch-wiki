# Auth, Contributions & Admin

## Auth Flow

- Sign in / Sign up via `AuthModal` (email + password). Sign-up also has an **optional username** field (live availability check, `nickError` format) passed to `signUp` as `options.data.username` → auth metadata → profile created on first sign-in (see `profiles`).
- **Login rate limiting** — 5 failed attempts → locked 10 minutes (localStorage)
- Forgot password → `supabase.auth.resetPasswordForEmail()` → email link → `/reset-password`. **If the account has 2FA**, the recovery link is only AAL1 but `updateUser({password})` needs AAL2 — `/reset-password` detects this (`getAuthenticatorAssuranceLevel`), shows a TOTP code field, steps up via `mfa.challenge`+`verify`, then updates (was failing with "AAL2 session is required…").
- **2FA (TOTP)** — enroll via `/account` → Security tab → QR code → 10 recovery codes (SHA-256 hashed in `recovery_codes` table)
- Login with 2FA → AuthModal shows TOTP step; "lost authenticator" → recovery code → calls `/api/recover-account` (admin API deletes factor)
- Change password → `/account` → Security tab (re-authenticates with current password first)
- **Email change** → `/account` → Profile tab → sends verification link to new address; change only takes effect after confirmation
- Nickname is **permanent** once saved — field becomes read-only, no edit allowed
- Captcha (Cloudflare Turnstile) on signup, forgot password, contribution forms

## User Profiles (`/u/[username]`)

- Public page, **ISR `revalidate = 60`** (was `force-dynamic`) — profile data only changes when a contribution is approved, so it's edge-cached 60s (Next emits `s-maxage=60, stale-while-revalidate`) instead of recomputing every hit
- Fetches profile by nickname via anon client (RLS: public SELECT on profiles)
- Fetches approved submissions via **service role** (bypasses RLS on `flashlight_submissions`)
- Shows: flashlights added (type=new), edit contributions (type=edit, deduplicated by flashlight)
- Submission images looked up from `flashlights` table by slug for thumbnails

## Contribution System (`/contribute`)

Three tabs:
1. **Add flashlight** — full spec form + image upload → pending queue
2. **Edit existing** — search + pick flashlight → pre-filled form → pending queue
3. **My submissions** — list of user's past submissions with status

- Requires account + **nickname** (blocked if no nickname set)
- Captcha verification server-side before DB insert
- Images uploaded to Vercel Blob at `submissions/{submission_id}/{uuid}.{ext}`
- "Suggest an edit" link on each flashlight detail page → `/contribute?suggest={id}`

## Admin (`/admin`)

- Access decided by `profiles.is_admin` / `profiles.is_moderator`. The bootstrap `NEXT_PUBLIC_ADMIN_EMAIL` match is enforced **server-side only** (API routes via `getAdminUser`); the `/admin` page + `useIsAdmin` use the profiles flags so the admin email never ships in client JS. (Owner account already has `is_admin = true`.)
- **2FA required** — blocks access until TOTP factor enrolled
- Sections: **Submissions** | **Reports** | **Users** | **Settings** (users + settings: admin only)
- Submissions fetched via `/api/admin/submissions` (service role — bypasses RLS, sees all users' submissions)
- Approve/Reject via PATCH `/api/admin/submissions` — server-side: validates action, looks up user_id from DB (not client), moves PDFs, handles image removals (`_removeExtraDbIds`, `_primaryImageUrl` directives stored in submission data), returns slug for revalidation
- PDF move on approval: `submissions/manuals/{uuid}.pdf` → `flashlights/{slug}/manual.pdf` (or `manual-1.pdf`, etc.) using Vercel Blob `copy()` + `del()`
- Reject → saves reviewer note shown to the submitter

**Inline edit (admin/mod only):** On each flashlight detail page, admins/mods see an "Edit" button (users see "Suggest an edit"). Both go to `/contribute?suggest={id}`. For admin/mod, the form auto-approves on submit (calls PATCH immediately, redirects to flashlight page). For users, submission goes into pending queue.

> **Auto-approve gate (`SubmitFlashlightForm`):** the staff check reads `isAdmin || isModerator` from the global `useAuth()` context (resolved once at app mount), **not** a per-mount fetch. The old `useIsAdmin()` refetched on form mount, so a fast **new** submission could fire before it resolved and wrongly land in the pending queue (edits were masked by the prefill delay). Submit is also blocked while `auth.loading` is true. Both new + edit auto-approve for admins **and** moderators.

**Image management in edit form:** Existing images loaded from `flashlight_images` table. On submit, image changes are stored as `_primaryImageUrl` and `_removeExtraDbIds` directives in the submission `data` JSONB. These are applied by the approval handler for both admin auto-approve and mod review.

**Note on `manual_urls` DB column:** requires SQL migration:
```sql
ALTER TABLE flashlights ADD COLUMN IF NOT EXISTS manual_urls text[] DEFAULT '{}';
UPDATE flashlights SET manual_urls = ARRAY[manual_url] WHERE manual_url IS NOT NULL AND (manual_urls IS NULL OR manual_urls = '{}');
```

