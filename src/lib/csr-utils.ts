import type { CsrSpendingRecord } from '../types'
import reportLinks from '../data/csr-report-links.json'

export interface FundedNgo {
  ngo: string
  details: string
  source: string
}

export interface LeaderInfo {
  name: string
  title: string
  linkedin?: string | null
  email?: string | null
}

const reportLinksMap = reportLinks as unknown as Record<string, {
  report_url?: string
  report_type?: string
  report_year?: string
  funded_ngos?: FundedNgo[]
  ceo?: { name: string; title: string; linkedin?: string | null; email?: string | null }
  csr_head?: { name: string; title: string; linkedin?: string | null; email?: string | null } | null
}>

export interface CompanySummary {
  company: string
  cin: string
  totalSpend: number
  eduSpend: number
  eduProjects: { field: string; spend: number }[]
  vocSpend: number
  vocProjects: { field: string; spend: number }[]
  reportUrl?: string
  reportType?: string
  fundedNgos: FundedNgo[]
  ceo?: LeaderInfo
  csrHead?: LeaderInfo
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
      fundedNgos: [],
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

  // Sort projects by spend desc within each company and attach report links
  for (const c of map.values()) {
    c.eduProjects.sort((a, b) => b.spend - a.spend)
    c.vocProjects.sort((a, b) => b.spend - a.spend)
    const link = reportLinksMap[c.cin]
    if (link) {
      c.reportUrl = link.report_url
      c.reportType = link.report_type
      if (link.funded_ngos) c.fundedNgos = link.funded_ngos
      if (link.ceo) c.ceo = link.ceo
      if (link.csr_head) c.csrHead = link.csr_head
    }
  }

  return [...map.values()]
}
