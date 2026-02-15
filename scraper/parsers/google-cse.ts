import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, extractAmount, dedup, stripTags } from './utils.js'

/**
 * Parser for Google Custom Search API.
 * Searches across curated domains for India education funding news.
 * Requires GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID environment variables.
 * Free tier: 100 queries/day (we use ~8-16 queries).
 *
 * NOTE: Google Custom Search JSON API sunsets 1 Jan 2027.
 * Plan migration to direct RSS/HTML scraping by late 2026.
 */

const API_URL = 'https://www.googleapis.com/customsearch/v1'

const SEARCH_QUERIES = [
  'education grant India',
  'CSR education funding India',
  'foundation grant K-12 India',
  'philanthropy education India announcement',
  'FLN literacy numeracy India funding',
  'edtech India investment grant',
  'education scholarship fellowship India',
  'early childhood education India fund',
]

interface CseItem {
  title: string
  link: string
  snippet: string
  displayLink: string
  pagemap?: {
    metatags?: Array<{
      'og:title'?: string
      'og:description'?: string
      'article:published_time'?: string
    }>
  }
}

interface CseResponse {
  items?: CseItem[]
  searchInformation?: {
    totalResults: string
  }
}

export async function parseGoogleCse(_url: string): Promise<RawOpportunity[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY
  const cseId = process.env.GOOGLE_CSE_ID

  if (!apiKey || !cseId) {
    console.log('[Google CSE] Skipping — GOOGLE_CSE_API_KEY or GOOGLE_CSE_ID not set')
    return []
  }

  const allItems: RawOpportunity[] = []

  for (const query of SEARCH_QUERIES) {
    try {
      const params = new URLSearchParams({
        key: apiKey,
        cx: cseId,
        q: query,
        dateRestrict: 'd7', // Past week (wider net than d1 since we run daily)
        gl: 'in',
        num: '10',
      })

      const res = await fetch(`${API_URL}?${params}`)
      if (!res.ok) {
        if (res.status === 429) {
          console.warn('[Google CSE] Rate limited — stopping queries')
          break
        }
        console.warn(`[Google CSE] API returned ${res.status} for "${query}"`)
        continue
      }

      const data = await res.json() as CseResponse
      const items = data.items || []

      for (const item of items) {
        const fullText = `${item.title} ${item.snippet || ''}`

        // Extract better description from OG tags if available
        const ogDesc = item.pagemap?.metatags?.[0]?.['og:description']
        const description = ogDesc || item.snippet || item.title

        allItems.push({
          title: item.title.substring(0, 300),
          source_url: item.link,
          description: stripTags(description).substring(0, 2000),
          deadline: null,
          poc_email: null,
          tags: extractTags(fullText),
          organisation: item.displayLink,
          amount: extractAmount(fullText),
          location: extractLocation(fullText),
        })
      }

      // Small delay between queries to be polite
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error(`[Google CSE] Error for "${query}":`, err)
    }
  }

  console.log(`[Google CSE] Total items: ${allItems.length}`)
  return dedup(allItems)
}
