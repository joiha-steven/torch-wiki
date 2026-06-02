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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN

const images = {
  'acebeam-uc3a':                      'https://www.acebeam.com/images/thumbs/009/0094119_uc3a-compact-multi-color-edc-light_600.jpeg',
  'acebeam-e75':                        'https://www.acebeam.com/images/thumbs/009/0090951_e75-high-performance-quad-core-edc-flashlight_600.jpeg',
  'acebeam-e10-20':                     'https://www.acebeam.com/images/thumbs/008/0089774_e10-20-long-range-compact-edc-flashlight_600.jpeg',
  'acebeam-k1-cyan':                    'https://www.acebeam.com/images/thumbs/009/0094120_k1-edc-flashlight-three-light-sources-with-cyan-beam-488nm-special-edition_600.jpeg',
  'acebeam-uc25':                       'https://www.acebeam.com/images/thumbs/008/0089714_uc25-multi-light-tactical-edc-flashlight_600.jpeg',
  'acebeam-k1':                         'https://www.acebeam.com/images/thumbs/008/0089893_k1-edc-flashlight-with-three-light-sources_600.jpeg',
  'acebeam-keylite-500':                'https://www.acebeam.com/images/thumbs/008/0089895_keylite-500-usb-c-keychain-light_600.jpeg',
  'acebeam-ec90':                       'https://www.acebeam.com/images/thumbs/008/0089652_ec90-long-range-edc-flashlight_600.jpeg',
  'acebeam-tac-2aa':                    'https://www.acebeam.com/images/thumbs/008/0089302_tac-2aa_600.jpeg',
  'acebeam-pt20':                       'https://www.acebeam.com/images/thumbs/008/0089817_pt20-portable-2-aaa-edc-penlight_600.jpeg',
  'acebeam-tac-aa-v2':                  'https://www.acebeam.com/images/thumbs/008/0089862_tac-aa-20-flashlight_600.jpeg',
  'acebeam-uc20':                       'https://www.acebeam.com/images/thumbs/008/0089443_uc20-flat-edc-flashlight-with-three-light-sources_600.jpeg',
  'acebeam-ec20':                       'https://www.acebeam.com/images/thumbs/008/0089368_ec20-multi-light-source-edc-flashlight_600.jpeg',
  'acebeam-terminator-m1':              'https://www.acebeam.com/images/thumbs/008/0089645_terminator-m1-dual-head-lepled-flashlight_600.jpeg',
  'acebeam-e70-al':                     'https://www.acebeam.com/images/thumbs/008/0089700_e70-al-edc-flashlight_600.jpeg',
  'acebeam-pokelit-aa-1000':            'https://www.acebeam.com/images/thumbs/008/0087119_pokelit-aa-1000-lumens_600.jpeg',
  'acebeam-rider-rx-20-ti-special':     'https://www.acebeam.com/images/thumbs/008/0087012_rider-rx-20-anodized-titanium-limited-edition_600.jpeg',
  'acebeam-terminator-m2-x':            'https://www.acebeam.com/images/thumbs/008/0089897_terminator-m2-x-with-rgb_600.jpeg',
  'acebeam-e70-br':                     'https://www.acebeam.com/images/thumbs/008/0089699_e70-br-edc-flashlight-limited-edition_600.jpeg',
  'acebeam-e70mini':                    'https://www.acebeam.com/images/thumbs/008/0089802_e70-mini-nichia-519a-flashlight_600.jpeg',
  'acebeam-e70-ti':                     'https://www.acebeam.com/images/thumbs/008/0087117_e70-ti-edc-flashlight-limited-edition_600.jpeg',
  'acebeam-tac-aa':                     'https://www.acebeam.com/images/thumbs/008/0087118_tac-aa-flashlight_600.jpeg',
  'acebeam-e70-mini-ti':                'https://www.acebeam.com/images/thumbs/008/0083636_e70-mini-ti-high-cri-edc-flashlight_600.jpeg',
  'acebeam-m2':                         'https://www.acebeam.com/images/thumbs/008/0083615_terminator-m2.jpeg',
  'acebeam-pokelit-aa-cu':              'https://www.acebeam.com/images/thumbs/008/0083628_pokelit-aa-cu-limited-edition_600.jpeg',
  'acebeam-pokelit-2aa-nbcf':           'https://www.acebeam.com/images/thumbs/008/0083630_pokelit-2aa-national-breast-cancer-pink-flashlight_600.jpeg',
  'acebeam-pokelit-2aa':                'https://www.acebeam.com/images/thumbs/008/0084854_pokelit-2aa-pen-light_600.jpeg',
  'acebeam-pokelit-aa':                 'https://www.acebeam.com/images/thumbs/008/0084853_pokelit-aa_600.jpeg',
  'acebeam-pokelit-aa-ti-3':            'https://www.acebeam.com/images/thumbs/008/0089436_pokelit-aa-titanium-alloy-natural_600.jpeg',
  'acebeam-pokelit-aa-ti-2':            'https://www.acebeam.com/images/thumbs/008/0083613_pokelit-aa-ti-10th-limited-edition_600.jpeg',
  'acebeam-pokelit-aa-ti':              'https://www.acebeam.com/images/thumbs/008/0083626_pokelit-aa-ti_600.jpeg',
  'acebeam-rider-rx-v2':                'https://www.acebeam.com/images/thumbs/008/0087120_rider-rx-20-aa-flashlight_600.jpeg',
  'acebeam-rider-rx-20-ti':             'https://www.acebeam.com/images/thumbs/008/0083620_rider-rx-20-ti-aa-flashlight_600.jpeg',
  'acebeam-rider-rx-20-ti-special-edition': 'https://www.acebeam.com/images/thumbs/008/0083616_rider-rx-20-special-edition_600.jpeg',
  'acebeam-rider-rx-20':                'https://www.acebeam.com/images/thumbs/008/0087113_rider-rx-20_600.jpeg',
  'acebeam-pokelit-aa-ti-519a':         'https://www.acebeam.com/images/thumbs/008/0083617_pokelit-aa-ti-519a_600.jpeg',
}

async function download(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.acebeam.com/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ct = res.headers.get('content-type') ?? 'image/jpeg'
  const buf = await res.arrayBuffer()
  return { buf, ct }
}

async function run() {
  const slugs = Object.keys(images)
  console.log(`Migrating images for ${slugs.length} Acebeam flashlights...\n`)

  let ok = 0, skip = 0, err = 0

  for (const slug of slugs) {
    const srcUrl = images[slug]

    // Check current image_url in DB
    const { data: row } = await supabase
      .from('flashlights')
      .select('id, image_url')
      .eq('slug', slug)
      .single()

    if (!row) { console.log(`  [miss] ${slug} — not in DB`); err++; continue }

    if (row.image_url?.includes('vercel-storage.com') || row.image_url?.includes('blob.vercel')) {
      console.log(`  [skip] ${slug}`)
      skip++
      continue
    }

    try {
      const ext = srcUrl.endsWith('.png') ? '.png' : '.jpeg'
      const { buf, ct } = await download(srcUrl)
      const { url: blobUrl } = await put(`flashlights/${slug}/primary${ext}`, buf, {
        access: 'public',
        token: BLOB_TOKEN,
        contentType: ct,
      })
      await supabase.from('flashlights').update({ image_url: blobUrl }).eq('id', row.id)
      console.log(`  [ok]   ${slug}`)
      ok++
    } catch (e) {
      console.error(`  [err]  ${slug}: ${e.message}`)
      err++
    }
  }

  console.log(`\nDone — ${ok} migrated, ${skip} skipped, ${err} errors`)
}

run().catch(console.error)
