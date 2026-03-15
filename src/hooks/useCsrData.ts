import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CsrSpendingRecord } from '../types'

export function useCsrData(fiscalYear: string = '2023-24') {
  return useQuery<CsrSpendingRecord[]>({
    queryKey: ['csr_spending', fiscalYear],
    queryFn: async () => {
      if (!supabase) return []

      // Supabase default limit is 1000 rows — fetch all with pagination
      const all: CsrSpendingRecord[] = []
      const pageSize = 1000
      let from = 0

      while (true) {
        const { data, error } = await supabase
          .from('csr_spending')
          .select('*')
          .eq('fiscal_year', fiscalYear)
          .order('spend_inr', { ascending: false })
          .range(from, from + pageSize - 1)

        if (error) throw error
        if (!data || data.length === 0) break
        all.push(...(data as CsrSpendingRecord[]))
        if (data.length < pageSize) break
        from += pageSize
      }

      return all
    },
    staleTime: 10 * 60 * 1000,
  })
}
