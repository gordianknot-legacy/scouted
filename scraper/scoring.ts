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
}

export function calculateScore(opp: RawOpportunity): number {
  let score = 0
  const text = `${opp.title} ${opp.description} ${opp.tags.join(' ')}`.toLowerCase()

  // Sector match (+30)
  if (CSF_SECTORS.some(s => text.includes(s.toLowerCase()))) {
    score += 30
  }

  // Geography match (+20)
  const loc = (opp.location || '').toLowerCase()
  if (CSF_PRIORITY_STATES.some(s => text.includes(s.toLowerCase()) || loc.includes(s.toLowerCase()))) {
    score += 20
  }

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

  return Math.min(100, score)
}
