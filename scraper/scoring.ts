import { CSF_SECTORS, CSF_PRIORITY_STATES, KNOWN_EDUCATION_FUNDERS } from './config.js'

export interface RawOpportunity {
  title: string
  source_url: string
  description: string
  deadline: string | null
  poc_email: string | null
  tags: string[]
  organisation: string | null
  amount: string | null
  location: string | null
  type?: string
  source_name?: string
  csf_mentioned?: boolean
}

export function calculateScore(opp: RawOpportunity): number {
  let score = 0
  const text = `${opp.title} ${opp.description} ${opp.tags.join(' ')}`.toLowerCase()
  const itemType = opp.type || 'grant'
  const isGrantLike = itemType === 'grant' || itemType === 'rfp'

  // Sector match (+30) — applies to all types
  if (CSF_SECTORS.some(s => text.includes(s.toLowerCase()))) {
    score += 30
  }

  // Geography match (+20) — applies to all types
  const loc = (opp.location || '').toLowerCase()
  if (CSF_PRIORITY_STATES.some(s => text.includes(s.toLowerCase()) || loc.includes(s.toLowerCase()))) {
    score += 20
  }

  if (isGrantLike) {
    // Grant-specific scoring

    // Funding size (+20) — only for ₹1 Crore+ or equivalent
    const amountText = `${opp.amount || ''} ${text}`
    const croreMatch = amountText.match(/(\d+)\s*(?:crore|cr)/i)
    const millionMatch = amountText.match(/(?:\$|£|€)\s*(\d[\d,.]*)\s*(?:million|m\b)/i)
    if ((croreMatch && parseInt(croreMatch[1]) >= 1) || millionMatch) {
      score += 20
    }

    // Known donor/funder (+15)
    const orgText = `${opp.organisation || ''} ${opp.title}`.toLowerCase()
    if (KNOWN_EDUCATION_FUNDERS.some(f => orgText.includes(f))) {
      score += 15
    }

    // Duration (+15)
    const yearMatch = text.match(/(\d+)\s*(?:year|yr)/i)
    if (yearMatch && parseInt(yearMatch[1]) >= 2) {
      score += 15
    }
  } else {
    // News/blog/government scoring

    // Known funder mention (+20, boosted — news from a known funder is high-value intel)
    const orgText = `${opp.organisation || ''} ${opp.title} ${opp.description}`.toLowerCase()
    if (KNOWN_EDUCATION_FUNDERS.some(f => orgText.includes(f))) {
      score += 20
    }

    // Amount mentioned (+15) — any monetary figure signals substance
    const amountText = `${opp.amount || ''} ${text}`
    if (/(?:₹|rs\.?|inr|crore|lakh|\$|£|€)\s*\d/i.test(amountText)) {
      score += 15
    }

    // Recency bonus (+15) — items from last 7 days score higher
    if (opp.deadline) {
      // For news items, deadline field may hold publish date
    }
    // Use a simple heuristic: newly scraped items are recent
    score += 15
  }

  return Math.min(100, score)
}
