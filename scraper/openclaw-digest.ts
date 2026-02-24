/**
 * OpenClaw Digest Script
 *
 * Queries Supabase for recent opportunities and outputs them
 * formatted for WhatsApp (no markdown tables, bold for emphasis).
 *
 * Usage:
 *   npx tsx openclaw-digest.ts              # last 48 hours, top 10
 *   npx tsx openclaw-digest.ts --days 7     # last 7 days
 *   npx tsx openclaw-digest.ts --limit 20   # top 20
 *   npx tsx openclaw-digest.ts --all        # all opportunities
 */

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

function parseArg(flag: string, fallback: number): number {
  const idx = process.argv.indexOf(flag)
  if (idx !== -1 && process.argv[idx + 1]) {
    return parseInt(process.argv[idx + 1], 10) || fallback
  }
  return fallback
}

async function main() {
  const { supabase } = await import('./supabase.js')
  const days = parseArg('--days', 2)
  const limit = parseArg('--limit', 10)
  const showAll = process.argv.includes('--all')

  let query = supabase
    .from('opportunities')
    .select('title, organisation, relevance_score, deadline, amount, location, tags, source_url, created_at')
    .order('relevance_score', { ascending: false })

  if (!showAll) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', since)
  }

  query = query.limit(limit)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching opportunities:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log(`No opportunities found${showAll ? '' : ` in the last ${days} days`}.`)
    process.exit(0)
  }

  // WhatsApp-friendly format (no markdown tables)
  console.log(`*ScoutEd Digest* — ${data.length} opportunities${showAll ? '' : ` (last ${days} days)`}\n`)

  for (let i = 0; i < data.length; i++) {
    const opp = data[i]
    const score = opp.relevance_score ?? 0
    const org = opp.organisation ? ` — ${opp.organisation}` : ''
    const loc = opp.location ? ` | ${opp.location}` : ''
    const amt = opp.amount ? ` | ${opp.amount}` : ''
    const deadline = opp.deadline ? ` | Due: ${opp.deadline}` : ''
    const tags = opp.tags?.length ? opp.tags.join(', ') : ''

    console.log(`*${i + 1}. [${score}] ${opp.title}${org}*`)
    if (tags) console.log(`   ${tags}`)
    if (loc || amt || deadline) console.log(`  ${loc}${amt}${deadline}`.trim())
    console.log(`   ${opp.source_url}`)
    console.log()
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
