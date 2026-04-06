import { useState, useCallback, useMemo } from 'react'
import { parseNlQuery, applyNlFilter, describeFilter } from '../lib/nl-query-parser'
import { parseWithLlm } from '../lib/nl-query-llm'
import type { NlFilter } from '../lib/nl-query-parser'
import type { CompanySummary } from '../lib/csr-utils'
import type { CsrLead } from '../types'

type QueryStatus = 'idle' | 'parsing' | 'llm' | 'done' | 'error'

interface NlQueryState {
  query: string
  filter: NlFilter | null
  status: QueryStatus
  source: 'rule' | 'llm' | null
  description: string
  error: string | null
}

export function useNlQuery() {
  const [state, setState] = useState<NlQueryState>({
    query: '',
    filter: null,
    status: 'idle',
    source: null,
    description: '',
    error: null,
  })

  const submit = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setState({ query: '', filter: null, status: 'idle', source: null, description: '', error: null })
      return
    }

    setState(s => ({ ...s, query: trimmed, status: 'parsing', error: null }))

    // Try rule-based first
    const ruleFilter = parseNlQuery(trimmed)
    if (ruleFilter) {
      setState({
        query: trimmed,
        filter: ruleFilter,
        status: 'done',
        source: 'rule',
        description: describeFilter(ruleFilter),
        error: null,
      })
      return
    }

    // Fall back to LLM
    setState(s => ({ ...s, status: 'llm' }))
    const llmFilter = await parseWithLlm(trimmed)
    if (llmFilter) {
      setState({
        query: trimmed,
        filter: llmFilter,
        status: 'done',
        source: 'llm',
        description: describeFilter(llmFilter),
        error: null,
      })
      return
    }

    // Neither worked
    setState(s => ({
      ...s,
      filter: null,
      status: 'error',
      source: null,
      description: '',
      error: 'Could not understand that query. Try something like "top 10 education spenders" or "companies over 50 crore with email".',
    }))
  }, [])

  const clear = useCallback(() => {
    setState({ query: '', filter: null, status: 'idle', source: null, description: '', error: null })
  }, [])

  const applyFilter = useCallback((
    companies: CompanySummary[],
    shortlist: { isShortlisted: (cin: string) => boolean },
    leads: CsrLead[],
  ) => {
    if (!state.filter) return null
    return applyNlFilter(companies, state.filter, shortlist, leads)
  }, [state.filter])

  return useMemo(() => ({
    ...state,
    submit,
    clear,
    applyFilter,
    isActive: state.filter !== null,
    isLoading: state.status === 'parsing' || state.status === 'llm',
  }), [state, submit, clear, applyFilter])
}
