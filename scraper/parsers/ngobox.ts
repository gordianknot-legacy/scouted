import type { RawOpportunity } from '../scoring.js'
import { stripTags, extractTags, extractLocation, parseDate, extractAmount, dedup } from './utils.js'
import { enrichWithDetails } from './detail-fetcher.js'

/**
 * Parser for NGOBox grant listing pages.
 * The HTML is a flat structure — no wrapper per listing.
 * Pattern: <a href="full_grant_announcement_...">Title</a>, then org name text,
 * then <img>, then <strong>Deadline:</strong> date text, then possibly <strong>Grant Amount:</strong>.
 * Strategy: split page HTML by grant links and parse each block.
 */
export async function parseNgobox(url: string): Promise<RawOpportunity[]> {
  const opportunities: RawOpportunity[] = []
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }

  try {
    // Fetch the main page
    const res = await fetch(url, { headers })
    if (!res.ok) {
      console.warn(`NGOBox returned ${res.status} for ${url}`)
      return []
    }

    const html = await res.text()
    parseGrantsFromHtml(html, opportunities)

    // For listing pages, fetch additional pages via URL pagination (up to 5 pages)
    if (url.includes('listing.php')) {
      const totalPageMatch = html.match(/total_page\s*=\s*['"]?(\d+)['"]?/i)
      const totalPages = totalPageMatch ? Math.min(parseInt(totalPageMatch[1]), 5) : 1

      for (let page = 2; page <= totalPages; page++) {
        try {
          const pageUrl = `${url}?page=${page}`
          const pageRes = await fetch(pageUrl, { headers })
          if (pageRes.ok) {
            const pageHtml = await pageRes.text()
            parseGrantsFromHtml(pageHtml, opportunities)
          }
        } catch {
          // Skip failed pages silently
        }
      }
    }
  } catch (err) {
    console.error(`Error parsing NGOBox (${url}):`, err)
  }

  const deduped = dedup(opportunities)
  return enrichWithDetails(deduped, { sourceName: 'NGOBox Grants' })
}

function parseGrantsFromHtml(html: string, opportunities: RawOpportunity[]) {
  const linkPattern = /<a\s[^>]*href=["']([^"']*full_grant_announcement_[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  const matches = [...html.matchAll(linkPattern)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const href = match[1]
    const title = stripTags(match[2]).trim()

    if (!title || title.length < 10) continue

    const fullUrl = href.startsWith('http') ? href : `https://ngobox.org/${href.replace(/^\//, '')}`

    // Get the text block between this match and the next match (or end)
    const startIdx = match.index! + match[0].length
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : startIdx + 2000
    const blockHtml = html.substring(startIdx, Math.min(endIdx, startIdx + 2000))
    const blockText = stripTags(blockHtml)

    // Extract deadline
    const deadlineMatch = blockText.match(/Deadline:\s*(\d{1,2}\s+\w+\.?\s+\d{4})/i) ||
                          blockHtml.match(/Deadline:<\/strong>\s*(\d{1,2}\s+\w+\.?\s+\d{4})/i)
    const deadline = deadlineMatch ? parseDate(deadlineMatch[1]) : null

    // Extract grant amount
    const amountMatch = blockText.match(/Grant\s*Amount:\s*([^\n]+)/i) ||
                        blockHtml.match(/Grant\s*Amount:<\/strong>\s*([^<\n]+)/i)
    const amount = amountMatch ? extractAmount(amountMatch[1].trim()) : null

    // Extract organisation — first meaningful text before noise markers
    const orgText = blockText.trim().split(/Deadline:|Grant\s*Amount:|Add to Google|#st |\.stbtn|Fellowships|img\{/i)[0].trim()
    const orgClean = orgText.replace(/[-–|#{}]/g, '').replace(/\s+/g, ' ').trim().substring(0, 80)
    const organisation = orgClean.length > 3 ? orgClean : null

    const tags = extractTags(title)

    opportunities.push({
      title: title.substring(0, 300),
      source_url: fullUrl,
      description: title.substring(0, 1000),
      deadline,
      poc_email: null,
      tags,
      organisation: organisation || 'NGOBox',
      amount,
      location: extractLocation(title + ' ' + blockText),
    })
  }
}
