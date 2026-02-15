import * as cheerio from 'cheerio'
import type { RawOpportunity } from '../scoring.js'

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
        deadline = parseFfnDate(deadlineMatch[1])
      }
      // Also check for "Ongoing" to flag as no deadline
      const isOngoing = desc.match(/Deadline:\s*Ongoing/i)

      // Date from time element or .entry-date
      const postDate = $el.find('time, .entry-date, .published').first().attr('datetime') ||
                       $el.find('time, .entry-date, .published').first().text().trim()

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

  return opportunities
}

function parseFfnDate(text: string): string | null {
  if (!text) return null
  // Format: "14-Jan-2026" or "28-Feb-2026"
  const parts = text.split('-')
  if (parts.length === 3) {
    const d = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  return null
}

function isEducationRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  return ['education', 'school', 'learning', 'teacher', 'literacy', 'numeracy', 'edtech', 'classroom', 'child', 'youth', 'fln', 'stem', 'scholarship', 'fellowship', 'training', 'anganwadi', 'early childhood'].some(k => lower.includes(k))
}

function extractTags(text: string): string[] {
  const lower = text.toLowerCase()
  const tags: string[] = []
  if (lower.match(/edtech|ed-tech|digital\s+learning|ict|technology/)) tags.push('EdTech')
  if (lower.match(/fln|foundational\s+lit|foundational\s+num|foundational\s+learn/)) tags.push('Foundational Literacy')
  if (lower.match(/teacher|educator|pedagog/)) tags.push('Teacher Training')
  if (lower.match(/early\s+childhood|ecce|anganwadi|pre-?school/)) tags.push('Early Childhood')
  if (lower.match(/school\s+governance|school\s+management|school\s+leader/)) tags.push('School Governance')
  if (lower.match(/classroom|instruction|curriculum/)) tags.push('Classroom Instruction')
  if (tags.length === 0) tags.push('Education')
  return tags
}

function extractAmount(text: string): string | null {
  const crore = text.match(/₹?\s*(\d[\d,.]*)\s*(?:crore|cr)/i)
  if (crore) return `₹${crore[1]} Crore`
  const lakh = text.match(/₹?\s*(\d[\d,.]*)\s*(?:lakh|lac)/i)
  if (lakh) return `₹${lakh[1]} Lakh`
  const dollar = text.match(/\$\s*(\d[\d,.]*)\s*(million|m\b|billion|b\b|thousand|k\b)?/i)
  if (dollar) return `$${dollar[1]}${dollar[2] ? ' ' + dollar[2] : ''}`
  const euro = text.match(/€\s*(\d[\d,.]*)\s*(million|m\b)?/i)
  if (euro) return `€${euro[1]}${euro[2] ? ' ' + euro[2] : ''}`
  return null
}

function extractLocation(text: string): string | null {
  const states = ['Uttar Pradesh', 'Madhya Pradesh', 'Haryana', 'Gujarat', 'Rajasthan', 'Odisha', 'Jharkhand', 'Himachal Pradesh', 'Maharashtra', 'Bihar', 'Tamil Nadu', 'Karnataka', 'Punjab', 'Assam', 'Telangana', 'Kerala', 'West Bengal', 'Andhra Pradesh']
  const lower = text.toLowerCase()
  for (const state of states) {
    if (lower.includes(state.toLowerCase())) return state
  }
  if (lower.includes('india')) return 'India'
  return null
}
