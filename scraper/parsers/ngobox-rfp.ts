import type { RawOpportunity } from '../scoring.js'
import { stripTags, extractTags, extractLocation, parseDate, dedup } from './utils.js'
import { enrichWithDetails } from './detail-fetcher.js'

/**
 * Parser for NGOBox RFP/EOI page. Same flat structure as grants
 * but links use: full_rfp_eoi_[slug]_[id]
 */
export async function parseNgoboxRfp(url: string): Promise<RawOpportunity[]> {
  const opportunities: RawOpportunity[] = []
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }

  try {
    const res = await fetch(url, { headers })
    if (!res.ok) {
      console.warn(`NGOBox RFP returned ${res.status}`)
      return []
    }

    const html = await res.text()
    parseRfpsFromHtml(html, opportunities)

    // Fetch additional pages via URL pagination (up to 5)
    if (url.includes('listing.php')) {
      const totalPageMatch = html.match(/total_page\s*=\s*['"]?(\d+)['"]?/i)
      const totalPages = totalPageMatch ? Math.min(parseInt(totalPageMatch[1]), 5) : 1

      for (let page = 2; page <= totalPages; page++) {
        try {
          const pageUrl = `${url}?page=${page}`
          const pageRes = await fetch(pageUrl, { headers })
          if (pageRes.ok) {
            const pageHtml = await pageRes.text()
            parseRfpsFromHtml(pageHtml, opportunities)
          }
        } catch {
          // Skip failed pages
        }
      }
    }
  } catch (err) {
    console.error('Error parsing NGOBox RFP:', err)
  }

  const deduped = dedup(opportunities)
  return enrichWithDetails(deduped, { sourceName: 'NGOBox RFP' })
}

function parseRfpsFromHtml(html: string, opportunities: RawOpportunity[]) {
  const linkPattern = /<a\s[^>]*href=["']([^"']*full_rfp_eoi_[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  const matches = [...html.matchAll(linkPattern)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const href = match[1]
    const title = stripTags(match[2]).trim()

    if (!title || title.length < 10) continue

    const fullUrl = href.startsWith('http') ? href : `https://ngobox.org/${href.replace(/^\//, '')}`

    // Block between this match and the next
    const startIdx = match.index! + match[0].length
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : startIdx + 2000
    const blockHtml = html.substring(startIdx, Math.min(endIdx, startIdx + 2000))
    const blockText = stripTags(blockHtml)

    const deadlineMatch = blockText.match(/Deadline:\s*(\d{1,2}\s+\w+\.?\s+\d{4})/i)
    const deadline = deadlineMatch ? parseDate(deadlineMatch[1]) : null

    const orgText = blockText.trim().split(/Deadline:|Grant\s*Amount:|Add to Google/i)[0].trim()
    const orgClean = orgText.replace(/[-–|#]/g, '').replace(/\s+/g, ' ').trim().substring(0, 80)
    const organisation = orgClean.length > 3 ? orgClean : null

    opportunities.push({
      title: title.substring(0, 300),
      source_url: fullUrl,
      description: title.substring(0, 1000),
      deadline,
      poc_email: null,
      tags: extractTags(title),
      organisation: organisation || 'NGOBox RFP',
      amount: null,
      location: extractLocation(title + ' ' + blockText),
    })
  }
}
