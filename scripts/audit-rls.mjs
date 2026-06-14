#!/usr/bin/env node
// Supabase RLS audit — flags tables that expose user data without protection.
// Read-only. Run manually / weekly, NOT in CI: node scripts/audit-rls.mjs
//
// PostgREST won't run arbitrary SQL, so this calls the SECURITY DEFINER function
// public.audit_rls() (see scripts/audit-rls.sql). If it's missing, this prints the
// one-time setup instructions and exits.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"(.*)"$/s, '$1')] })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(2) }

// Columns that signal a table holds user-scoped / personal data.
const USER_DATA_HINTS = ['user_id', 'email', 'nickname', 'code_hash', 'purchase_price']

const supabase = createClient(url, key)

const { data, error } = await supabase.rpc('audit_rls')
if (error) {
  if (/audit_rls/.test(error.message) || error.code === 'PGRST202' || /not exist/i.test(error.message)) {
    console.error('⚠️  The audit_rls() helper is not installed yet.\n')
    console.error('One-time setup: open the Supabase SQL editor and run scripts/audit-rls.sql')
    console.error('(it creates a read-only SECURITY DEFINER function locked to service_role).')
    process.exit(2)
  }
  console.error('RPC error:', error.message)
  process.exit(2)
}

// Which user-data tables exist (best-effort: probe each table's columns via a 0-row select).
async function looksLikeUserData(table) {
  const { data: rows, error: e } = await supabase.from(table).select('*').limit(1)
  if (e || !rows) return false
  const cols = rows[0] ? Object.keys(rows[0]) : []
  return USER_DATA_HINTS.some(h => cols.includes(h))
}

console.log('🔒 Supabase RLS audit — public schema\n')
const pad = s => String(s).padEnd(26)
console.log(`${pad('table')} rls  policies  anon-read  open-write`)
console.log('─'.repeat(64))

const warnings = []
for (const t of data) {
  const rls = t.rls_enabled ? ' on' : 'OFF'
  const line = `${pad(t.table_name)} ${rls}  ${String(t.policy_count).padStart(8)}  ${t.has_anon_read ? '   yes   ' : '   no    '}  ${t.has_open_write ? '  yes' : '  no'}`
  console.log(line)

  if (!t.rls_enabled && await looksLikeUserData(t.table_name)) {
    warnings.push(`${t.table_name}: RLS is OFF but it looks like user data.`)
  }
  // Only flag genuinely-open writes (no USING/WITH CHECK restriction). The
  // standard `auth.uid() = user_id` owner pattern is not reported.
  if (t.has_open_write) {
    warnings.push(`${t.table_name}: a write policy is open to anon/public with no row restriction — confirm this is intentional.`)
  }
  if (t.rls_enabled && t.policy_count === 0) {
    warnings.push(`${t.table_name}: RLS is ON but there are 0 policies — table is fully locked (no access).`)
  }
}

console.log()
if (warnings.length === 0) {
  console.log('✅ No obvious RLS issues.')
  process.exit(0)
}
console.log('⚠️  Review:')
warnings.forEach(w => console.log(`  - ${w}`))
process.exit(1)
