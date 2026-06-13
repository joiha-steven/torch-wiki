#!/usr/bin/env node
// Daily health summary — meant for a cron job / quick glance.
// Runs smoke tests + local code-quality checks and prints a messaging-friendly report.
// Usage: node scripts/health-daily.mjs
import { execSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const today = new Date().toISOString().slice(0, 10)
const lines = []
let actionNeeded = []

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}
function tryRun(cmd) {
  try { return { ok: true, out: run(cmd) } }
  catch (e) { return { ok: false, out: (e.stdout || '') + (e.stderr || ''), code: e.status } }
}

// 1) SMOKE
const smoke = tryRun('node scripts/smoke.mjs')
const smokeSummary = (smoke.out.match(/(\d+)\/(\d+) tests passed/) || [])[0] || 'no output'
if (smoke.ok) lines.push(`Smoke Tests: ${smokeSummary} ✅`)
else { lines.push(`Smoke Tests: ${smokeSummary} ❌`); actionNeeded.push('Some endpoints are failing — run `npm run smoke` to see which.') }

// 2) TYPESCRIPT
const tsc = tryRun('npx tsc --noEmit')
if (tsc.ok) lines.push('TypeScript: 0 errors ✅')
else {
  const errs = (tsc.out.match(/error TS\d+/g) || []).length
  lines.push(`TypeScript: ${errs} errors ❌`)
  actionNeeded.push('TypeScript has errors — run `npx tsc --noEmit`.')
}

// 3) DEPENDENCY AUDIT (prod only)
const audit = tryRun('npm audit --omit=dev --json')
let critHigh = 0
try {
  const j = JSON.parse(audit.out)
  const v = j.metadata?.vulnerabilities || {}
  critHigh = (v.critical || 0) + (v.high || 0)
} catch { /* ignore parse issues */ }
if (critHigh === 0) lines.push('Dependencies: 0 critical/high vulns ✅')
else { lines.push(`Dependencies: ${critHigh} critical/high vulns ❌`); actionNeeded.push('Run `npm audit --omit=dev` and update.') }

// 4) CODE STATS
const SRC_DIRS = ['app', 'components', 'lib']
let files = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p)
    else if (/\.(ts|tsx)$/.test(name)) files.push(p)
  }
}
SRC_DIRS.forEach(d => { try { walk(d) } catch { /* dir may not exist */ } })

let anyCount = 0
let todoCount = 0
let largest = { file: '', lines: 0 }
for (const f of files) {
  const txt = run(`cat "${f}"`)
  const n = txt.split('\n').length
  if (n > largest.lines) largest = { file: f, lines: n }
  anyCount += (txt.match(/:\s*any(\b|\[)/g) || []).length
  todoCount += (txt.match(/\b(TODO|FIXME)\b/g) || []).length
}
lines.push('Code Quality:')
lines.push(`  - \`any\` types: ${anyCount} ${anyCount === 0 ? '✅' : '⚠️'}`)
lines.push(`  - Largest file: ${largest.lines} lines (${largest.file.split('/').pop()}) ${largest.lines <= 400 ? '✅' : '⚠️'}`)
lines.push(`  - TODO/FIXME: ${todoCount} ${todoCount === 0 ? '✅' : '⚠️'}`)
if (largest.lines > 400) actionNeeded.push(`${largest.file} is ${largest.lines} lines (>400) — consider splitting.`)

// 5) GIT
const lastCommit = tryRun('git log -1 --pretty=format:"%h %s (%cr)"').out.trim()
const dirty = tryRun('git status --porcelain').out.trim()
lines.push(`Git: ${dirty ? 'uncommitted changes ⚠️' : 'clean ✅'}, last commit ${lastCommit}`)
if (dirty) actionNeeded.push('There are uncommitted changes — commit or discard them.')

console.log(`🔦 Torch Wiki Daily Health — ${today}\n`)
console.log(lines.join('\n'))
if (actionNeeded.length === 0) console.log('\nAll systems nominal.')
else {
  console.log('\n⚠️ Action needed:')
  actionNeeded.forEach(a => console.log(`  - ${a}`))
}
process.exit(actionNeeded.length === 0 ? 0 : 1)
