import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, extractAmount, dedup } from './utils.js'

/**
 * Parser for Grants.gov API (US federal grants).
 * Uses the public search API — no authentication required.
 * Post-filters for India + education relevance (expect 0-5 items per run).
 */

const API_URL = 'https://api.grants.gov/v1/api/search2'
const SEARCH_QUERIES = ['education India', 'education South Asia']

interface GrantsGovResult {
  oppTitle: string
  description: string
  closeDate: string | null
  awardCeiling: number
  agencyCode: string
  id: string
}

interface GrantsGovResponse {
  oppHits: GrantsGovResult[]
  hitCount: number
}

const INDIA_KEYWORDS = [
  'india', 'indian', 'south asia', 'subcontinent', 'developing countr',
  'lmic', 'low-income countr', 'global south',
  'uttar pradesh', 'madhya pradesh', 'haryana', 'gujarat', 'rajasthan',
  'bihar', 'odisha', 'jharkhand', 'maharashtra', 'delhi',
]

const EDUCATION_KEYWORDS = [
  'education', 'school', 'teacher', 'literacy', 'numeracy', 'learning',
  'classroom', 'curriculum', 'student', 'scholarship', 'fellowship',
  'early childhood', 'k-12', 'pedagog',
]

function isIndiaRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  return INDIA_KEYWORDS.some(k => lower.includes(k))
}

function isEducationRelevantText(text: string): boolean {
  const lower = text.toLowerCase()
  return EDUCATION_KEYWORDS.some(k => lower.includes(k))
}

export async function parseGrantsGov(_url: string): Promise<RawOpportunity[]> {
  const allResults: RawOpportunity[] = []

  for (const keyword of SEARCH_QUERIES) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          oppStatuses: 'forecasted|posted',
          rows: 50,
          sortBy: 'openDate|desc',
        }),
      })

      if (!res.ok) {
        console.warn(`Grants.gov API returned ${res.status} for "${keyword}"`)
        continue
      }

      const data = await res.json() as GrantsGovResponse
      const hits = data.oppHits || []
      console.log(`[Grants.gov] "${keyword}" returned ${hits.length} results`)

      for (const hit of hits) {
        const searchText = `${hit.oppTitle} ${hit.description || ''}`

        // Require BOTH India AND education relevance
        if (!isIndiaRelevant(searchText)) continue
        if (!isEducationRelevantText(searchText)) continue

        const deadline = hit.closeDate
          ? new Date(hit.closeDate).toISOString().split('T')[0]
          : null

        const amount = hit.awardCeiling > 0
          ? `$${hit.awardCeiling.toLocaleString('en-US')}`
          : null

        allResults.push({
          title: hit.oppTitle.substring(0, 300),
          source_url: `https://www.grants.gov/search-results-detail/${hit.id}`,
          description: (hit.description || hit.oppTitle).substring(0, 2000),
          deadline,
          poc_email: null,
          tags: extractTags(searchText),
          organisation: hit.agencyCode || 'US Federal',
          amount: amount || extractAmount(searchText),
          location: extractLocation(searchText),
        })
      }
    } catch (err) {
      console.error(`[Grants.gov] Error searching "${keyword}":`, err)
    }
  }

  console.log(`[Grants.gov] Total after filtering: ${allResults.length}`)
  return dedup(allResults)
}
