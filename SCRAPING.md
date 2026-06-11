# Flashlight Scraping Rules

Guidelines for adding flashlight data from external sources into the database.

---

## 1. Approved Source Hierarchy

Use sources in this priority order. Higher = more reliable.

| Priority | Source type | Examples | Use for |
|---|---|---|---|
| 1 | Brand official site | surefire.com, malkoffdevices.com, fenixlight.com | Specs, price, images, description |
| 2 | Authorized retailer | illumn.com, fenix-store.com, batteryjunction.com | Images, price, missing specs |
| 3 | Community review | CPF, BLF, reddit r/flashlight | Emitter details, real-world notes |
| 4 | Amazon / eBay | — | Price reference only — specs are often wrong |

Never use Amazon specs as source of truth. Cross-check anything unusual against the brand site.

### Shopify stores — bulk fetch via `products.json`

Many brand sites run on Shopify (Nextorch, LED Lenser, Malkoff, Foursevens/Prometheus via darksucks.com). When they do, skip HTML scraping and pull structured JSON:

```
https://www.<brand>.com/collections/<collection-handle>/products.json?limit=250
https://www.<brand>.com/products/<product-handle>.json
```

One collection call returns up to 250 products, each with `title`, `handle`, `body_html` (description + spec table/text), `images[]` (all gallery images, full size) and `variants[].price`. This is the fastest, most reliable Tier-1 source — prefer it over parsing rendered pages.

- Specs live in `body_html`: either a two-column spec `<table>` or an inline `TECHNICAL SPECIFICATIONS:` block — parse both.
- Image `src` URLs are Shopify CDN (`cdn.shopify.com`), already full size; no `Referer` needed.
- Keep the scratch dump (raw JSON + a normalize step → a clean `*-data.json`) out of git; commit only the seed script and the cleaned data file. See `scripts/seed-nextorch.mjs` for the pattern.

---

## 2. Slug Rules

Format: `{brand}-{model}` — all lowercase, words separated by hyphens, no special characters.

```
SureFire Stiletto Pro II  →  surefire-stiletto-pro-ii
Malkoff MDC HTL V3 EZP   →  malkoff-mdc-htl-v3-ezp
Fenix PD36 TAC            →  fenix-pd36-tac
```

- Strip: `.` `(` `)` `/` `+` `™` `®`
- Replace spaces and underscores with `-`
- Collapse multiple hyphens into one
- No trailing hyphen

**Sub-brands:** keep a sub-line under its parent brand rather than creating a new `brands` row. Set `brand` to the parent and prefix the model with the sub-line name. e.g. Nextorch's NEXDOT weapon lights → `brand: 'Nextorch'`, `model: 'NEXDOT WL25'`, slug `nextorch-wl25` (the sub-line word is in the model, not the slug).

Slugs are permanent — once a product is in the DB, never change its slug.

---

## 3. Field Extraction Rules

### Required fields
| Field | Rule |
|---|---|
| `brand` | Official brand name, title-cased. e.g. `SureFire`, `Olight`, `Malkoff` |
| `model` | Exact model name from brand site. e.g. `Stiletto Pro II` |
| `slug` | See section 2 |
| `category` | See section 4 |

### Nullable fields — extract if available, otherwise `null`
| Field | Notes |
|---|---|
| `max_lumens` | Highest output mode. Integer. |
| `min_lumens` | Lowest output mode. Integer. |
| `beam_distance_m` | Convert feet → meters if needed (`ft × 0.3048`). Round to nearest integer. |
| `beam_type` | One of: `Flood`, `Spot`, `Flood/Spot`, `Throw` |
| `emitter` | LED model. e.g. `Cree XP-L HI`, `SST-40`. `null` if brand doesn't disclose. |
| `battery_type` | See section 5. |
| `battery_count` | Integer. |
| `has_usb_charging` | `true`/`false`. `false` if not mentioned. |
| `charging_type` | `usb`, `magnetic`, `none`. Default `none`. |
| `length_mm` | Millimeters. Float ok. Convert inches if needed (`in × 25.4`). |
| `head_diameter_mm` | Millimeters. Float ok. |
| `body_diameter_mm` | Millimeters. Float ok. |
| `weight_g` | Grams. Float ok. Convert oz if needed (`oz × 28.3495`). Without batteries unless only one weight is given. |
| `material` | As stated on brand site. e.g. `6061-T6 Aluminum, Type III Hard Anodized` |
| `ip_rating` | e.g. `IPX8`, `IP67`. `null` if not stated. |
| `impact_resistance_m` | Meters. Convert feet if needed. |
| `price_usd` | USD. From brand's own store. Float with 2 decimals. |
| `year` | Year of release. Integer. `null` if unknown. |
| `buy_url` | Direct product URL on brand site. |
| `manual_url` | Direct PDF link if available. |
| `is_discontinued` | `true` if the brand marks it as discontinued/legacy/archived. |
| `description` | 1–2 sentences. Key differentiators. No marketing fluff. Write it yourself — don't copy-paste brand text. |
| `notes` | Extra context that doesn't fit specs: known issues, variants, compatibility notes. `null` if nothing notable. |

---

## 4. Category Mapping

| Category | When to use |
|---|---|
| `EDC` | Everyday carry — compact, < 150mm, pocket/clip carry |
| `Tactical` | Weapon-mountable, tail-switch, mil/LE use |
| `Weapon Light` | Explicitly designed for firearm mounting |
| `Thrower` | Long-range focused beam, high candela |
| `Flood` | Wide angle / wall-wash beam |
| `Headlamp` | Head-mounted |
| `Search & Rescue` | SAR, high output, long runtime, rugged |
| `Work` | UV, IR, task-specific |
| `Custom` | One-off, artisan, limited production |

When in doubt: if it's a normal pocket light → `EDC`. If it throws far → `Thrower`. If it has a weapon-mount hole/ring → `Weapon Light`.

---

## 5. Battery Type Values

Use exactly these strings (match filter options in the app):

```
CR123A  D-cell  AA  AAA  10440  14500  18350  18650  21700  26650  Built-in
```

- `Built-in` = non-removable integrated battery with USB charging.
- If a light accepts multiple battery types (e.g. 18650 or 21700 with adapter), use the primary/recommended one.

---

## 6. Image Rules

### Primary image
- One image per flashlight: the main product photo, clean background preferred.
- Blob path: `flashlights/{slug}/primary.{ext}`
- Stored in `flashlights.image_url`

### Extra images
- Scrape ALL gallery / carousel images from the product page.
- Include: different angles, disassembled, size comparison, beam shots.
- Exclude: lifestyle shots with models if there are better product-only shots.
- Blob path: `flashlights/{slug}/extra-{sort_order}.{ext}` — `sort_order` starts at 0.
- Stored in `flashlight_images` table.
- Sort order follows the order they appear on the source page.

### Already-on-Blob check
Skip any URL already on Vercel Blob — check with:
```js
function isAlreadyBlob(url) {
  return url && (url.includes('vercel-storage.com') || url.includes('blob.vercel'))
}
```
The migrate script handles this automatically — it is safe to re-run at any time.

### Image size preference
If the source uses a CDN with size parameters in the URL, request the largest available size before uploading:
```js
// BigCommerce (SureFire, many brands)
url.replace(/\/\d+w\//, '/1280x1280/').replace(/\/\d+x\d+\//, '/1280x1280/')

// Shopify (Malkoff)
url.replace(/_\d+x(\d+)?\./, '_1280x.')
```

---

## 7. CDN Hotlink Protection

Some brand CDNs block downloads unless the request has the correct `Referer` header. Add new brands to the `refererMap` in `scripts/migrate-to-vercel-blob.mjs`:

```js
const refererMap = {
  'websiteonline.cn': 'https://www.weltool.com/',  // Weltool
  // Add new entries here:
  // 'cdn.example.com': 'https://www.brand.com/',
}
```

If a brand's images return 403, inspect the request in browser DevTools → Network tab → find the image URL → check what `Referer` the browser sends → add that to the map.

---

## 8. HTTP Behavior

All scripts that download from external sites must:

```js
const res = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': referer,  // brand's own domain, or from refererMap
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
  }
})
```

Rate limiting: wait **500ms between requests to the same domain** to avoid triggering rate limits.

```js
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
// call after each fetch: await delay(500)
```

---

## 9. Seed Script Template

Every new brand gets its own seed script at `scripts/seed-{brand}.mjs`. Follow this pattern:

```js
import { put } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"(.*)"$/s, '$1')]
    })
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

function getExt(url) {
  try {
    const p = new URL(url).pathname
    const ext = p.split('.').pop()
    return ext && ext.length <= 5 ? `.${ext}` : '.jpg'
  } catch { return '.jpg' }
}

function isAlreadyBlob(url) {
  return url && (url.includes('vercel-storage.com') || url.includes('blob.vercel'))
}

async function downloadImage(url, referer) {
  await delay(500)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': referer ?? new URL(url).origin,
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return { buf: await res.arrayBuffer(), ct: res.headers.get('content-type') ?? 'image/jpeg' }
}

async function uploadToBlob(buf, ct, blobPath) {
  const { url } = await put(blobPath, buf, { access: 'public', token: BLOB_TOKEN, contentType: ct })
  return url
}

// ─── Data ────────────────────────────────────────────────────────────────────

const flashlights = [
  {
    brand: 'BrandName',
    model: 'Model Name',
    slug: 'brandname-model-name',
    category: 'EDC',
    price_usd: 99.00,
    buy_url: 'https://brand.com/products/model',
    max_lumens: 1000,
    min_lumens: 10,
    beam_distance_m: null,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: null,
    head_diameter_mm: null,
    body_diameter_mm: null,
    weight_g: null,
    material: null,
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://brand.com/image.jpg',  // will be replaced by Blob URL after upload
    description: 'One or two sentences about what makes this light notable.',
    is_discontinued: false,
  },
]

// Extra images per slug — add ALL gallery images found on the product page
const extraImages = {
  'brandname-model-name': [
    'https://brand.com/image-angle2.jpg',
    'https://brand.com/image-angle3.jpg',
  ],
}

// ─── Seed + Upload ────────────────────────────────────────────────────────────

async function seed() {
  // 1. Upsert flashlights
  const { data: inserted, error } = await supabase
    .from('flashlights')
    .upsert(flashlights, { onConflict: 'slug' })
    .select('id, slug, image_url')

  if (error) { console.error('Insert error:', error.message); process.exit(1) }
  console.log(`✓ Upserted ${inserted.length} flashlights`)

  const slugToId = Object.fromEntries(inserted.map((r) => [r.slug, r.id]))

  // 2. Upload primary images to Vercel Blob
  for (const f of inserted) {
    if (isAlreadyBlob(f.image_url)) { console.log(`  [skip primary] ${f.slug}`); continue }
    try {
      const srcUrl = flashlights.find((x) => x.slug === f.slug)?.image_url
      if (!srcUrl) continue
      const ext = getExt(srcUrl)
      const { buf, ct } = await downloadImage(srcUrl)
      const blobUrl = await uploadToBlob(buf, ct, `flashlights/${f.slug}/primary${ext}`)
      await supabase.from('flashlights').update({ image_url: blobUrl }).eq('id', f.id)
      console.log(`  [ok primary]  ${f.slug}`)
    } catch (err) {
      console.error(`  [err primary] ${f.slug}: ${err.message}`)
    }
  }

  // 3. Upsert extra images and upload to Vercel Blob
  for (const [slug, urls] of Object.entries(extraImages)) {
    const flashlightId = slugToId[slug]
    if (!flashlightId) { console.warn(`  [warn] slug not found: ${slug}`); continue }

    // Delete existing extras for this flashlight before re-inserting
    await supabase.from('flashlight_images').delete().eq('flashlight_id', flashlightId)

    const rows = []
    for (let i = 0; i < urls.length; i++) {
      const srcUrl = urls[i]
      let finalUrl = srcUrl

      if (!isAlreadyBlob(srcUrl)) {
        try {
          const ext = getExt(srcUrl)
          const { buf, ct } = await downloadImage(srcUrl)
          finalUrl = await uploadToBlob(buf, ct, `flashlights/${slug}/extra-${i}${ext}`)
          console.log(`  [ok extra]    ${slug}/extra-${i}`)
        } catch (err) {
          console.error(`  [err extra]   ${slug}/extra-${i}: ${err.message}`)
          // keep original URL as fallback
        }
      } else {
        console.log(`  [skip extra]  ${slug}/extra-${i}`)
      }

      rows.push({ flashlight_id: flashlightId, url: finalUrl, sort_order: i })
    }

    if (rows.length > 0) {
      const { error: imgErr } = await supabase.from('flashlight_images').insert(rows)
      if (imgErr) console.error(`  [err insert extras] ${slug}: ${imgErr.message}`)
    }
  }

  console.log('\nDone!')
}

seed()
```

---

## 10. Running Order

```bash
# Run from the project root
node scripts/seed-{brand}.mjs

# If you seeded without uploading images, run the migrate script after:
node scripts/migrate-to-vercel-blob.mjs
```

The migrate script is idempotent — it skips any URL already on Vercel Blob. Always safe to re-run.

---

## 11. Data Quality Checklist

Before committing a new seed script, verify:

- [ ] Slug is unique — check existing DB or grep `scripts/` for the slug string
- [ ] No copy-pasted brand marketing text in `description`
- [ ] Battery type matches allowed values exactly
- [ ] Category matches one of the 9 allowed values
- [ ] All image URLs are reachable (open in browser)
- [ ] Extra images are in the correct gallery order from the source page
- [ ] `is_discontinued: true` for any discontinued/legacy models
- [ ] `has_usb_charging` and `charging_type` are consistent with each other
- [ ] Dimensions are in mm (not inches), weight is in grams (not oz)

---

## 12. Blob Path Reference

```
flashlights/{slug}/primary.jpg       ← flashlights.image_url
flashlights/{slug}/primary.png
flashlights/{slug}/extra-0.jpg       ← flashlight_images.url (sort_order=0)
flashlights/{slug}/extra-1.jpg       ← flashlight_images.url (sort_order=1)
flashlights/{slug}/extra-2.jpg
...
```
