/**
 * CSR Deduplication Script
 *
 * Merges duplicate companies (same company filed under two CINs due to
 * re-registration or data entry errors in source). Deletes the drop_cin
 * rows from csr_spending and csr_spending_geo, keeping the keep_cin.
 *
 * Usage:
 *   npx tsx dedup-csr.ts [--dry-run]
 */

import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

interface MergePair {
  keep_cin: string
  drop_cin: string
  keep_name: string
  drop_name: string
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const plan: MergePair[] = JSON.parse(readFileSync(resolve(__dirname, 'dedup_merge_plan.json'), 'utf-8'))

  console.log(`\n=== CSR Deduplication (${plan.length} pairs) ===${dryRun ? ' [DRY RUN]' : ''}\n`)

  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) { console.error('Missing env vars'); process.exit(1) }
  const supabase = createClient(url, key)

  let spendDeleted = 0
  let geoDeleted = 0

  for (const pair of plan) {
    console.log(`${pair.keep_name.slice(0, 50)}`)
    console.log(`  KEEP: ${pair.keep_cin}`)
    console.log(`  DROP: ${pair.drop_cin}`)

    if (dryRun) {
      console.log('  [dry run — skipped]\n')
      continue
    }

    // Delete from csr_spending
    const { data: d1, error: e1 } = await supabase
      .from('csr_spending')
      .delete()
      .eq('cin', pair.drop_cin)
      .select('id')

    if (e1) console.error(`  csr_spending delete error: ${e1.message}`)
    else {
      const count = d1?.length || 0
      spendDeleted += count
      console.log(`  csr_spending: deleted ${count} rows`)
    }

    // Delete from csr_spending_geo
    const { data: d2, error: e2 } = await supabase
      .from('csr_spending_geo')
      .delete()
      .eq('cin', pair.drop_cin)
      .select('id')

    if (e2) console.error(`  csr_spending_geo delete error: ${e2.message}`)
    else {
      const count = d2?.length || 0
      geoDeleted += count
      console.log(`  csr_spending_geo: deleted ${count} rows`)
    }

    console.log()
  }

  console.log(`=== Done ===`)
  console.log(`csr_spending rows deleted: ${spendDeleted}`)
  console.log(`csr_spending_geo rows deleted: ${geoDeleted}`)
  console.log(`Duplicate CINs removed: ${plan.length}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
