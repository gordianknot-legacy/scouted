import type { RawOpportunity } from '../scoring.js'

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

  return dedup(opportunities)
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
    const deadline = deadlineMatch ? parseNgoboxDate(deadlineMatch[1]) : null

    // Extract grant amount
    const amountMatch = blockText.match(/Grant\s*Amount:\s*([^\n]+)/i) ||
                        blockHtml.match(/Grant\s*Amount:<\/strong>\s*([^<\n]+)/i)
    const amount = amountMatch ? formatAmount(amountMatch[1].trim()) : null

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

function stripTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseNgoboxDate(text: string): string | null {
  if (!text) return null
  const cleaned = text.replace(/\./g, '').trim()
  // Try: "16 Feb 2026" or "28 March 2026"
  const match = cleaned.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (match) {
    const d = new Date(`${match[2]} ${match[1]}, ${match[3]}`)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return null
}

function formatAmount(raw: string | null): string | null {
  if (!raw) return null
  const cleaned = raw.trim()
  const usd = cleaned.match(/(\d[\d,.]+)\s*(?:USD|US\s*Dollar)/i)
  if (usd) return `$${usd[1]}`
  const eur = cleaned.match(/(\d[\d,.]+)\s*(?:EUR|Euro)/i)
  if (eur) return `€${eur[1]}`
  const gbp = cleaned.match(/(\d[\d,.]+)\s*(?:GBP|Pound)/i)
  if (gbp) return `£${gbp[1]}`
  const jpy = cleaned.match(/(\d[\d,.]+)\s*(?:JPY|Yen)/i)
  if (jpy) return `¥${jpy[1]}`
  const inr = cleaned.match(/(?:INR|₹)\s*(\d[\d,.]+)/i)
  if (inr) return `₹${inr[1]}`
  if (cleaned.length < 60 && cleaned.length > 1) return cleaned
  return null
}

const EDUCATION_KEYWORDS = ['education', 'school', 'learning', 'teacher', 'literacy', 'numeracy', 'edtech', 'classroom', 'child', 'youth', 'fln', 'stem', 'skill', 'training', 'fellowship', 'scholarship']

function extractTags(text: string): string[] {
  const lower = text.toLowerCase()
  const tags: string[] = []
  if (lower.match(/edtech|ed-tech|digital\s+learning|ict/)) tags.push('EdTech')
  if (lower.match(/fln|foundational\s+lit|foundational\s+num|foundational\s+learn/)) tags.push('Foundational Literacy')
  if (lower.match(/teacher|educator|pedagog/)) tags.push('Teacher Training')
  if (lower.match(/early\s+childhood|ecce|anganwadi|pre-?school/)) tags.push('Early Childhood')
  if (lower.match(/school\s+governance|school\s+management|school\s+leader/)) tags.push('School Governance')
  if (lower.match(/classroom|instruction|curriculum/)) tags.push('Classroom Instruction')
  if (tags.length === 0 && EDUCATION_KEYWORDS.some(k => lower.includes(k))) tags.push('Education')
  if (tags.length === 0) tags.push('Education')
  return tags
}

const STATES = ['Uttar Pradesh', 'Madhya Pradesh', 'Haryana', 'Gujarat', 'Rajasthan', 'Odisha', 'Jharkhand', 'Himachal Pradesh', 'Maharashtra', 'Bihar', 'Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Kerala', 'West Bengal', 'Punjab', 'Assam', 'Chhattisgarh']

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
