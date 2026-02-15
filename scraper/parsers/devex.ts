import * as cheerio from 'cheerio'
import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, extractAmount, dedup, stripTags } from './utils.js'

/**
 * Parser for Devex — devex.com.
 * Uses RSS feed for article discovery, then extracts JSON-LD metadata from article pages.
 * Respects 10-second crawl delay from robots.txt.
 * Full article text is behind paywall — we use title + description + JSON-LD categories.
 */

const RSS_URL = 'https://devex.com/news/feed.rss'

const HEADERS = {
  'User-Agent': 'ScoutEd/1.0 (education grant aggregator)',
  'Accept': 'application/rss+xml, application/xml, text/xml',
}

// Must match at least one India keyword AND one education/funding keyword
const INDIA_KEYWORDS = [
  'india', 'indian', 'south asia', 'global south', 'developing countr',
  'lmic', 'delhi', 'mumbai',
]

const EDUCATION_FUNDING_KEYWORDS = [
  'education', 'school', 'literacy', 'learning', 'teacher',
  'grant', 'funding', 'fund ', 'philanthrop', 'csr', 'foundation',
  'donat', 'invest', 'partnership', 'million', 'billion',
  'early childhood', 'k-12', 'edtech', 'scholarship', 'fellowship',
]

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  const hasIndia = INDIA_KEYWORDS.some(k => lower.includes(k))
  const hasEducation = EDUCATION_FUNDING_KEYWORDS.some(k => lower.includes(k))
  return hasIndia && hasEducation
}

export async function parseDevex(_url: string): Promise<RawOpportunity[]> {
  const items: RawOpportunity[] = []

  try {
    const res = await fetch(RSS_URL, { headers: HEADERS })
    if (!res.ok) {
      console.warn(`[Devex] RSS returned ${res.status}`)
      return []
    }

    const xml = await res.text()
    const $ = cheerio.load(xml, { xmlMode: true })

    const rssItems: Array<{ title: string; link: string; description: string; pubDate: string }> = []

    $('item').each((_, el) => {
      const $el = $(el)
      rssItems.push({
        title: $el.find('title').text().trim(),
        link: $el.find('link').text().trim(),
        description: $el.find('description').text().trim(),
        pubDate: $el.find('pubDate').text().trim(),
      })
    })

    console.log(`[Devex] RSS returned ${rssItems.length} items`)

    // Filter for India + education/funding relevance
    const relevant = rssItems.filter(item =>
      isRelevant(`${item.title} ${item.description}`)
    )

    console.log(`[Devex] After relevance filter: ${relevant.length}`)

    // For relevant items, fetch article page for JSON-LD metadata
    for (const item of relevant) {
      try {
        // Respect 10s crawl delay
        await new Promise(resolve => setTimeout(resolve, 10000))

        const pageRes = await fetch(item.link, {
          headers: { 'User-Agent': HEADERS['User-Agent'] },
          signal: AbortSignal.timeout(15000),
        })

        if (!pageRes.ok) {
          // Still add with RSS data only
          addItem(items, item, null)
          continue
        }

        const html = await pageRes.text()
        const jsonLd = extractJsonLd(html)
        addItem(items, item, jsonLd)
      } catch {
        // Timeout/network error — add with RSS data only
        addItem(items, item, null)
      }
    }
  } catch (err) {
    console.error('[Devex] Error:', err)
  }

  return dedup(items)
}

interface JsonLdData {
  headline?: string
  description?: string
  articleSection?: string | string[]
  datePublished?: string
  author?: { name?: string }
}

function extractJsonLd(html: string): JsonLdData | null {
  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
  if (!match) return null
  try {
    const data = JSON.parse(match[1])
    if (data['@type'] === 'NewsArticle' || data['@type'] === 'Article') {
      return data as JsonLdData
    }
    return null
  } catch {
    return null
  }
}

function addItem(
  items: RawOpportunity[],
  rssItem: { title: string; link: string; description: string; pubDate: string },
  jsonLd: JsonLdData | null,
) {
  const description = jsonLd?.description || stripTags(rssItem.description) || rssItem.title
  const fullText = `${rssItem.title} ${description}`

  items.push({
    title: rssItem.title.substring(0, 300),
    source_url: rssItem.link,
    description: description.substring(0, 2000),
    deadline: null,
    poc_email: null,
    tags: extractTags(fullText),
    organisation: 'Devex',
    amount: extractAmount(fullText),
    location: extractLocation(fullText),
  })
}
