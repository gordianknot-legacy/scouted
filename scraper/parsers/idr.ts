import * as cheerio from 'cheerio'
import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, extractAmount, dedup, stripTags } from './utils.js'

/**
 * Parser for IDR (India Development Review) — idronline.org.
 * Uses WordPress RSS feeds (no authentication required).
 * Fetches education and philanthropy/CSR feeds for funding-related articles.
 */

const FEEDS = [
  'https://idronline.org/sectors/education/feed',
  'https://idronline.org/themes/philanthropy-csr/feed',
]

const HEADERS = {
  'User-Agent': 'ScoutEd/1.0 (education grant aggregator)',
  'Accept': 'application/rss+xml, application/xml, text/xml',
}

// Keywords that indicate a funding/grant/CSR opportunity (not just a news article)
const FUNDING_KEYWORDS = [
  'grant', 'funding', 'fund ', 'csr', 'philanthrop', 'donat', 'invest',
  'partnership', 'commit', 'million', 'crore', 'lakh', 'foundation',
  'initiative', 'programme', 'launch', 'announce', 'award', 'fellowship',
  'scholarship', 'endow', 'sponsor', 'pledge', 'allocat',
]

function isFundingRelated(text: string): boolean {
  const lower = text.toLowerCase()
  return FUNDING_KEYWORDS.some(k => lower.includes(k))
}

export async function parseIdr(_url: string): Promise<RawOpportunity[]> {
  const allItems: RawOpportunity[] = []

  for (const feedUrl of FEEDS) {
    try {
      const res = await fetch(feedUrl, { headers: HEADERS })
      if (!res.ok) {
        console.warn(`[IDR] Feed returned ${res.status}: ${feedUrl}`)
        continue
      }

      const xml = await res.text()
      const $ = cheerio.load(xml, { xmlMode: true })

      $('item').each((_, el) => {
        const $el = $(el)
        const title = $el.find('title').text().trim()
        const link = $el.find('link').text().trim()
        const description = $el.find('description').text().trim()
        const pubDate = $el.find('pubDate').text().trim()
        const contentEncoded = $el.find('content\\:encoded').text().trim()

        if (!title || !link) return

        // Get categories/tags from RSS
        const categories: string[] = []
        $el.find('category').each((_, cat) => {
          categories.push($(cat).text().trim())
        })

        const fullText = `${title} ${description} ${categories.join(' ')}`

        // Only keep items that mention funding/grants/CSR/philanthropy
        if (!isFundingRelated(fullText)) return

        // Extract description from content:encoded or description
        const descText = contentEncoded
          ? stripTags(contentEncoded).substring(0, 2000)
          : stripTags(description).substring(0, 2000)

        // Parse publication date
        let createdDate: string | null = null
        if (pubDate) {
          const d = new Date(pubDate)
          if (!isNaN(d.getTime())) createdDate = d.toISOString().split('T')[0]
        }

        allItems.push({
          title: title.substring(0, 300),
          source_url: link,
          description: descText || title,
          deadline: null, // News articles don't have deadlines
          poc_email: null,
          tags: extractTags(fullText),
          organisation: 'IDR',
          amount: extractAmount(fullText),
          location: extractLocation(fullText) || 'India',
        })
      })

      console.log(`[IDR] Parsed ${feedUrl.split('/').pop()}: found items`)
    } catch (err) {
      console.error(`[IDR] Error fetching ${feedUrl}:`, err)
    }
  }

  console.log(`[IDR] Total items: ${allItems.length}`)
  return dedup(allItems)
}
