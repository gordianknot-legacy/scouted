import { useState, useMemo } from 'react'
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useCsrData } from '../../hooks/useCsrData'
import { CsrSummaryCards } from './CsrSummaryCards'
import { CsrTable } from './CsrTable'
import { CsrSpendBar } from './CsrSpendBar'
import { formatINR } from '../../lib/formatters'

interface CsrPageProps {
  onBack: () => void
}

const FISCAL_YEARS = ['2023-24']

export function CsrPage({ onBack }: CsrPageProps) {
  const [fiscalYear, setFiscalYear] = useState('2023-24')
  const [search, setSearch] = useState('')

  const { data: records = [], isLoading, error } = useCsrData(fiscalYear)

  const filtered = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter(r => r.company.toLowerCase().includes(q))
  }, [records, search])

  // Get unique companies with their total education spend for the bar chart
  const companyBreakdowns = useMemo(() => {
    const map = new Map<string, { company: string; eduSpend: number; totalSpend: number }>()
    for (const r of records) {
      const existing = map.get(r.company) || { company: r.company, eduSpend: 0, totalSpend: 0 }
      const amount = Number(r.spend_inr)
      existing.totalSpend += amount
      if (r.field.toLowerCase() !== 'other') {
        existing.eduSpend += amount
      }
      map.set(r.company, existing)
    }
    return [...map.values()]
      .filter(c => c.totalSpend > 0)
      .sort((a, b) => b.eduSpend - a.eduSpend)
      .slice(0, 10)
  }, [records])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-200/60 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            CSR Spending Data
          </h2>
          <p className="font-body text-xs text-gray-400 mt-0.5">
            Company-wise CSR expenditure from MCA portal
          </p>
        </div>
        <select
          value={fiscalYear}
          onChange={e => setFiscalYear(e.target.value)}
          className="font-heading text-sm font-medium bg-white border border-gray-200 rounded-xl px-3 py-2 text-csf-blue focus:outline-none focus:ring-2 focus:ring-csf-blue/20"
        >
          {FISCAL_YEARS.map(fy => (
            <option key={fy} value={fy}>FY {fy}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-[3px] border-csf-blue/10 border-t-csf-blue rounded-full animate-spin mx-auto" />
          <p className="font-body text-sm text-gray-400 mt-4">Loading CSR data...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16">
          <p className="font-body text-red-600">Failed to load CSR data.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && records.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <p className="font-heading font-semibold text-gray-700">No CSR data available</p>
          <p className="font-body text-sm text-gray-400 mt-1">
            Upload CSR spending data using the upsert script.
          </p>
        </div>
      )}

      {/* Data loaded */}
      {!isLoading && !error && records.length > 0 && (
        <div className="space-y-6">
          {/* Summary cards */}
          <CsrSummaryCards data={records} />

          {/* Top 10 education spenders bar chart */}
          {companyBreakdowns.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-heading text-sm font-bold text-gray-900 mb-4">
                Top Education Spenders (Education vs Other)
              </h3>
              <div className="space-y-3">
                {companyBreakdowns.map(c => (
                  <div key={c.company}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-heading text-xs font-medium text-gray-700 truncate max-w-[60%]">
                        {c.company}
                      </p>
                      <p className="font-heading text-xs text-csf-blue font-semibold">
                        {formatINR(c.eduSpend)}
                      </p>
                    </div>
                    <CsrSpendBar records={records} company={c.company} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-csf-yellow" />
                  <span className="font-body text-[11px] text-gray-500">Education</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-csf-blue/20" />
                  <span className="font-body text-[11px] text-gray-500">Other CSR</span>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30 transition-all"
            />
          </div>

          {/* Results count */}
          <p className="text-xs font-heading text-gray-400 uppercase tracking-wider">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'} found
          </p>

          {/* Table */}
          <CsrTable data={filtered} />
        </div>
      )}
    </div>
  )
}
