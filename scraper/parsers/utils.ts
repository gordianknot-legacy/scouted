import type { RawOpportunity } from '../scoring.js'

// ─── HTML Utilities ───

export function stripTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Tag Extraction ───
// Canonical superset of all patterns from ngobox, ngobox-rfp, fundsforngos

export function extractTags(text: string): string[] {
  const lower = text.toLowerCase()
  const tags: string[] = []
  if (lower.match(/edtech|ed-tech|digital\s+learning|ict|technology/)) tags.push('EdTech')
  if (lower.match(/fln|foundational\s+lit|foundational\s+num|foundational\s+learn/)) tags.push('FLN / Foundational Literacy')
  if (lower.match(/teacher|educator|pedagog/)) tags.push('Teacher Training')
  if (lower.match(/early\s+childhood|ecce|anganwadi|pre-?school/)) tags.push('Early Childhood')
  if (lower.match(/school\s+governance|school\s+management|school\s+leader/)) tags.push('School Governance')
  if (lower.match(/classroom|instruction|curriculum/)) tags.push('Classroom Instruction')
  if (lower.match(/high\s+potential|gifted|talent/)) tags.push('High Potential Students')
  if (tags.length === 0) tags.push('Education')
  return tags
}

// ─── Location Extraction ───
// Full 28-state + key UT list matching src/lib/constants.ts

const ALL_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
]

export function extractLocation(text: string): string | null {
  const lower = text.toLowerCase()
  for (const state of ALL_STATES) {
    if (lower.includes(state.toLowerCase())) return state
  }
  if (lower.includes('india') || lower.includes('national')) return 'India'
  return null
}

// ─── Date Parsing ───
// Handles multiple formats: "16 Feb 2026", "28 March 2026", "14-Jan-2026"

export function parseDate(text: string): string | null {
  if (!text) return null
  const cleaned = text.replace(/\./g, '').trim()

  // "DD Mon YYYY" or "DD Month YYYY"
  const dmyMatch = cleaned.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (dmyMatch) {
    const d = new Date(`${dmyMatch[2]} ${dmyMatch[1]}, ${dmyMatch[3]}`)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  // "DD-Mon-YYYY" (FundsForNGOs format)
  const dashMatch = cleaned.match(/(\d{1,2})-(\w{3,})-(\d{2,4})/)
  if (dashMatch) {
    const year = dashMatch[3].length === 2 ? `20${dashMatch[3]}` : dashMatch[3]
    const d = new Date(`${dashMatch[2]} ${dashMatch[1]}, ${year}`)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  // Fallback: try native Date parse
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return null
}

// ─── Amount Extraction ───
// Merged patterns from ngobox (currency+amount) and fundsforngos (Indian numbering)

export function extractAmount(text: string): string | null {
  if (!text) return null
  const cleaned = text.trim()

  // Indian numbering: Crore, Lakh
  const crore = cleaned.match(/₹?\s*(\d[\d,.]*)\s*(?:crore|cr)\b/i)
  if (crore) return `₹${crore[1]} Crore`
  const lakh = cleaned.match(/₹?\s*(\d[\d,.]*)\s*(?:lakh|lac)\b/i)
  if (lakh) return `₹${lakh[1]} Lakh`
  const inr = cleaned.match(/(?:INR|₹)\s*(\d[\d,.]+)/i)
  if (inr) return `₹${inr[1]}`

  // International currencies
  const usd = cleaned.match(/(\d[\d,.]+)\s*(?:USD|US\s*Dollar)/i)
  if (usd) return `$${usd[1]}`
  const dollarSign = cleaned.match(/\$\s*(\d[\d,.]*)\s*(million|m\b|billion|b\b|thousand|k\b)?/i)
  if (dollarSign) return `$${dollarSign[1]}${dollarSign[2] ? ' ' + dollarSign[2] : ''}`
  const eur = cleaned.match(/€?\s*(\d[\d,.]+)\s*(?:EUR|Euro)/i) || cleaned.match(/€\s*(\d[\d,.]*)\s*(million|m\b)?/i)
  if (eur) return `€${eur[1]}${eur[2] ? ' ' + eur[2] : ''}`
  const gbp = cleaned.match(/(\d[\d,.]+)\s*(?:GBP|Pound)/i)
  if (gbp) return `£${gbp[1]}`
  const jpy = cleaned.match(/(\d[\d,.]+)\s*(?:JPY|Yen)/i)
  if (jpy) return `¥${jpy[1]}`

  // Fallback: if short text looks like an amount
  if (cleaned.length < 60 && cleaned.length > 1 && /\d/.test(cleaned)) return cleaned
  return null
}

// ─── Deduplication ───

export function dedup(opps: RawOpportunity[]): RawOpportunity[] {
  const seen = new Set<string>()
  return opps.filter(o => {
    if (seen.has(o.source_url)) return false
    seen.add(o.source_url)
    return true
  })
}

// ─── Education Relevance Check ───
// Used by fundsforngos to filter /tag/india/ posts

export function isEducationRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  return [
    'education', 'school', 'learning', 'teacher', 'literacy', 'numeracy',
    'edtech', 'classroom', 'child', 'youth', 'fln', 'stem', 'scholarship',
    'fellowship', 'training', 'anganwadi', 'early childhood',
  ].some(k => lower.includes(k))
}
