import * as cheerio from 'cheerio'
import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, extractAmount, dedup, stripTags, isEducationRelevant } from './utils.js'

/**
 * Generic RSS parser for Indian education news outlets.
 * Fetches RSS feeds from The Wire, Scroll.in, LiveMint education sections.
 * All items are type: 'news' — filtered to K-12 education only.
 *
 * IMPORTANT: These feeds cover ALL education — higher-ed articles
 * (IIT, IIM, university rankings, college admissions) must be rejected.
 */

interface FeedConfig {
  url: string
  name: string
}

const FEEDS: FeedConfig[] = [
  { url: 'https://thewire.in/education/feed', name: 'The Wire' },
  // Scroll.in doesn't have a clean education RSS — using main feed with education filter
  { url: 'https://scroll.in/rss/feed', name: 'Scroll.in' },
]

const HEADERS = {
  'User-Agent': 'ScoutEd/1.0 (education ecosystem tracker)',
  'Accept': 'application/rss+xml, application/xml, text/xml',
}

// Higher-education terms — reject articles that are ONLY about these
const HIGHER_ED_ONLY = [
  'iit ', 'iim ', 'iiser', 'nit ', 'iiit',
  'university ranking', 'college admission', 'jee ', 'neet ',
  'ugc net', 'gate exam', 'cat exam', 'upsc',
  'postgraduate', 'phd', 'doctoral', 'master\'s degree',
  'higher education commission', 'university grant',
  'campus placement', 'mba ', 'engineering college',
]

// K-12 terms that override higher-ed rejection
const K12_TERMS = [
  'school', 'k-12', 'primary', 'secondary', 'fln',
  'literacy', 'numeracy', 'anganwadi', 'ecce',
  'samagra shiksha', 'nep 2020', 'class 1', 'class 10',
  'cbse', 'icse', 'board exam', 'ncert', 'teacher training',
  'mid-day meal', 'pm poshan', 'kendriya vidyalaya',
]

function isHigherEdOnly(text: string): boolean {
  const lower = text.toLowerCase()
  const hasHigherEd = HIGHER_ED_ONLY.some(t => lower.includes(t))
  if (!hasHigherEd) return false
  return !K12_TERMS.some(t => lower.includes(t))
}

export async function parseIndianNews(_url: string): Promise<RawOpportunity[]> {
  const allItems: RawOpportunity[] = []

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { headers: HEADERS, signal: AbortSignal.timeout(15000) })
      if (!res.ok) {
        console.warn(`[${feed.name}] Feed returned ${res.status}`)
        continue
      }

      const xml = await res.text()
      const $ = cheerio.load(xml, { xmlMode: true })
      let count = 0

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

        const fullText = `${title} ${stripTags(description)} ${categories.join(' ')}`

        // For non-education-specific feeds (Scroll.in), require education relevance
        if (feed.name === 'Scroll.in' && !isEducationRelevant(fullText)) return

        // Reject higher-education-only articles (IIT, IIM, university, etc.)
        if (isHigherEdOnly(fullText)) return

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
          organisation: feed.name,
          amount: extractAmount(fullText),
          location: extractLocation(fullText) || 'India',
          type: 'news',
          source_name: feed.name,
        })

        count++
      })

      console.log(`[${feed.name}] Parsed ${count} education items`)
    } catch (err) {
      console.error(`[${feed.name}] Error:`, err)
    }
  }

  console.log(`[Indian News] Total items: ${allItems.length}`)
  return dedup(allItems)
}
