import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CsrLead, PipelineStage } from '../types'

export function useCsrLeads(fiscalYear: string = '2023-24', includeArchived: boolean = false) {
  return useQuery<CsrLead[]>({
    queryKey: ['csr_leads', fiscalYear, includeArchived],
    queryFn: async () => {
      if (!supabase) return []

      let query = supabase
        .from('csr_leads')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .order('updated_at', { ascending: false })

      if (!includeArchived) {
        query = query.or('is_archived.is.null,is_archived.eq.false')
      }

      const { data, error } = await query
      if (error) throw error
      return (data as CsrLead[]) || []
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { cin: string; company: string; fiscal_year: string }) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('csr_leads')
        .upsert(
          {
            cin: params.cin,
            company: params.company,
            fiscal_year: params.fiscal_year,
            pipeline_stage: 'prospect' as PipelineStage,
          },
          { onConflict: 'cin,fiscal_year' }
        )
        .select()
        .single()

      if (error) throw error
      return data as CsrLead
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csr_leads'] })
    },
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string } & Partial<Omit<CsrLead, 'id' | 'cin' | 'company' | 'fiscal_year' | 'created_at'>>) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { id, ...updates } = params
      const { data, error } = await supabase
        .from('csr_leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CsrLead
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csr_leads'] })
    },
  })
}

export function useArchiveLead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('csr_leads')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CsrLead
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csr_leads'] })
    },
  })
}

export function useRestoreLead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('csr_leads')
        .update({ is_archived: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CsrLead
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csr_leads'] })
    },
  })
}
