import type { RawOpportunity } from '../scoring.js'

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

  return dedup(opportunities)
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

function stripTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDate(text: string): string | null {
  if (!text) return null
  const cleaned = text.replace(/\./g, '').trim()
  const match = cleaned.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (match) {
    const d = new Date(`${match[2]} ${match[1]}, ${match[3]}`)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  return null
}

function extractTags(text: string): string[] {
  const lower = text.toLowerCase()
  const tags: string[] = []
  if (lower.match(/edtech|ed-tech|digital\s+learning|ict/)) tags.push('EdTech')
  if (lower.match(/fln|foundational\s+lit|foundational\s+num/)) tags.push('Foundational Literacy')
  if (lower.match(/teacher|educator|pedagog/)) tags.push('Teacher Training')
  if (lower.match(/early\s+childhood|ecce|anganwadi|pre-?school/)) tags.push('Early Childhood')
  if (lower.match(/school\s+governance|school\s+management/)) tags.push('School Governance')
  if (tags.length === 0) tags.push('Education')
  return tags
}

const STATES = ['Uttar Pradesh', 'Madhya Pradesh', 'Haryana', 'Gujarat', 'Rajasthan', 'Odisha', 'Jharkhand', 'Himachal Pradesh', 'Maharashtra', 'Bihar', 'Tamil Nadu', 'Karnataka', 'Punjab', 'Assam', 'Telangana', 'Kerala', 'West Bengal']

function extractLocation(text: string): string | null {
  const lower = text.toLowerCase()
  for (const state of STATES) {
    if (lower.includes(state.toLowerCase())) return state
  }
  if (lower.includes('india') || lower.includes('national')) return 'India'
  return null
}

function dedup(opps: RawOpportunity[]): RawOpportunity[] {
  const seen = new Set<string>()
  return opps.filter(o => {
    if (seen.has(o.source_url)) return false
    seen.add(o.source_url)
    return true
  })
}
