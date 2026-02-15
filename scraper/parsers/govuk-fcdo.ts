import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, extractAmount, dedup } from './utils.js'

/**
 * Parser for GOV.UK FCDO (Foreign, Commonwealth & Development Office).
 * Uses the GOV.UK JSON search API — no authentication required.
 * Heavy post-filtering for India + education (expect 0-3 items per run).
 */

const API_URL = 'https://www.gov.uk/api/search.json'

interface GovUkResult {
  title: string
  description: string
  link: string
  organisations: Array<{ title: string }> | undefined
  public_timestamp: string | null
}

interface GovUkResponse {
  results: GovUkResult[]
  total: number
}

const INDIA_KEYWORDS = [
  'india', 'indian', 'south asia', 'subcontinent', 'developing countr',
  'lmic', 'low-income countr', 'global south',
]

const EDUCATION_KEYWORDS = [
  'education', 'school', 'teacher', 'literacy', 'numeracy', 'learning',
  'classroom', 'curriculum', 'student', 'scholarship', 'fellowship',
  'early childhood', 'k-12', 'pedagog', 'girls education',
]

function isIndiaRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  return INDIA_KEYWORDS.some(k => lower.includes(k))
}

function isEducationRelevantText(text: string): boolean {
  const lower = text.toLowerCase()
  return EDUCATION_KEYWORDS.some(k => lower.includes(k))
}

export async function parseGovukFcdo(_url: string): Promise<RawOpportunity[]> {
  const allResults: RawOpportunity[] = []

  try {
    const params = new URLSearchParams({
      filter_organisations: 'foreign-commonwealth-development-office',
      q: 'education india',
      count: '50',
    })

    const res = await fetch(`${API_URL}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ScoutEd/1.0 (education grant aggregator)',
      },
    })

    if (!res.ok) {
      console.warn(`GOV.UK API returned ${res.status}`)
      return []
    }

    const data = await res.json() as GovUkResponse
    const results = data.results || []
    console.log(`[GOV.UK FCDO] API returned ${results.length} results`)

    for (const item of results) {
      const searchText = `${item.title} ${item.description || ''}`

      // Require BOTH India AND education relevance
      if (!isIndiaRelevant(searchText)) continue
      if (!isEducationRelevantText(searchText)) continue

      const sourceUrl = item.link.startsWith('http')
        ? item.link
        : `https://www.gov.uk${item.link}`

      const orgName = item.organisations?.[0]?.title || 'FCDO'

      allResults.push({
        title: item.title.substring(0, 300),
        source_url: sourceUrl,
        description: (item.description || item.title).substring(0, 2000),
        deadline: null, // GOV.UK search results don't include deadlines
        poc_email: null,
        tags: extractTags(searchText),
        organisation: orgName,
        amount: extractAmount(searchText),
        location: extractLocation(searchText),
      })
    }
  } catch (err) {
    console.error('[GOV.UK FCDO] Error:', err)
  }

  console.log(`[GOV.UK FCDO] Total after filtering: ${allResults.length}`)
  return dedup(allResults)
}
