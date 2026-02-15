import { CSF_PRIORITY_STATES, CSF_SECTORS, FLN_KEYWORDS, SCORE_WEIGHTS } from './constants'

export function applyDecay(baseScore: number, createdAt: string): number {
  const weeks = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
  return Math.max(0, baseScore - weeks * SCORE_WEIGHTS.decayPerWeek)
}

export function calculateRelevanceScore(opportunity: {
  description: string
  location?: string | null
  amount?: string | null
  tags?: string[]
}): number {
  let score = 0
  const desc = (opportunity.description + ' ' + (opportunity.tags || []).join(' ')).toLowerCase()

  // Sector match (+30) — includes merged FLN/Foundational Literacy keywords
  const hasSectorMatch = CSF_SECTORS.some(sector => {
    // For the merged FLN sector, check all FLN keywords
    if (sector === 'FLN / Foundational Literacy') {
      return FLN_KEYWORDS.some(kw => desc.includes(kw))
    }
    return desc.includes(sector.toLowerCase())
  })
  if (hasSectorMatch) score += SCORE_WEIGHTS.sectorMatch

  // Geography match (+20) — priority states get bonus
  const location = (opportunity.location || '').toLowerCase()
  const hasGeoMatch = CSF_PRIORITY_STATES.some(state =>
    desc.includes(state.toLowerCase()) || location.includes(state.toLowerCase())
  )
  if (hasGeoMatch) score += SCORE_WEIGHTS.geographyMatch

  // Funding size (+20) - check for amounts > 1 Crore or large international amounts
  const amountStr = (opportunity.amount || '') + ' ' + desc
  const croreMatch = amountStr.match(/(\d+)\s*(?:crore|cr)/i)
  const largeCurrency = amountStr.match(/(?:\$|£|€)\s*(\d[\d,.]*)\s*(?:million|m\b)/i)
  if ((croreMatch && parseInt(croreMatch[1]) >= 1) || largeCurrency) {
    score += SCORE_WEIGHTS.fundingSize
  }

  // Duration (+10) - look for multi-year duration
  const durationMatch = desc.match(/(\d+)\s*(?:year|yr)/i)
  if (durationMatch && parseInt(durationMatch[1]) >= 2) {
    score += SCORE_WEIGHTS.duration
  }

  return Math.min(100, score)
}

export function getScoreColour(score: number): string {
  if (score >= 75) return 'text-csf-lime'
  if (score >= 50) return 'text-csf-yellow'
  return 'text-csf-orange'
}

export function getScoreBgColour(score: number): string {
  if (score >= 75) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-400'
  return 'bg-red-500'
}
