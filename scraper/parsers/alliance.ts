import * as cheerio from 'cheerio'
import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, extractAmount, dedup, stripTags } from './utils.js'

/**
 * Parser for Alliance Magazine — alliancemagazine.org.
 * Uses RSS feed for general coverage + search page scraping for India-specific content.
 * Full article text available in RSS content:encoded field.
 */

const RSS_URL = 'https://alliancemagazine.org/feed'
const SEARCH_URL = 'https://alliancemagazine.org/?s=india+education+funding'

const HEADERS = {
  'User-Agent': 'ScoutEd/1.0 (education grant aggregator)',
}

const INDIA_KEYWORDS = [
  'india', 'indian', 'south asia', 'global south', 'developing countr',
  'lmic', 'asia',
]

const EDUCATION_FUNDING_KEYWORDS = [
  'education', 'school', 'literacy', 'learning', 'teacher',
  'grant', 'funding', 'fund', 'philanthrop', 'csr', 'foundation',
  'donat', 'invest', 'partnership', 'million', 'billion',
  'early childhood', 'k-12', 'edtech', 'scholarship',
]

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  const hasIndia = INDIA_KEYWORDS.some(k => lower.includes(k))
  const hasEducation = EDUCATION_FUNDING_KEYWORDS.some(k => lower.includes(k))
  return hasIndia && hasEducation
}

export async function parseAlliance(_url: string): Promise<RawOpportunity[]> {
  const allItems: RawOpportunity[] = []

  // 1. Parse RSS feed
  try {
    const res = await fetch(RSS_URL, {
      headers: { ...HEADERS, 'Accept': 'application/rss+xml, application/xml, text/xml' },
    })
    if (res.ok) {
      const xml = await res.text()
      const $ = cheerio.load(xml, { xmlMode: true })

      $('item').each((_, el) => {
        const $el = $(el)
        const title = $el.find('title').text().trim()
        const link = $el.find('link').text().trim()
        const description = $el.find('description').text().trim()
        const contentEncoded = $el.find('content\\:encoded').text().trim()

        if (!title || !link) return

        const categories: string[] = []
        $el.find('category').each((_, cat) => {
          categories.push($(cat).text().trim())
        })

        const fullText = `${title} ${description} ${categories.join(' ')}`
        if (!isRelevant(fullText)) return

        const descText = contentEncoded
          ? stripTags(contentEncoded).substring(0, 2000)
          : stripTags(description).substring(0, 2000)

        allItems.push({
          title: title.substring(0, 300),
          source_url: link,
          description: descText || title,
          deadline: null,
          poc_email: null,
          tags: extractTags(fullText),
          organisation: 'Alliance Magazine',
          amount: extractAmount(fullText),
          location: extractLocation(fullText),
        })
      })

      console.log(`[Alliance] RSS items after filter: ${allItems.length}`)
    }
  } catch (err) {
    console.error('[Alliance] RSS error:', err)
  }

  // 2. Scrape search results page for India + education + funding content
  try {
    const res = await fetch(SEARCH_URL, { headers: HEADERS })
    if (res.ok) {
      const html = await res.text()
      const $ = cheerio.load(html)

      // WordPress search results are typically article elements
      $('article, .post, .entry, .search-result').each((_, el) => {
        const $el = $(el)
        const titleEl = $el.find('h2 a, h3 a, .entry-title a').first()
        const title = titleEl.text().trim()
        const link = titleEl.attr('href')

        if (!title || !link) return

        const excerpt = $el.find('.entry-summary, .entry-content, .excerpt, p').first().text().trim()
        const fullText = `${title} ${excerpt}`

        allItems.push({
          title: title.substring(0, 300),
          source_url: link,
          description: (excerpt || title).substring(0, 2000),
          deadline: null,
          poc_email: null,
          tags: extractTags(fullText),
          organisation: 'Alliance Magazine',
          amount: extractAmount(fullText),
          location: extractLocation(fullText),
        })
      })

      console.log(`[Alliance] Total after search scrape: ${allItems.length}`)
    }
  } catch (err) {
    console.error('[Alliance] Search scrape error:', err)
  }

  return dedup(allItems)
}
