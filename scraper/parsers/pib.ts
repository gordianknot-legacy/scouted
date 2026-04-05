import * as cheerio from 'cheerio'
import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, dedup, stripTags } from './utils.js'

/**
 * Parser for PIB (Press Information Bureau) — pib.gov.in.
 * Fetches Ministry of Education press releases.
 * All items are type: 'government' — K-12 school education focus.
 */

const PIB_URL = 'https://pib.gov.in/allRel.aspx'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

// Higher-education terms to reject at parser level
const HIGHER_ED_REJECT = [
  'iit ', 'iim ', 'university', 'universities', 'college admission',
  'postgraduate', 'phd', 'doctoral', 'ugc ', 'aicte ',
  'higher education', 'national institute of technology',
]

function isHigherEdOnly(text: string): boolean {
  const lower = text.toLowerCase()
  // Reject if it mentions higher-ed terms but NOT K-12 terms
  const hasHigherEd = HIGHER_ED_REJECT.some(t => lower.includes(t))
  if (!hasHigherEd) return false
  const hasK12 = ['school', 'k-12', 'primary', 'secondary', 'fln', 'literacy', 'numeracy',
    'anganwadi', 'ecce', 'samagra shiksha', 'nep 2020'].some(t => lower.includes(t))
  return !hasK12
}

export async function parsePib(_url: string): Promise<RawOpportunity[]> {
  const items: RawOpportunity[] = []

  try {
    // PIB lists press releases — fetch the main page
    const res = await fetch(PIB_URL, { headers: HEADERS, signal: AbortSignal.timeout(15000) })
    if (!res.ok) {
      console.warn(`[PIB] Returned ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    // PIB uses content_area div with list items or table rows for press releases
    // Try common patterns: ul li a, table tr td a, .content_area a
    const links: Array<{ title: string; href: string; date: string }> = []

    $('ul.list-group li a, .content_area a, table.table a').each((_, el) => {
      const $el = $(el)
      const title = $el.text().trim()
      const href = $el.attr('href')
      if (!title || !href || title.length < 15) return

      // Only keep education-related press releases
      const lower = title.toLowerCase()
      const isEducation = ['education', 'school', 'literacy', 'teacher', 'samagra',
        'nep', 'learning', 'student', 'classroom', 'curriculum', 'ncert',
        'cbse', 'kendriya vidyalaya', 'navodaya', 'mid-day meal', 'pm poshan',
        'anganwadi', 'ecce', 'foundational'].some(k => lower.includes(k))

      if (!isEducation) return
      if (isHigherEdOnly(title)) return

      const fullUrl = href.startsWith('http') ? href : `https://pib.gov.in/${href}`

      // Try to extract date from sibling elements
      const dateText = $el.parent().find('.date, .pib-date, time').text().trim() ||
                       $el.closest('tr').find('td:last-child').text().trim() || ''

      links.push({ title, href: fullUrl, date: dateText })
    })

    console.log(`[PIB] Found ${links.length} education-related releases`)

    // Take up to 20 most recent
    for (const link of links.slice(0, 20)) {
      if (isHigherEdOnly(link.title)) continue

      items.push({
        title: link.title.substring(0, 300),
        source_url: link.href,
        description: link.title,
        deadline: null,
        poc_email: null,
        tags: extractTags(link.title),
        organisation: 'Ministry of Education',
        amount: null,
        location: 'India',
        type: 'government',
        source_name: 'PIB',
      })
    }
  } catch (err) {
    console.error('[PIB] Error:', err)
  }

  console.log(`[PIB] Total items: ${items.length}`)
  return dedup(items)
}
