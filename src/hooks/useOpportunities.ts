import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { mockOpportunities } from '../lib/mockData'
import { applyDecay } from '../lib/scoring'
import type { Opportunity, Filters } from '../types'
import { SCORE_THRESHOLDS, FLN_KEYWORDS } from '../lib/constants'

// Check if a tag matches a sector filter, handling the merged FLN sector
function tagMatchesSector(tag: string, sector: string): boolean {
  const tagLower = tag.toLowerCase()
  const sectorLower = sector.toLowerCase()

  // For the merged FLN sector, match any FLN-related tag
  if (sectorLower === 'fln / foundational literacy') {
    return FLN_KEYWORDS.some(kw => tagLower.includes(kw)) || tagLower === 'fln'
  }

  return tagLower.includes(sectorLower)
}

function filterOpportunities(opportunities: Opportunity[], filters: Filters): Opportunity[] {
  return opportunities.filter(opp => {
    const decayedScore = applyDecay(opp.relevance_score, opp.created_at)

    if (filters.scoreLevel) {
      if (filters.scoreLevel === 'high' && decayedScore < SCORE_THRESHOLDS.high) return false
      if (filters.scoreLevel === 'medium' && (decayedScore < SCORE_THRESHOLDS.medium || decayedScore >= SCORE_THRESHOLDS.high)) return false
      if (filters.scoreLevel === 'low' && decayedScore >= SCORE_THRESHOLDS.medium) return false
    }

    if (filters.sectors.length > 0) {
      const hasMatch = filters.sectors.some(sector =>
        opp.tags.some(tag => tagMatchesSector(tag, sector))
      )
      if (!hasMatch) return false
    }

    // State filter: check location field AND description for state mentions
    if (filters.states.length > 0) {
      const searchText = `${opp.location || ''} ${opp.description}`.toLowerCase()
      const hasMatch = filters.states.some(state =>
        searchText.includes(state.toLowerCase())
      )
      if (!hasMatch) return false
    }

    if (filters.deadlineBefore) {
      if (!opp.deadline || new Date(opp.deadline) > new Date(filters.deadlineBefore)) return false
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      const searchable = `${opp.title} ${opp.description} ${opp.organisation || ''} ${opp.tags.join(' ')}`.toLowerCase()
      if (!searchable.includes(q)) return false
    }

    return true
  })
}

function sortByScore(opportunities: Opportunity[]): Opportunity[] {
  return [...opportunities].sort((a, b) => {
    const scoreA = applyDecay(a.relevance_score, a.created_at)
    const scoreB = applyDecay(b.relevance_score, b.created_at)
    return scoreB - scoreA
  })
}

export function useOpportunities(filters: Filters) {
  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: async () => {
      if (!supabase) {
        // Use mock data when Supabase is not configured
        const filtered = filterOpportunities(mockOpportunities, filters)
        return sortByScore(filtered)
      }

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('relevance_score', { ascending: false })

      if (error) throw error
      const filtered = filterOpportunities(data as Opportunity[], filters)
      return sortByScore(filtered)
    },
    staleTime: 5 * 60 * 1000,
  })
}
