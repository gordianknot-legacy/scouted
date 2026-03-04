import type { CsrSpendingRecord } from '../types'

export interface CompanySummary {
  company: string
  cin: string
  totalSpend: number
  eduSpend: number
  eduProjects: { field: string; spend: number }[]
  vocSpend: number
  vocProjects: { field: string; spend: number }[]
}

/** Aggregate raw CSR spending records into per-company summaries */
export function aggregateByCin(records: CsrSpendingRecord[]): CompanySummary[] {
  const map = new Map<string, CompanySummary>()

  for (const r of records) {
    const existing = map.get(r.cin) || {
      company: r.company,
      cin: r.cin,
      totalSpend: 0,
      eduSpend: 0,
      eduProjects: [],
      vocSpend: 0,
      vocProjects: [],
    }
    const amount = Number(r.spend_inr)
    existing.totalSpend += amount
    if (r.field.toLowerCase().startsWith('education')) {
      existing.eduSpend += amount
      existing.eduProjects.push({ field: r.field, spend: amount })
    } else if (r.field.toLowerCase().startsWith('vocational')) {
      existing.vocSpend += amount
      existing.vocProjects.push({ field: r.field, spend: amount })
    }
    map.set(r.cin, existing)
  }

  // Sort projects by spend desc within each company
  for (const c of map.values()) {
    c.eduProjects.sort((a, b) => b.spend - a.spend)
    c.vocProjects.sort((a, b) => b.spend - a.spend)
  }

  return [...map.values()]
}
