/**
 * CSR Bulk Import Script
 *
 * Imports CSR spending data from the external CSV dataset into both
 * csr_spending (aggregated) and csr_spending_geo (state/district detail).
 *
 * Strategy:
 *   - Only imports CINs NOT already in the DB (preserves existing MCA data)
 *   - Skips rows with zero amount_spent
 *   - Converts amounts from Crores to INR
 *   - Normalises state names to title case
 *   - Falls back to sector name when project name is empty/numeric
 *   - Classifies sectors into Education / Vocational / Other
 *
 * Usage:
 *   npx tsx csr-bulk-import.ts --file <path-to-csv>
 *   npx tsx csr-bulk-import.ts --file <path-to-csv> --fy 2023-24 --dry-run
 */

import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

// ── Types ────────────────────────────────────────────────────────────

interface CsvRow {
  fiscal_year: string
  company_name: string
  cin: string
  roc: string
  state: string
  district_as_per_source: string
  district_as_per_lgd: string
  district_lgd_code: string
  csr_project_name: string
  sector: string
  implementation_mode: string
  project_amount_outlay: string
  amount_spent: string
  units: string
  notes: string
}

interface CsrSpendingRow {
  company: string
  cin: string
  field: string
  spend_inr: number
  fiscal_year: string
}

interface CsrGeoRow {
  cin: string
  company: string
  state: string
  district: string
  sector: string
  project: string
  spend_inr: number
  fiscal_year: string
}

// ── Helpers ──────────────────────────────────────────────────────────

const CRORE = 1_00_00_000

function getFiscalYear(): string {
  const idx = process.argv.indexOf('--fy')
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  return '2023-24'
}

function getFilePath(): string {
  const idx = process.argv.indexOf('--file')
  if (idx !== -1 && process.argv[idx + 1]) return resolve(process.argv[idx + 1])
  console.error('Usage: npx tsx csr-bulk-import.ts --file <path-to-csv>')
  process.exit(1)
}

function isDryRun(): boolean {
  return process.argv.includes('--dry-run')
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
}

/** Normalise state names to match MCA convention (Title Case, "And" not "and") */
function normaliseState(raw: string): string {
  if (!raw || !raw.trim()) return ''
  return titleCase(raw.trim())
}

function classify(sector: string): string {
  const s = sector.toLowerCase()
  if (s === 'education' || s === 'special education') return 'Education'
  if (s === 'vocational skills') return 'Vocational'
  return 'Other'
}

/** Clean project name — fallback to sector if empty/numeric */
function cleanProject(name: string, sector: string): string {
  const trimmed = (name || '').trim()
  if (!trimmed || /^\d+$/.test(trimmed)) {
    return sector.trim() || 'Unspecified'
  }
  return trimmed
}

/** Build the field name used in csr_spending table */
function buildField(sector: string, project: string): string {
  const cat = classify(sector)
  if (cat === 'Education') return `Education: ${project}`
  if (cat === 'Vocational') return `Vocational Skills: ${project}`
  return 'Other CSR Fields (Cumulative)'
}

/** Simple CSV parser handling quoted fields with commas */
function parseCSV(text: string): CsvRow[] {
  const lines = text.split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const results: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = values[h] || ''
    }
    results.push(row as unknown as CsvRow)
  }

  return results
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const fiscalYear = getFiscalYear()
  const filePath = getFilePath()
  const dryRun = isDryRun()

  console.log(`\n=== CSR Bulk Import → ScoutEd (FY ${fiscalYear}) ===`)
  if (dryRun) console.log('  *** DRY RUN — no data will be written ***')
  console.log(`\nReading: ${filePath}`)

  const raw = readFileSync(filePath, 'utf-8')
  const allRows = parseCSV(raw)
  const rows = allRows.filter(r => r.fiscal_year === fiscalYear)

  console.log(`Total CSV rows: ${allRows.length}`)
  console.log(`FY ${fiscalYear} rows: ${rows.length}`)

  // ── Connect to Supabase ──
  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const supabase = createClient(url, key)

  // ── Fetch existing CINs from DB ──
  console.log('\nFetching existing CINs from csr_spending...')
  const existingCins = new Set<string>()
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('csr_spending')
      .select('cin')
      .eq('fiscal_year', fiscalYear)
      .range(from, from + pageSize - 1)
    if (error) { console.error('DB fetch error:', error.message); process.exit(1) }
    if (!data || data.length === 0) break
    for (const r of data) existingCins.add(r.cin)
    if (data.length < pageSize) break
    from += pageSize
  }
  console.log(`Existing CINs in DB: ${existingCins.size}`)

  // Also fetch existing CINs from csr_spending_geo
  const existingGeoCins = new Set<string>()
  from = 0
  while (true) {
    const { data, error } = await supabase
      .from('csr_spending_geo')
      .select('cin')
      .eq('fiscal_year', fiscalYear)
      .range(from, from + pageSize - 1)
    if (error) { console.error('DB geo fetch error:', error.message); break }
    if (!data || data.length === 0) break
    for (const r of data) existingGeoCins.add(r.cin)
    if (data.length < pageSize) break
    from += pageSize
  }
  console.log(`Existing CINs in csr_spending_geo: ${existingGeoCins.size}`)

  // ── Filter to new CINs only ──
  const newRows = rows.filter(r => !existingCins.has(r.cin))
  const newCins = new Set(newRows.map(r => r.cin))
  console.log(`\nNew CINs to import: ${newCins.size}`)
  console.log(`Rows for new CINs: ${newRows.length}`)

  // ── Skip zero amounts ──
  const nonZeroRows = newRows.filter(r => {
    const amt = parseFloat(r.amount_spent || '0')
    return !isNaN(amt) && amt > 0
  })
  const zeroSkipped = newRows.length - nonZeroRows.length
  console.log(`Rows after removing zero-amount: ${nonZeroRows.length} (skipped ${zeroSkipped})`)

  // ── Build csr_spending rows (aggregated by CIN + field) ──
  const spendingMap = new Map<string, CsrSpendingRow>()

  for (const r of nonZeroRows) {
    const amtInr = parseFloat(r.amount_spent) * CRORE
    const project = cleanProject(r.csr_project_name, r.sector)
    const field = buildField(r.sector, project)
    const dedupKey = `${r.cin.toLowerCase()}|${field.toLowerCase()}|${fiscalYear}`

    const existing = spendingMap.get(dedupKey)
    if (existing) {
      existing.spend_inr += amtInr
    } else {
      spendingMap.set(dedupKey, {
        company: titleCase(r.company_name.trim()),
        cin: r.cin.trim(),
        field,
        spend_inr: amtInr,
        fiscal_year: fiscalYear,
      })
    }
  }
  const spendingRows = [...spendingMap.values()]
  console.log(`\ncsr_spending rows to upsert: ${spendingRows.length}`)

  // ── Build csr_spending_geo rows ──
  const geoNewRows = nonZeroRows.filter(r => !existingGeoCins.has(r.cin))
  const geoMap = new Map<string, CsrGeoRow>()

  for (const r of geoNewRows) {
    const amtInr = parseFloat(r.amount_spent) * CRORE
    const state = normaliseState(r.state)
    const district = normaliseState(r.district_as_per_source || r.district_as_per_lgd || '')
    const project = cleanProject(r.csr_project_name, r.sector)
    const sector = classify(r.sector)
    const dedupKey = `${r.cin}|${state}|${district}|${project}|${fiscalYear}`.toLowerCase()

    const existing = geoMap.get(dedupKey)
    if (existing) {
      existing.spend_inr += amtInr
    } else {
      geoMap.set(dedupKey, {
        cin: r.cin.trim(),
        company: titleCase(r.company_name.trim()),
        state,
        district,
        sector,
        project,
        spend_inr: amtInr,
        fiscal_year: fiscalYear,
      })
    }
  }
  const geoRows = [...geoMap.values()]
  console.log(`csr_spending_geo rows to upsert: ${geoRows.length}`)

  // ── Stats preview ──
  const newCompanies = new Set(spendingRows.map(r => r.cin))
  const eduRows = spendingRows.filter(r => r.field.startsWith('Education'))
  const vocRows = spendingRows.filter(r => r.field.startsWith('Vocational'))
  const eduTotal = eduRows.reduce((s, r) => s + r.spend_inr, 0)
  const vocTotal = vocRows.reduce((s, r) => s + r.spend_inr, 0)
  const allTotal = spendingRows.reduce((s, r) => s + r.spend_inr, 0)

  console.log(`\n=== Import Preview ===`)
  console.log(`New companies: ${newCompanies.size}`)
  console.log(`Total CSR spend: ₹${(allTotal / CRORE).toFixed(1)} Cr`)
  console.log(`Education spend: ₹${(eduTotal / CRORE).toFixed(1)} Cr (${eduRows.length} rows)`)
  console.log(`Vocational spend: ₹${(vocTotal / CRORE).toFixed(1)} Cr (${vocRows.length} rows)`)

  if (dryRun) {
    console.log('\n*** DRY RUN complete — no data written ***\n')
    return
  }

  // ── Upsert csr_spending ──
  console.log(`\nUpserting ${spendingRows.length} csr_spending rows...`)
  const BATCH = 100
  let spendInserted = 0

  for (let i = 0; i < spendingRows.length; i += BATCH) {
    const chunk = spendingRows.slice(i, i + BATCH)
    const { error, data } = await supabase
      .from('csr_spending')
      .upsert(chunk, { onConflict: 'cin,field,fiscal_year', ignoreDuplicates: false })
      .select('id')

    if (error) {
      console.error(`  csr_spending upsert error (batch ${i}):`, error.message)
    } else {
      spendInserted += data?.length || 0
    }

    // Progress every 1000 rows
    if ((i + BATCH) % 1000 < BATCH) {
      console.log(`  Progress: ${Math.min(i + BATCH, spendingRows.length)} / ${spendingRows.length}`)
    }
  }
  console.log(`csr_spending upserted: ${spendInserted} rows`)

  // ── Upsert csr_spending_geo ──
  console.log(`\nUpserting ${geoRows.length} csr_spending_geo rows...`)
  let geoInserted = 0

  for (let i = 0; i < geoRows.length; i += BATCH) {
    const chunk = geoRows.slice(i, i + BATCH)
    const { error, data } = await supabase
      .from('csr_spending_geo')
      .upsert(chunk, { onConflict: 'cin,state,district,project,fiscal_year', ignoreDuplicates: false })
      .select('id')

    if (error) {
      console.error(`  csr_spending_geo upsert error (batch ${i}):`, error.message)
    } else {
      geoInserted += data?.length || 0
    }

    if ((i + BATCH) % 1000 < BATCH) {
      console.log(`  Progress: ${Math.min(i + BATCH, geoRows.length)} / ${geoRows.length}`)
    }
  }
  console.log(`csr_spending_geo upserted: ${geoInserted} rows`)

  console.log(`\n=== Done ===`)
  console.log(`csr_spending: ${spendInserted} new rows (${newCompanies.size} companies)`)
  console.log(`csr_spending_geo: ${geoInserted} new rows`)
  console.log()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
