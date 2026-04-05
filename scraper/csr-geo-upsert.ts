/**
 * CSR Geographic Spending Upsert Script
 *
 * Reads raw API data from csr_progress.json, preserves state/district
 * granularity, and upserts to Supabase csr_spending_geo table.
 *
 * Usage:
 *   npx tsx csr-geo-upsert.ts
 *   npx tsx csr-geo-upsert.ts --fy 2023-24
 *   npx tsx csr-geo-upsert.ts --file csr_progress.json
 */

import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

interface RawApiRecord {
  cin: string
  company_name: string
  state: string
  district: string
  sector: string
  csr_prjct: string
  amnt_spent: string | number
  fncl_yr: string
  mode: string
  outlay: number
}

interface GeoDbRow {
  cin: string
  company: string
  state: string
  district: string
  sector: string
  project: string
  spend_inr: number
  fiscal_year: string
}

function getFiscalYear(): string {
  const idx = process.argv.indexOf('--fy')
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  return '2023-24'
}

function getInputPath(): string {
  const idx = process.argv.indexOf('--file')
  if (idx !== -1 && process.argv[idx + 1]) return resolve(process.argv[idx + 1])
  return resolve(__dirname, 'csr_progress.json')
}

function classify(sector: string): string {
  const s = sector.toLowerCase()
  if (s.includes('education')) return 'Education'
  if (s.includes('vocational')) return 'Vocational'
  return 'Other'
}

async function main() {
  const fiscalYear = getFiscalYear()
  const inputPath = getInputPath()

  console.log(`\n=== CSR Geographic Data → Supabase (FY ${fiscalYear}) ===\n`)
  console.log(`Reading: ${inputPath}`)

  let raw: { allApiData?: RawApiRecord[]; processedCompanies?: string[] }
  try {
    raw = JSON.parse(readFileSync(inputPath, 'utf-8'))
  } catch (err) {
    console.error('Failed to read input:', (err as Error).message)
    process.exit(1)
  }

  const apiData = raw.allApiData || []
  if (apiData.length === 0) {
    console.log('No API records found. Done.')
    process.exit(0)
  }

  console.log(`Raw API records: ${apiData.length}`)

  // Transform and validate
  const rows: GeoDbRow[] = []
  let skipped = 0

  for (const r of apiData) {
    if (!r.cin || !r.state) {
      skipped++
      continue
    }

    const spend = typeof r.amnt_spent === 'string'
      ? parseFloat(r.amnt_spent.replace(/,/g, ''))
      : Number(r.amnt_spent)

    if (isNaN(spend) || spend <= 0) {
      skipped++
      continue
    }

    rows.push({
      cin: r.cin.trim(),
      company: String(r.company_name || '').trim(),
      state: String(r.state).trim(),
      district: String(r.district || '').trim(),
      sector: classify(String(r.sector || '')),
      project: String(r.csr_prjct || r.sector || 'Unspecified').trim(),
      spend_inr: spend,
      fiscal_year: fiscalYear,
    })
  }

  console.log(`Valid rows: ${rows.length} (skipped: ${skipped})`)

  // Deduplicate by (cin, state, district, project, fiscal_year) — sum amounts
  const dedupMap = new Map<string, GeoDbRow>()
  let merges = 0

  for (const row of rows) {
    const key = `${row.cin}|${row.state}|${row.district}|${row.project}|${row.fiscal_year}`.toLowerCase()
    const existing = dedupMap.get(key)
    if (existing) {
      existing.spend_inr += row.spend_inr
      merges++
    } else {
      dedupMap.set(key, { ...row })
    }
  }

  const unique = [...dedupMap.values()]
  if (merges > 0) console.log(`Merged ${merges} duplicates (amounts summed)`)
  console.log(`After dedup: ${unique.length} rows`)

  // Upsert to Supabase
  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const BATCH = 100
  let inserted = 0

  console.log(`\nUpserting ${unique.length} geo records...`)

  for (let i = 0; i < unique.length; i += BATCH) {
    const chunk = unique.slice(i, i + BATCH)
    const { error, data } = await supabase
      .from('csr_spending_geo')
      .upsert(chunk, { onConflict: 'cin,state,district,project,fiscal_year', ignoreDuplicates: false })
      .select('id')

    if (error) {
      console.error(`Upsert error (batch ${i}):`, error.message)
    } else {
      inserted += data?.length || 0
    }
  }

  console.log(`Upserted: ${inserted} rows`)

  // Stats
  const states = new Set(unique.map(r => r.state))
  const cins = new Set(unique.map(r => r.cin))
  console.log(`\nCoverage: ${cins.size} companies across ${states.size} states`)
  console.log('\n=== Done ===\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
