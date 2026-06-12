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
  env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function host(url) { try { return new URL(url).hostname } catch { return '(invalid)' } }

async function head(url) {
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
    return res.status
  } catch (e) {
    return `ERR ${e.message}`
  }
}

async function run() {
  const { data: fl } = await supabase
    .from('flashlights').select('id, slug, image_url').not('image_url', 'is', null)
  const { data: ex } = await supabase
    .from('flashlight_images').select('id, flashlight_id, url')

  const items = [
    ...fl.map(f => ({ kind: 'primary', slug: f.slug, url: f.image_url })),
    ...ex.map(e => ({ kind: 'extra', slug: e.flashlight_id, url: e.url })),
  ]
  console.log(`Total image URLs: ${items.length}  (primary ${fl.length}, extra ${ex.length})`)

  // hostname breakdown
  const byHost = {}
  for (const it of items) byHost[host(it.url)] = (byHost[host(it.url)] ?? 0) + 1
  console.log('\nBy hostname:')
  for (const [h, n] of Object.entries(byHost).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(5)}  ${h}`)

  // test each (concurrency 12)
  const broken = []
  let done = 0
  const queue = [...items]
  async function worker() {
    while (queue.length) {
      const it = queue.shift()
      const status = await head(it.url)
      if (status !== 200 && status !== 206) broken.push({ ...it, status })
      if (++done % 200 === 0) console.error(`  …checked ${done}/${items.length}`)
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker))

  console.log(`\n=== Broken: ${broken.length} ===`)
  const bByHost = {}
  for (const b of broken) bByHost[host(b.url)] = (bByHost[host(b.url)] ?? 0) + 1
  for (const [h, n] of Object.entries(bByHost).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(5)}  ${h}`)
  console.log('\nFirst 40 broken:')
  for (const b of broken.slice(0, 40)) console.log(`  [${b.status}] ${b.kind} ${b.slug}\n        ${b.url}`)
}

run()
