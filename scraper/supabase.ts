import { createClient } from '@supabase/supabase-js'
import type { RawOpportunity } from './scoring.js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

export interface DbOpportunity extends RawOpportunity {
  relevance_score: number
}

export async function upsertOpportunities(opportunities: DbOpportunity[]): Promise<number> {
  if (opportunities.length === 0) return 0

  // Batch in chunks of 50
  let inserted = 0
  for (let i = 0; i < opportunities.length; i += 50) {
    const chunk = opportunities.slice(i, i + 50)
    const { error, data } = await supabase
      .from('opportunities')
      .upsert(chunk, { onConflict: 'source_url', ignoreDuplicates: false })
      .select('id')

    if (error) {
      console.error(`Upsert error (chunk ${i}):`, error.message)
    } else {
      inserted += data?.length || 0
    }
  }

  return inserted
}

export { supabase }
