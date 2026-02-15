import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { mockOpportunities } from '../lib/mockData'
import { applyDecay } from '../lib/scoring'
import type { Opportunity, Filters } from '../types'
import { SCORE_THRESHOLDS, FLN_KEYWORDS } from '../lib/constants'

const PAGE_SIZE = 20

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

function clientSideFilter(opportunities: Opportunity[], filters: Filters): Opportunity[] {
  return opportunities.filter(opp => {
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
  const result = useInfiniteQuery({
    queryKey: ['opportunities', filters],
    queryFn: async ({ pageParam = 0 }) => {
      if (!supabase) {
        // Use mock data when Supabase is not configured
        const all = sortByScore(mockOpportunities)
        const filtered = clientSideFilter(all, filters).filter(opp => {
          const decayedScore = applyDecay(opp.relevance_score, opp.created_at)
          if (filters.scoreLevel) {
            if (filters.scoreLevel === 'high' && decayedScore < SCORE_THRESHOLDS.high) return false
            if (filters.scoreLevel === 'medium' && (decayedScore < SCORE_THRESHOLDS.medium || decayedScore >= SCORE_THRESHOLDS.high)) return false
            if (filters.scoreLevel === 'low' && decayedScore >= SCORE_THRESHOLDS.medium) return false
          }
          if (filters.deadlineBefore) {
            if (!opp.deadline || new Date(opp.deadline) > new Date(filters.deadlineBefore)) return false
          }
          return true
        })
        const page = filtered.slice(pageParam, pageParam + PAGE_SIZE)
        return { items: page, nextCursor: pageParam + PAGE_SIZE < filtered.length ? pageParam + PAGE_SIZE : undefined }
      }

      // Build Supabase query with server-side filters
      let query = supabase
        .from('opportunities')
        .select('*')
        .order('relevance_score', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)

      // Score-level filtering at DB level
      if (filters.scoreLevel === 'high') {
        query = query.gte('relevance_score', SCORE_THRESHOLDS.high)
      } else if (filters.scoreLevel === 'medium') {
        query = query.gte('relevance_score', SCORE_THRESHOLDS.medium).lt('relevance_score', SCORE_THRESHOLDS.high)
      } else if (filters.scoreLevel === 'low') {
        query = query.lt('relevance_score', SCORE_THRESHOLDS.medium)
      }

      // Deadline filtering at DB level
      if (filters.deadlineBefore) {
        query = query.lte('deadline', filters.deadlineBefore)
      }

      const { data, error } = await query
      if (error) throw error

      const opportunities = data as Opportunity[]
      // Apply client-side filters (sector, state, text search)
      const filtered = clientSideFilter(opportunities, filters)
      const sorted = sortByScore(filtered)

      return {
        items: sorted,
        nextCursor: data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000,
  })

  // Flatten pages into a single array
  const opportunities = result.data?.pages.flatMap(page => page.items) ?? []

  return {
    data: opportunities,
    isLoading: result.isLoading,
    error: result.error,
    fetchNextPage: result.fetchNextPage,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
  }
}
