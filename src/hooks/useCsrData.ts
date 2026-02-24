import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CsrSpendingRecord } from '../types'

export function useCsrData(fiscalYear: string = '2023-24') {
  return useQuery<CsrSpendingRecord[]>({
    queryKey: ['csr_spending', fiscalYear],
    queryFn: async () => {
      if (!supabase) return []

      const { data, error } = await supabase
        .from('csr_spending')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .order('spend_inr', { ascending: false })

      if (error) throw error
      return data as CsrSpendingRecord[]
    },
    staleTime: 10 * 60 * 1000,
  })
}
