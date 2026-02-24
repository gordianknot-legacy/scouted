/**
 * CSR Spending Upsert Script
 *
 * Reads JSON output from the MCA CSR scraper, validates, deduplicates,
 * and upserts to Supabase csr_spending table.
 *
 * Usage:
 *   npx tsx csr-upsert.ts --file csr_report_23_24.json
 *   npx tsx csr-upsert.ts --file csr_report_23_24.json --fy 2023-24
 *   echo '[{...}]' | npx tsx csr-upsert.ts
 */

import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Load .env from project root (needed for local runs outside GitHub Actions)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

interface CsrInputItem {
  Company?: string
  CIN?: string
  Field?: string
  Spend_INR?: number | string
}

interface CsrDbRow {
  company: string
  cin: string
  field: string
  spend_inr: number
  fiscal_year: string
}

function getFiscalYear(): string {
  const fyIdx = process.argv.indexOf('--fy')
  if (fyIdx !== -1 && process.argv[fyIdx + 1]) {
    return process.argv[fyIdx + 1]
  }
  return '2023-24'
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

function validate(items: CsrInputItem[], fiscalYear: string): CsrDbRow[] {
  const valid: CsrDbRow[] = []

  for (const item of items) {
    if (!item.Company || typeof item.Company !== 'string' || !item.Company.trim()) {
      console.warn(`  SKIP: missing Company — ${JSON.stringify(item).slice(0, 80)}`)
      continue
    }
    if (!item.CIN || typeof item.CIN !== 'string' || !item.CIN.trim()) {
      console.warn(`  SKIP: missing CIN — "${item.Company}"`)
      continue
    }
    if (!item.Field || typeof item.Field !== 'string' || !item.Field.trim()) {
      console.warn(`  SKIP: missing Field — "${item.Company}"`)
      continue
    }

    const spend = typeof item.Spend_INR === 'string'
      ? parseFloat(item.Spend_INR.replace(/,/g, ''))
      : Number(item.Spend_INR)

    if (isNaN(spend)) {
      console.warn(`  SKIP: invalid Spend_INR — "${item.Company}" / "${item.Field}"`)
      continue
    }

    valid.push({
      company: item.Company.trim(),
      cin: item.CIN.trim(),
      field: item.Field.trim(),
      spend_inr: spend,
      fiscal_year: fiscalYear,
    })
  }

  return valid
}

function dedup(items: CsrDbRow[]): CsrDbRow[] {
  const seen = new Set<string>()
  const unique: CsrDbRow[] = []

  for (const item of items) {
    const key = `${item.cin.toLowerCase()}|${item.field.toLowerCase()}|${item.fiscal_year}`
    if (seen.has(key)) {
      console.warn(`  DEDUP: "${item.company}" / "${item.field}"`)
      continue
    }
    seen.add(key)
    unique.push(item)
  }

  return unique
}

async function main() {
  const fiscalYear = getFiscalYear()
  console.log(`\n=== CSR Spending → ScoutEd Upsert (FY ${fiscalYear}) ===\n`)

  // 1. Read input
  let raw: string
  try {
    raw = readInput()
  } catch {
    console.error('Error reading input. Use --file <path> or pipe JSON via stdin.')
    process.exit(1)
  }

  let items: CsrInputItem[]
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
  const valid = validate(items, fiscalYear)
  console.log(`Validated: ${valid.length} items (${items.length - valid.length} skipped)`)

  if (valid.length === 0) {
    console.log('\nNo valid CSR records to upsert. Done.')
    process.exit(0)
  }

  // 3. Deduplicate
  const unique = dedup(valid)
  console.log(`After dedup: ${unique.length} items`)

  // 4. Upsert to Supabase (dynamic import so dotenv loads first)
  const { createClient } = await import('@supabase/supabase-js')

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  console.log(`\nUpserting ${unique.length} CSR records...`)
  let inserted = 0

  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50)
    const { error, data } = await supabase
      .from('csr_spending')
      .upsert(chunk, { onConflict: 'cin,field,fiscal_year', ignoreDuplicates: false })
      .select('id')

    if (error) {
      console.error(`Upsert error (chunk ${i}):`, error.message)
    } else {
      inserted += data?.length || 0
    }
  }

  console.log(`Upserted: ${inserted} rows`)
  console.log('\n=== Done ===\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
