# Auth email templates (torch.EDC.wiki)

Branded HTML for Supabase Auth emails, sent via Resend custom SMTP.
Paste each file into **Supabase → Authentication → Emails → Templates**, set the
matching subject, and save. Plain inline-styled, table-based HTML (no web fonts,
no external CSS) for broad email-client support.

| File | Supabase template | Suggested subject | Variable used |
|------|-------------------|-------------------|---------------|
| `confirm-signup.html` | Confirm signup | `Confirm your torch.EDC.wiki account` | `{{ .ConfirmationURL }}` |
| `reset-password.html` | Reset password (Recovery) | `Reset your torch.EDC.wiki password` | `{{ .ConfirmationURL }}` |
| `change-email.html` | Change email address | `Confirm your new email for torch.EDC.wiki` | `{{ .ConfirmationURL }}`, `{{ .NewEmail }}` |

## Notes
- The app only triggers these three (signup confirm, password recovery, email change).
  Magic-link / invite aren't used — leave those at defaults or restyle later.
- Supabase substitutes the `{{ .Xxx }}` Go-template variables at send time; don't
  hardcode URLs.
- After enabling custom SMTP, send yourself a real test (sign up a throwaway address /
  trigger a reset) and confirm delivery + that the link lands on `https://torch.edc.wiki`.
- Keep the "non-commercial, not affiliated with any brand" footer line — same fair-use
  framing as the site footer.
