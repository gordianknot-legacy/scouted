import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CsrGeoRecord } from '../types'

/**
 * Lazy-loads geographic CSR spending for a single company.
 * Only fetches when `enabled` is true (i.e. row is expanded).
 */
export function useCsrGeo(cin: string | null, fiscalYear: string = '2023-24') {
  return useQuery<CsrGeoRecord[]>({
    queryKey: ['csr_spending_geo', cin, fiscalYear],
    queryFn: async () => {
      if (!supabase || !cin) return []

      const all: CsrGeoRecord[] = []
      const pageSize = 1000
      let from = 0

      while (true) {
        const { data, error } = await supabase
          .from('csr_spending_geo')
          .select('*')
          .eq('cin', cin)
          .eq('fiscal_year', fiscalYear)
          .order('spend_inr', { ascending: false })
          .range(from, from + pageSize - 1)

        if (error) throw error
        if (!data || data.length === 0) break
        all.push(...(data as CsrGeoRecord[]))
        if (data.length < pageSize) break
        from += pageSize
      }

      return all
    },
    enabled: !!cin,
    staleTime: 10 * 60 * 1000,
  })
}
