import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '../.env.local'), 'utf-8').split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"(.*)"$/s, '$1')] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const SITE = 'https://torch.edc.wiki'

const { data: fl } = await supabase.from('flashlights').select('slug, image_url').not('image_url', 'is', null)
const { data: ex } = await supabase.from('flashlight_images').select('flashlight_id, url')
const all = [...fl.map(f => ({ ref: f.slug, url: f.image_url })), ...ex.map(e => ({ ref: e.flashlight_id, url: e.url }))]

// test every image at w=640 through the LIVE optimizer (what the browser hits)
const broken = []
let done = 0
const queue = [...all]
async function worker() {
  while (queue.length) {
    const it = queue.shift()
    const u = `${SITE}/_next/image?url=${encodeURIComponent(it.url)}&w=640&q=75`
    try {
      const res = await fetch(u, { headers: { Accept: 'image/avif,image/webp,image/*,*/*' } })
      if (res.status !== 200) broken.push({ ...it, status: res.status })
    } catch (e) { broken.push({ ...it, status: `ERR ${e.message}` }) }
    if (++done % 200 === 0) console.error(`  …${done}/${all.length}`)
  }
}
await Promise.all(Array.from({ length: 10 }, worker))

console.log(`Tested ${all.length} images through live optimizer.`)
console.log(`\n=== Broken through optimizer: ${broken.length} ===`)
const byStatus = {}
for (const b of broken) byStatus[b.status] = (byStatus[b.status] ?? 0) + 1
for (const [s, n] of Object.entries(byStatus)) console.log(`  ${n}×  status ${s}`)
console.log('\nFirst 50:')
for (const b of broken.slice(0, 50)) console.log(`  [${b.status}] ${b.ref}  ${b.url}`)
