/**
 * OpenClaw Upsert Script
 *
 * Reads JSON output from OpenClaw agent, validates, deduplicates,
 * scores each opportunity, and upserts to Supabase.
 *
 * Usage:
 *   npx tsx openclaw-upsert.ts --file openclaw-results.json
 *   echo '[{...}]' | npx tsx openclaw-upsert.ts
 */

import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Load .env from project root (needed for local runs outside GitHub Actions)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

import type { RawOpportunity } from './scoring.js'
import type { DbOpportunity } from './supabase.js'

interface OpenClawItem {
  title?: string
  source_url?: string
  description?: string
  deadline?: string | null
  poc_email?: string | null
  tags?: string[]
  organisation?: string | null
  amount?: string | null
  location?: string | null
}

function readInput(): string {
  const fileIdx = process.argv.indexOf('--file')
  if (fileIdx !== -1 && process.argv[fileIdx + 1]) {
    const filePath = resolve(process.argv[fileIdx + 1])
    return readFileSync(filePath, 'utf-8')
  }

  // Read from stdin
  return readFileSync(0, 'utf-8')
}

function validate(items: OpenClawItem[]): RawOpportunity[] {
  const valid: RawOpportunity[] = []

  for (const item of items) {
    if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
      console.warn(`  SKIP: missing title — ${JSON.stringify(item).slice(0, 80)}`)
      continue
    }
    if (!item.source_url || typeof item.source_url !== 'string' || !item.source_url.startsWith('http')) {
      console.warn(`  SKIP: invalid source_url — "${item.title}"`)
      continue
    }

    valid.push({
      title: item.title.trim().slice(0, 300),
      source_url: item.source_url.trim(),
      description: (item.description || '').trim().slice(0, 2000),
      deadline: item.deadline || null,
      poc_email: item.poc_email || null,
      tags: Array.isArray(item.tags) ? item.tags : [],
      organisation: item.organisation || null,
      amount: item.amount || null,
      location: item.location || null,
    })
  }

  return valid
}

function dedup(items: RawOpportunity[]): RawOpportunity[] {
  const seen = new Set<string>()
  const unique: RawOpportunity[] = []

  for (const item of items) {
    const key = item.source_url.toLowerCase()
    if (seen.has(key)) {
      console.warn(`  DEDUP: "${item.title.slice(0, 60)}"`)
      continue
    }
    seen.add(key)
    unique.push(item)
  }

  return unique
}

async function main() {
  console.log('\n=== OpenClaw → ScoutEd Upsert ===\n')

  // 1. Read input
  let raw: string
  try {
    raw = readInput()
  } catch (err) {
    console.error('Error reading input. Use --file <path> or pipe JSON via stdin.')
    process.exit(1)
  }

  let items: OpenClawItem[]
  try {
    items = JSON.parse(raw)
    if (!Array.isArray(items)) {
      throw new Error('Expected a JSON array')
    }
  } catch (err) {
    console.error('Invalid JSON input:', (err as Error).message)
    process.exit(1)
  }

  console.log(`Received: ${items.length} items`)

  // 2. Validate
  const valid = validate(items)
  console.log(`Validated: ${valid.length} items (${items.length - valid.length} skipped)`)

  if (valid.length === 0) {
    console.log('\nNo valid opportunities to upsert. Done.')
    process.exit(0)
  }

  // 3. Deduplicate
  const unique = dedup(valid)
  console.log(`After dedup: ${unique.length} items`)

  // 4. Score (dynamic import so dotenv loads first)
  const { calculateScore } = await import('./scoring.js')
  const scored: DbOpportunity[] = unique.map(opp => {
    const score = calculateScore(opp)
    console.log(`  [${String(score).padStart(3)}] ${opp.title.slice(0, 70)}`)
    return { ...opp, relevance_score: score }
  })

  // 5. Upsert to Supabase (dynamic import so dotenv loads first)
  const { upsertOpportunities } = await import('./supabase.js')
  console.log(`\nUpserting ${scored.length} opportunities...`)
  const count = await upsertOpportunities(scored)
  console.log(`Upserted: ${count} rows`)

  console.log('\n=== Done ===\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
