import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Donor } from '../types'

export function useDonors() {
  return useQuery<Donor[]>({
    queryKey: ['donors'],
    queryFn: async () => {
      if (!supabase) return []

      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return (data as Donor[]) || []
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateDonor() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { name: string; email: string; organisation?: string; tags?: string[] }) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('donors')
        .upsert(
          {
            name: params.name,
            email: params.email.trim().toLowerCase(),
            organisation: params.organisation || null,
            tags: params.tags || [],
          },
          { onConflict: 'email' }
        )
        .select()
        .single()

      if (error) throw error
      return data as Donor
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donors'] })
    },
  })
}

export function useUpdateDonor() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string } & Partial<Pick<Donor, 'name' | 'email' | 'organisation' | 'tags' | 'is_active'>>) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { id, ...updates } = params
      const { data, error } = await supabase
        .from('donors')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Donor
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donors'] })
    },
  })
}

export function useDeleteDonor() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { error } = await supabase
        .from('donors')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donors'] })
    },
  })
}

export function useBulkCreateDonors() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (donors: { name: string; email: string; organisation?: string }[]) => {
      if (!supabase) throw new Error('Supabase not configured')

      const rows = donors.map(d => ({
        name: d.name.trim(),
        email: d.email.trim().toLowerCase(),
        organisation: d.organisation?.trim() || null,
        tags: [],
      }))

      const { data, error } = await supabase
        .from('donors')
        .upsert(rows, { onConflict: 'email' })
        .select()

      if (error) throw error
      return (data as Donor[]) || []
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donors'] })
    },
  })
}
