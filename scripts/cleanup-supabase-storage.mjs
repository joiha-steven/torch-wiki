/**
 * Deletes all files from Supabase Storage bucket "flashlights".
 * Run AFTER migrate-to-vercel-blob.mjs has completed successfully.
 */
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
const BUCKET = 'flashlights'

async function listAll(prefix = '') {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 })
  if (error) throw new Error(error.message)

  const files = []
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name
    if (item.id) {
      // It's a file
      files.push(path)
    } else {
      // It's a folder — recurse
      const children = await listAll(path)
      files.push(...children)
    }
  }
  return files
}

async function cleanup() {
  console.log(`Listing files in bucket "${BUCKET}"…`)
  const files = await listAll()
  console.log(`Found ${files.length} files`)

  if (files.length === 0) {
    console.log('Nothing to delete.')
    return
  }

  // Supabase Storage remove() accepts up to 1000 paths at once
  const CHUNK = 500
  for (let i = 0; i < files.length; i += CHUNK) {
    const batch = files.slice(i, i + CHUNK)
    const { error } = await supabase.storage.from(BUCKET).remove(batch)
    if (error) console.error(`Delete error: ${error.message}`)
    else console.log(`Deleted ${batch.length} files`)
  }

  console.log('Cleanup complete.')
}

cleanup()
