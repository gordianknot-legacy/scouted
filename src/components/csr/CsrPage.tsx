import { useState, useMemo } from 'react'
import { ArrowLeftIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { useCsrData } from '../../hooks/useCsrData'
import { useCsrShortlist } from '../../hooks/useCsrShortlist'
import { useCsrLeads, useCreateLead } from '../../hooks/useCsrLeads'
import { CsrCompanyTable } from './CsrCompanyTable'
import { formatINR } from '../../lib/formatters'
import { aggregateByCin } from '../../lib/csr-utils'

interface CsrPageProps {
  onBack: () => void
  onNavigatePipeline: () => void
}

const FISCAL_YEARS = ['2023-24']

const EDU_SPEND_THRESHOLDS = [
  { label: 'All', value: 0 },
  { label: '₹10 Cr+', value: 10_00_00_000 },
  { label: '₹50 Cr+', value: 50_00_00_000 },
  { label: '₹100 Cr+', value: 100_00_00_000 },
]

export function CsrPage({ onBack, onNavigatePipeline }: CsrPageProps) {
  const [fiscalYear, setFiscalYear] = useState('2023-24')
  const [search, setSearch] = useState('')
  const [minEduSpend, setMinEduSpend] = useState(0)
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false)
  const [page, setPage] = useState(0)

  const { data: records = [], isLoading, error } = useCsrData(fiscalYear)
  const shortlist = useCsrShortlist()
  const { data: leads = [] } = useCsrLeads(fiscalYear)
  const createLead = useCreateLead()

  // Aggregate records into company-level summaries
  const companies = useMemo(() => aggregateByCin(records), [records])

  // Stats
  const companiesWithEdu = companies.filter(c => c.eduSpend > 0 || c.vocSpend > 0).length
  const totalEduSpend = companies.reduce((sum, c) => sum + c.eduSpend, 0)
  const totalVocSpend = companies.reduce((sum, c) => sum + c.vocSpend, 0)

  // Filter
  const filtered = useMemo(() => {
    let result = companies

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c => c.company.toLowerCase().includes(q))
    }

    // Min education spend
    if (minEduSpend > 0) {
      result = result.filter(c => c.eduSpend >= minEduSpend)
    }

    // Shortlisted only
    if (showShortlistedOnly) {
      result = result.filter(c => shortlist.isShortlisted(c.cin))
    }

    return result
  }, [companies, search, minEduSpend, showShortlistedOnly, shortlist])

  // Reset page when filters change
  const updateFilter = (fn: () => void) => {
    fn()
    setPage(0)
  }

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
            CSR Partnership Prospects
          </h2>
          <p className="font-body text-xs text-gray-400 mt-0.5">
            Identify companies for education CSR outreach &middot; FY {fiscalYear}
          </p>
        </div>
        <button
          onClick={onNavigatePipeline}
          className="px-3 py-2 rounded-xl font-heading text-sm font-semibold bg-csf-purple text-white hover:bg-csf-purple/90 transition-colors shadow-sm"
        >
          Pipeline
        </button>
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
          <p className="font-body text-csf-orange">Failed to load CSR data.</p>
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
        <div className="space-y-5">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="font-body text-[11px] text-gray-400 uppercase tracking-wider">
                Companies with Edu/Voc CSR
              </p>
              <p className="font-heading text-xl font-bold text-csf-blue mt-0.5">
                {companiesWithEdu}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {companies.length}</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-csf-yellow shadow-sm px-4 py-3">
              <p className="font-body text-[11px] text-gray-400 uppercase tracking-wider">
                Education CSR
              </p>
              <p className="font-heading text-xl font-bold text-csf-blue mt-0.5">
                {formatINR(totalEduSpend)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="font-body text-[11px] text-gray-400 uppercase tracking-wider">
                Vocational Skills CSR
              </p>
              <p className="font-heading text-xl font-bold text-csf-blue mt-0.5">
                {formatINR(totalVocSpend)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="font-body text-[11px] text-gray-400 uppercase tracking-wider">
                Shortlisted
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StarIconSolid className="w-5 h-5 text-csf-yellow" />
                <p className="font-heading text-xl font-bold text-csf-blue">
                  {shortlist.count}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-csf-purple/20 shadow-sm px-4 py-3">
              <p className="font-body text-[11px] text-gray-400 uppercase tracking-wider">
                In Pipeline
              </p>
              <p className="font-heading text-xl font-bold text-csf-purple mt-0.5">
                {leads.length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search company..."
                value={search}
                onChange={e => updateFilter(() => setSearch(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30 transition-all"
              />
            </div>

            {/* Min edu spend chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {EDU_SPEND_THRESHOLDS.map(t => (
                <button
                  key={t.value}
                  onClick={() => updateFilter(() => setMinEduSpend(t.value))}
                  className={`px-3 py-1.5 rounded-lg font-heading text-xs font-medium transition-all ${
                    minEduSpend === t.value
                      ? 'bg-csf-blue text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Shortlisted toggle */}
            <button
              onClick={() => updateFilter(() => setShowShortlistedOnly(!showShortlistedOnly))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading text-xs font-medium transition-all shrink-0 ${
                showShortlistedOnly
                  ? 'bg-csf-yellow text-gray-900 shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {showShortlistedOnly ? (
                <StarIconSolid className="w-3.5 h-3.5" />
              ) : (
                <StarIcon className="w-3.5 h-3.5" />
              )}
              Shortlisted
            </button>
          </div>

          {/* Company table */}
          <CsrCompanyTable
            companies={filtered}
            shortlist={shortlist}
            leads={leads}
            onMoveToPipeline={(cin, company) => {
              createLead.mutate({ cin, company, fiscal_year: fiscalYear })
            }}
            page={page}
            pageSize={15}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
