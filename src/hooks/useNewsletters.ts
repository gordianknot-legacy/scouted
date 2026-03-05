import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Newsletter, NewsletterContent } from '../types'

export function useNewsletters() {
  return useQuery<Newsletter[]>({
    queryKey: ['newsletters'],
    queryFn: async () => {
      if (!supabase) return []

      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return (data as Newsletter[]) || []
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useNewsletter(id: string | null) {
  return useQuery<Newsletter | null>({
    queryKey: ['newsletter', id],
    queryFn: async () => {
      if (!supabase || !id) return null

      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Newsletter
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateNewsletter() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { title: string; subject: string; content_json: NewsletterContent }) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('newsletters')
        .insert({
          title: params.title,
          subject: params.subject,
          content_json: params.content_json,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return data as Newsletter
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletters'] })
    },
  })
}

export function useUpdateNewsletter() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string } & Partial<Pick<Newsletter, 'title' | 'subject' | 'content_json' | 'html_rendered' | 'status' | 'scheduled_at'>>) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { id, ...updates } = params
      const { data, error } = await supabase
        .from('newsletters')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Newsletter
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['newsletters'] })
      qc.invalidateQueries({ queryKey: ['newsletter', vars.id] })
    },
  })
}

export function useDeleteNewsletter() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletters'] })
    },
  })
}
