# HISTORY — torch-wiki

Incident narrative and migration facts moved out of `CLAUDE.md` (not loaded automatically). English, per the repo rule.

## hosts-file incident (2026-08-19)

Pointing `torch.edc.wiki` at `127.0.0.1` in the server's `/etc/hosts` broke the whole site twice on 2026-08-19, on both boxes, with the same line. Next's image optimizer has an SSRF guard that rejects any upstream hostname resolving to an internal IP, so every `/_next/image` returned HTTP 400 (`"url" parameter is not allowed`; service log: `resolved to private ip ["127.0.0.1"]`). Certificates are unrelated: `NODE_EXTRA_CA_CERTS` does not help, the guard works on the IP.

Correct setup: no hosts line for this domain. Next goes out through public DNS, Cloudflare, and back to the origin. A few tens of ms slower, but the only way that works.

The wrong check let it through the second time: nginx `proxy_cache torch_img` keeps optimized images for 30 days, so a URL that once worked returns 200 from cache while every other image is 400. Real check: take FRESH image URLs from the HTML and count status codes.

```bash
curl -s https://torch.edc.wiki/ | grep -o '/_next/image?url=[^"]*' | sed 's/&amp;/\&/g' \
  | sort -u | head -20 | while read -r u; do
      curl -s -o /dev/null -w "%{http_code} $u\n" "https://torch.edc.wiki$u"
    done
```

## Hosting moves

- Self-hosted since 2026-08-13 (Vercel retired; a restart-loop outage happened that day when building in the live slot).
- Moved from `sv1-usa` (the shop box) to `sv3-usa` on 2026-08-19 to separate it from the money-earning box.
- Vercel Blob store no longer referenced by the DB since 2026-08-13 (URLs rewritten, reverse mapping in workspace `02_Audit/`).
- Past file splits: `AdminDashboard` -> `components/admin/*`, `SubmitFlashlightForm` -> `components/submit/*`, `account/page` -> `components/account/*`.
