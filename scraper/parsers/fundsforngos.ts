import * as cheerio from 'cheerio'
import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, extractAmount, parseDate, dedup, isEducationRelevant } from './utils.js'
import { enrichWithDetails } from './detail-fetcher.js'

/**
 * Parser for FundsForNGOs — WordPress Genesis framework.
 * Structure: article or .entry elements with h2 a titles,
 * .entry-content or .entry-summary for descriptions.
 * Deadline often embedded as first line: "Deadline: DD-Mon-YYYY"
 */
export async function parseFundsForNgos(url: string): Promise<RawOpportunity[]> {
  const opportunities: RawOpportunity[] = []

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) {
      console.warn(`FundsForNGOs returned ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    // WordPress Genesis uses article elements or .entry class
    $('article, .entry, .type-post').each((_, el) => {
      const $el = $(el)

      // Title and link
      const titleEl = $el.find('h2 a, h3 a, .entry-title a').first()
      const title = titleEl.text().trim()
      const link = titleEl.attr('href')

      if (!title || !link) return

      // Description
      const desc = $el.find('.entry-content p, .entry-summary p, .entry-content, p').first().text().trim()

      // Extract deadline from description text
      const deadlineMatch = desc.match(/Deadline:\s*(\d{1,2}-\w{3}-\d{2,4})/i)
      let deadline: string | null = null
      if (deadlineMatch) {
        deadline = parseDate(deadlineMatch[1])
      }
      // Also check for "Ongoing" to flag as no deadline
      const isOngoing = desc.match(/Deadline:\s*Ongoing/i)

      // Extract category from URL path
      const category = link.split('/').filter(Boolean)[3] || ''
      const tags = extractTags(title + ' ' + desc + ' ' + category)

      // Only keep education-relevant posts when scraping India tag
      const isEducation = isEducationRelevant(title + ' ' + desc + ' ' + category)

      // For the /category/education/ URL, all posts are education
      // For /tag/india/ URL, filter to education only
      if (url.includes('/tag/india/') && !isEducation) return

      opportunities.push({
        title: title.substring(0, 300),
        source_url: link,
        description: (desc || title).substring(0, 1000),
        deadline: isOngoing ? null : deadline,
        poc_email: null,
        tags,
        organisation: 'FundsForNGOs',
        amount: extractAmount(title + ' ' + desc),
        location: extractLocation(title + ' ' + desc),
      })
    })
  } catch (err) {
    console.error('Error parsing FundsForNGOs:', err)
  }

  const deduped = dedup(opportunities)
  return enrichWithDetails(deduped, { sourceName: 'FundsForNGOs' })
}
