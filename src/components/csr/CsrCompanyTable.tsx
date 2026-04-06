import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronUpIcon, ChevronDownIcon, ChevronRightIcon, DocumentTextIcon, ArrowTopRightOnSquareIcon, MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { formatINR } from '../../lib/formatters'
import { useCsrGeo } from '../../hooks/useCsrGeo'
import type { CompanySummary } from '../../lib/csr-utils'
import type { CsrLead, CsrGeoRecord } from '../../types'

const CSF_PRIORITY_STATES = ['Punjab', 'Bihar', 'Tamil Nadu', 'Maharashtra']

function isPriorityState(state: string): boolean {
  return CSF_PRIORITY_STATES.some(p => state.toLowerCase() === p.toLowerCase())
}

export type SpendMode = 'edu' | 'voc' | 'both'

const SPEND_MODE_LABELS: Record<SpendMode, string> = {
  edu: 'Education',
  voc: 'Vocational',
  both: 'Edu + Voc',
}

function getSpend(c: CompanySummary, mode: SpendMode): number {
  switch (mode) {
    case 'edu': return c.eduSpend
    case 'voc': return c.vocSpend
    case 'both': return c.eduSpend + c.vocSpend
  }
}

type SortField = 'modeSpend' | 'totalSpend' | 'company' | 'modePct'
type SortDir = 'asc' | 'desc'

interface CsrCompanyTableProps {
  companies: CompanySummary[]
  shortlist: {
    isShortlisted: (cin: string) => boolean
    toggle: (cin: string) => void
  }
  leads: CsrLead[]
  onMoveToPipeline: (cin: string, company: string) => void
  onArchiveLead: (id: string) => void
  onRestoreLead: (id: string) => void
  fiscalYear: string
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  spendMode: SpendMode
  onSpendModeChange: (mode: SpendMode) => void
}

export function CsrCompanyTable({ companies, shortlist, leads, onMoveToPipeline, onArchiveLead, onRestoreLead, fiscalYear, page, pageSize, onPageChange, spendMode, onSpendModeChange }: CsrCompanyTableProps) {
  const leadsByCin = useMemo(() => {
    const map = new Map<string, CsrLead>()
    for (const l of leads) map.set(l.cin, l)
    return map
  }, [leads])

  const [sortField, setSortField] = useState<SortField>('modeSpend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedCin, setExpandedCin] = useState<string | null>(null)

  const modePct = (c: CompanySummary) => {
    if (c.totalSpend === 0) return 0
    return Math.round((getSpend(c, spendMode) / c.totalSpend) * 100)
  }

  const sorted = useMemo(() => {
    return [...companies].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'company': cmp = a.company.localeCompare(b.company); break
        case 'totalSpend': cmp = a.totalSpend - b.totalSpend; break
        case 'modeSpend': cmp = getSpend(a, spendMode) - getSpend(b, spendMode); break
        case 'modePct': cmp = modePct(a) - modePct(b); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [companies, sortField, sortDir, spendMode])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir(field === 'company' ? 'asc' : 'desc')
    }
    onPageChange(0)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? (
      <ChevronUpIcon className="w-3.5 h-3.5 inline ml-0.5" />
    ) : (
      <ChevronDownIcon className="w-3.5 h-3.5 inline ml-0.5" />
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-heading font-semibold text-gray-500">No companies match these filters</p>
        <p className="font-body text-sm text-gray-400 mt-1">Try lowering the minimum spend or clearing the search.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Count */}
      <p className="text-xs font-heading text-gray-400 uppercase tracking-wider mb-3">
        {sorted.length} {sorted.length === 1 ? 'company' : 'companies'}
      </p>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="w-10 px-2 py-3" />
              <th className="w-10 px-1 py-3" />
              <th
                className="text-left px-3 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-csf-blue transition-colors"
                onClick={() => toggleSort('company')}
              >
                Company <SortIcon field="company" />
              </th>
              <th className="text-right px-4 py-3">
                <SpendModeHeader
                  spendMode={spendMode}
                  onSpendModeChange={mode => { onSpendModeChange(mode); onPageChange(0) }}
                  onSort={() => toggleSort('modeSpend')}
                  sortIcon={<SortIcon field="modeSpend" />}
                />
              </th>
              <th
                className="text-right px-4 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-csf-blue transition-colors"
                onClick={() => toggleSort('totalSpend')}
              >
                Total CSR <SortIcon field="totalSpend" />
              </th>
              <th
                className="text-center px-4 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-csf-blue transition-colors w-40"
                onClick={() => toggleSort('modePct')}
              >
                {SPEND_MODE_LABELS[spendMode]} % <SortIcon field="modePct" />
              </th>
              <th className="text-center px-3 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                Report
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((c, i) => {
              const rank = page * pageSize + i + 1
              const isExpanded = expandedCin === c.cin
              const pct = modePct(c)
              const starred = shortlist.isShortlisted(c.cin)

              return (
                <CompanyRow
                  key={c.cin}
                  company={c}
                  rank={rank}
                  modePct={pct}
                  spendMode={spendMode}
                  isExpanded={isExpanded}
                  isShortlisted={starred}
                  lead={leadsByCin.get(c.cin)}
                  onMoveToPipeline={() => onMoveToPipeline(c.cin, c.company)}
                  onArchiveLead={onArchiveLead}
                  onRestoreLead={onRestoreLead}
                  fiscalYear={fiscalYear}
                  onToggle={() => setExpandedCin(isExpanded ? null : c.cin)}
                  onStar={(e) => {
                    e.stopPropagation()
                    shortlist.toggle(c.cin)
                  }}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {paginated.map((c, i) => {
          const rank = page * pageSize + i + 1
          const isExpanded = expandedCin === c.cin
          const pct = modePct(c)
          const starred = shortlist.isShortlisted(c.cin)
          const inPipeline = leadsByCin.has(c.cin)

          return (
            <div
              key={c.cin}
              className={`bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-colors ${
                starred ? 'border border-csf-yellow/60' : 'border border-transparent'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Star */}
                  <button
                    onClick={() => shortlist.toggle(c.cin)}
                    className="mt-0.5 shrink-0"
                    aria-label={starred ? 'Remove from shortlist' : 'Add to shortlist'}
                  >
                    {starred ? (
                      <StarIconSolid className="w-5 h-5 text-csf-yellow" />
                    ) : (
                      <StarIconOutline className="w-5 h-5 text-gray-300" />
                    )}
                  </button>

                  {/* Company info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-xs text-gray-400 shrink-0">#{rank}</span>
                      <p className="font-heading text-sm font-semibold text-gray-900 truncate">
                        {c.company}
                      </p>
                      {inPipeline && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-heading font-semibold bg-csf-purple/10 text-csf-purple">
                          Pipeline
                        </span>
                      )}
                      {c.fundedNgos.length > 0 && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-heading font-semibold bg-csf-yellow/20 text-amber-700">
                          {c.fundedNgos.length} NGO{c.fundedNgos.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Key metrics */}
                    <div className="flex items-baseline gap-4 mt-2">
                      <div>
                        <p className="font-body text-[11px] text-gray-400 uppercase">{SPEND_MODE_LABELS[spendMode]}</p>
                        <p className="font-heading text-base font-bold text-csf-blue">
                          {formatINR(getSpend(c, spendMode))}
                        </p>
                      </div>
                      <div>
                        <p className="font-body text-[11px] text-gray-400 uppercase">Total CSR</p>
                        <p className="font-heading text-sm text-gray-600">
                          {formatINR(c.totalSpend)}
                        </p>
                      </div>
                    </div>

                    {/* Edu % bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-gray-100 flex">
                        {pct > 0 && (
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 50 ? 'bg-csf-yellow' : 'bg-csf-yellow/50'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        )}
                      </div>
                      <span className="font-heading text-xs font-semibold text-gray-600 w-10 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Expand chevron */}
                  <button
                    onClick={() => setExpandedCin(isExpanded ? null : c.cin)}
                    className="mt-0.5 shrink-0 p-1"
                  >
                    <ChevronRightIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Expanded: geo footprint + NGOs */}
              {isExpanded && (
                <ExpandedDetail
                  company={c}
                  lead={leadsByCin.get(c.cin)}
                  onMoveToPipeline={() => onMoveToPipeline(c.cin, c.company)}
                  onArchiveLead={onArchiveLead}
                  onRestoreLead={onRestoreLead}
                  fiscalYear={fiscalYear}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="font-body text-xs text-gray-400">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Spend mode column header (custom dropdown + sort) ── */

function SpendModeHeader({
  spendMode,
  onSpendModeChange,
  onSort,
  sortIcon,
}: {
  spendMode: SpendMode
  onSpendModeChange: (mode: SpendMode) => void
  onSort: () => void
  sortIcon: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="flex items-center justify-end gap-1.5" ref={ref}>
      {/* Dropdown trigger */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-heading text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-csf-blue hover:bg-csf-blue/5 transition-all"
        >
          {SPEND_MODE_LABELS[spendMode]}
          <ChevronDownIcon className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30 min-w-[140px]">
            {(['edu', 'voc', 'both'] as SpendMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => { onSpendModeChange(mode); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 font-heading text-xs font-medium transition-colors ${
                  spendMode === mode
                    ? 'text-csf-blue bg-csf-blue/5'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {SPEND_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort button */}
      <button
        onClick={onSort}
        className="p-0.5 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-csf-blue"
        title="Sort"
      >
        {sortIcon}
      </button>
    </div>
  )
}

/* ── Desktop row ── */

function CompanyRow({
  company: c,
  rank,
  modePct,
  spendMode,
  isExpanded,
  isShortlisted,
  lead,
  onMoveToPipeline,
  onArchiveLead,
  onRestoreLead,
  fiscalYear,
  onToggle,
  onStar,
}: {
  company: CompanySummary
  rank: number
  modePct: number
  spendMode: SpendMode
  isExpanded: boolean
  isShortlisted: boolean
  lead?: CsrLead
  onMoveToPipeline: () => void
  onArchiveLead: (id: string) => void
  onRestoreLead: (id: string) => void
  fiscalYear: string
  onToggle: () => void
  onStar: (e: React.MouseEvent) => void
}) {
  const modeSpend = getSpend(c, spendMode)
  return (
    <>
      <tr
        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${
          isShortlisted ? 'bg-csf-yellow/[0.04]' : ''
        }`}
        onClick={onToggle}
      >
        {/* Star */}
        <td className="px-2 py-3 text-center">
          <button
            onClick={onStar}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          >
            {isShortlisted ? (
              <StarIconSolid className="w-4.5 h-4.5 text-csf-yellow" />
            ) : (
              <StarIconOutline className="w-4.5 h-4.5 text-gray-300 hover:text-gray-400" />
            )}
          </button>
        </td>

        {/* Expand chevron */}
        <td className="px-1 py-3 text-center">
          <ChevronRightIcon className={`w-3.5 h-3.5 text-gray-400 transition-transform inline ${isExpanded ? 'rotate-90' : ''}`} />
        </td>

        {/* Company */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs text-gray-400 w-5 text-right shrink-0">
              {rank}
            </span>
            <p className="font-heading text-sm font-medium text-gray-900 truncate">
              {c.company}
            </p>
            {lead && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-heading font-semibold bg-csf-purple/10 text-csf-purple">
                Pipeline
              </span>
            )}
            {c.fundedNgos.length > 0 && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-heading font-semibold bg-csf-yellow/20 text-amber-700">
                {c.fundedNgos.length} NGO{c.fundedNgos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </td>

        {/* Mode Spend (Education / Vocational / Both) */}
        <td className="px-4 py-3 text-right">
          <span className={`font-heading text-sm font-bold ${
            modeSpend > 0 ? 'text-csf-blue' : 'text-gray-300'
          }`}>
            {modeSpend > 0 ? formatINR(modeSpend) : '—'}
          </span>
        </td>

        {/* Total CSR */}
        <td className="px-4 py-3 text-right font-heading text-sm text-gray-500">
          {formatINR(c.totalSpend)}
        </td>

        {/* Mode % bar */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-gray-100 flex">
              {modePct > 0 && (
                <div
                  className={`h-full rounded-full transition-all ${
                    modePct >= 50 ? 'bg-csf-yellow' : 'bg-csf-yellow/50'
                  }`}
                  style={{ width: `${modePct}%` }}
                />
              )}
            </div>
            <span className={`font-heading text-xs w-8 text-right shrink-0 ${
              modePct >= 50 ? 'font-semibold text-gray-700' : 'text-gray-400'
            }`}>
              {modePct}%
            </span>
          </div>
        </td>

        {/* Report link */}
        <td className="px-3 py-3 text-center">
          {c.reportUrl ? (
            <a
              href={c.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-csf-blue/5 transition-colors group"
              title={c.reportType || 'Annual Report'}
            >
              <DocumentTextIcon className="w-4.5 h-4.5 text-csf-blue/60 group-hover:text-csf-blue" />
            </a>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0">
            <ExpandedDetail
              company={c}
              lead={lead}
              onMoveToPipeline={onMoveToPipeline}
              onArchiveLead={onArchiveLead}
              onRestoreLead={onRestoreLead}
              fiscalYear={fiscalYear}
            />
          </td>
        </tr>
      )}
    </>
  )
}

/* ── Expanded detail (shared between desktop & mobile) ── */

function ExpandedDetail({
  company: c,
  lead,
  onMoveToPipeline,
  onArchiveLead,
  onRestoreLead,
  fiscalYear,
}: {
  company: CompanySummary
  lead?: CsrLead
  onMoveToPipeline: () => void
  onArchiveLead: (id: string) => void
  onRestoreLead: (id: string) => void
  fiscalYear: string
}) {
  const [confirmArchive, setConfirmArchive] = useState(false)
  const inPipeline = !!lead && !lead.is_archived
  const isArchived = !!lead && lead.is_archived

  return (
    <div className="bg-gray-50/80 border-t border-gray-100 px-6 py-3 space-y-3">
      {/* Leadership + CIN row */}
      <div className="flex items-start justify-between gap-4">
        {(c.ceo || c.csrHead) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {c.ceo && (
              <LeaderBadge label="CEO" name={c.ceo.name} title={c.ceo.title} linkedin={c.ceo.linkedin} email={c.ceo.email} emailVerified={c.ceo.email_verified} emailConfidence={c.ceo.email_confidence} />
            )}
            {c.csrHead && (
              <LeaderBadge label="CSR Head" name={c.csrHead.name} title={c.csrHead.title} linkedin={c.csrHead.linkedin} email={c.csrHead.email} emailVerified={c.csrHead.email_verified} emailConfidence={c.csrHead.email_confidence} />
            )}
          </div>
        )}
        <p className="font-body text-[11px] text-gray-400 font-mono text-right shrink-0">{c.cin}</p>
      </div>

      {/* Geographic Footprint */}
      <GeographicFootprint cin={c.cin} fiscalYear={fiscalYear} />

      {/* NGO Partners */}
      {c.fundedNgos.length > 0 && (
        <div>
          <p className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Education NGO Partners ({c.fundedNgos.length})
          </p>
          <div className="space-y-1.5">
            {c.fundedNgos.map((n, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-xs font-semibold text-amber-700">{n.ngo}</p>
                  <p className="font-body text-xs text-gray-500 leading-relaxed">{n.details}</p>
                </div>
                <a
                  href={n.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="View source"
                >
                  <ArrowTopRightOnSquareIcon className="w-3 h-3 text-gray-400" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline actions */}
      <div className="flex items-center gap-3 pt-1">
        {!inPipeline && !isArchived && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveToPipeline() }}
            className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium bg-csf-purple text-white hover:bg-csf-purple/90 transition-colors"
          >
            Move to Pipeline
          </button>
        )}
        {inPipeline && !confirmArchive && (
          <>
            <span className="px-2 py-1 rounded text-[11px] font-heading font-semibold bg-csf-purple/10 text-csf-purple">
              In Pipeline
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmArchive(true) }}
              className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Remove from Pipeline
            </button>
          </>
        )}
        {inPipeline && confirmArchive && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200" onClick={(e) => e.stopPropagation()}>
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
            <p className="font-body text-xs text-red-700">Remove from pipeline? This will archive the lead.</p>
            <button
              onClick={() => { onArchiveLead(lead!.id); setConfirmArchive(false) }}
              className="px-2 py-1 rounded font-heading text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={() => setConfirmArchive(false)}
              className="px-2 py-1 rounded font-heading text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {isArchived && (
          <>
            <span className="px-2 py-1 rounded text-[11px] font-heading font-semibold bg-gray-100 text-gray-400">
              Archived
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onRestoreLead(lead!.id) }}
              className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium border border-csf-purple/30 text-csf-purple hover:bg-csf-purple/5 transition-colors"
            >
              Restore to Pipeline
            </button>
          </>
        )}
        {c.reportUrl && (
          <a
            href={c.reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading text-xs font-medium border border-csf-blue/20 text-csf-blue hover:bg-csf-blue/5 transition-colors"
          >
            <DocumentTextIcon className="w-3.5 h-3.5" />
            {c.reportType || 'Report'}
          </a>
        )}
      </div>
    </div>
  )
}

/* ── Geographic Footprint ── */

interface StateAggregate {
  state: string
  total: number
  education: number
  vocational: number
  other: number
  isPriority: boolean
  districts: { district: string; total: number; education: number; vocational: number; other: number }[]
}

function aggregateGeo(records: CsrGeoRecord[]): StateAggregate[] {
  const stateMap = new Map<string, {
    total: number; education: number; vocational: number; other: number
    districts: Map<string, { total: number; education: number; vocational: number; other: number }>
  }>()

  for (const r of records) {
    const amount = Number(r.spend_inr)
    if (!r.state || isNaN(amount)) continue

    let st = stateMap.get(r.state)
    if (!st) {
      st = { total: 0, education: 0, vocational: 0, other: 0, districts: new Map() }
      stateMap.set(r.state, st)
    }

    st.total += amount
    if (r.sector === 'Education') st.education += amount
    else if (r.sector === 'Vocational') st.vocational += amount
    else st.other += amount

    const distKey = r.district || 'Unspecified'
    let dist = st.districts.get(distKey)
    if (!dist) {
      dist = { total: 0, education: 0, vocational: 0, other: 0 }
      st.districts.set(distKey, dist)
    }
    dist.total += amount
    if (r.sector === 'Education') dist.education += amount
    else if (r.sector === 'Vocational') dist.vocational += amount
    else dist.other += amount
  }

  return [...stateMap.entries()]
    .map(([state, data]) => ({
      state,
      total: data.total,
      education: data.education,
      vocational: data.vocational,
      other: data.other,
      isPriority: isPriorityState(state),
      districts: [...data.districts.entries()]
        .map(([district, d]) => ({ district, ...d }))
        .sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => {
      // Priority states first, then by total spend desc
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1
      return b.total - a.total
    })
}

function GeographicFootprint({ cin, fiscalYear }: { cin: string; fiscalYear: string }) {
  const { data: geoRecords, isLoading } = useCsrGeo(cin, fiscalYear)
  const [expandedState, setExpandedState] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const states = useMemo(() => aggregateGeo(geoRecords || []), [geoRecords])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-csf-blue rounded-full animate-spin" />
        <p className="font-body text-xs text-gray-400">Loading geographic data...</p>
      </div>
    )
  }

  if (!states.length) {
    return (
      <div className="flex items-center gap-2 py-2">
        <MapPinIcon className="w-4 h-4 text-gray-300" />
        <p className="font-body text-xs text-gray-400">No geographic data available</p>
      </div>
    )
  }

  const totalStates = states.length
  const totalDistricts = states.reduce((sum, s) => sum + s.districts.length, 0)
  const maxSpend = states[0]?.total || 1
  const visibleStates = showAll ? states : states.slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-4 h-4 text-csf-blue" />
          <p className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Geographic Footprint
          </p>
        </div>
        <p className="font-body text-[11px] text-gray-400">
          {totalStates} {totalStates === 1 ? 'state' : 'states'} &middot; {totalDistricts} {totalDistricts === 1 ? 'district' : 'districts'}
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-2">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-csf-blue" />
          <span className="font-body text-[10px] text-gray-500">Education</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-csf-purple" />
          <span className="font-body text-[10px] text-gray-500">Vocational</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-300" />
          <span className="font-body text-[10px] text-gray-500">Other</span>
        </span>
      </div>

      <div className="space-y-1">
        {visibleStates.map(st => {
          const isOpen = expandedState === st.state
          const barWidth = Math.max(4, (st.total / maxSpend) * 100)
          const eduPct = st.total > 0 ? (st.education / st.total) * 100 : 0
          const vocPct = st.total > 0 ? (st.vocational / st.total) * 100 : 0
          const otherPct = 100 - eduPct - vocPct

          return (
            <div key={st.state}>
              <button
                className="w-full flex items-center gap-2 py-1.5 group text-left"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedState(isOpen ? null : st.state)
                }}
              >
                <ChevronRightIcon className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                <span className={`font-heading text-xs w-32 truncate shrink-0 ${
                  st.isPriority ? 'font-semibold text-csf-blue' : 'font-medium text-gray-700'
                }`}>
                  {st.isPriority && <span className="text-csf-yellow mr-1">&#9733;</span>}
                  {st.state}
                </span>
                {/* Stacked bar */}
                <div className="flex-1 h-3 rounded-full overflow-hidden bg-gray-100 flex" style={{ width: `${barWidth}%` }}>
                  {eduPct > 0 && <div className="h-full bg-csf-blue" style={{ width: `${eduPct}%` }} />}
                  {vocPct > 0 && <div className="h-full bg-csf-purple" style={{ width: `${vocPct}%` }} />}
                  {otherPct > 0 && <div className="h-full bg-gray-300" style={{ width: `${otherPct}%` }} />}
                </div>
                <span className="font-heading text-xs font-semibold text-gray-600 w-20 text-right shrink-0">
                  {formatINR(st.total)}
                </span>
                <span className="font-body text-[10px] text-gray-400 w-16 text-right shrink-0">
                  {st.districts.length} dist.
                </span>
              </button>

              {/* District breakdown */}
              {isOpen && (
                <div className="ml-7 mb-2 pl-3 border-l-2 border-gray-200 space-y-1">
                  {st.districts.map(d => (
                    <div key={d.district} className="flex items-center gap-2 py-0.5">
                      <span className="font-body text-[11px] text-gray-500 w-28 truncate shrink-0">{d.district}</span>
                      <div className="flex gap-3 flex-1 min-w-0">
                        {d.education > 0 && (
                          <span className="font-heading text-[11px] font-medium text-csf-blue">
                            Edu: {formatINR(d.education)}
                          </span>
                        )}
                        {d.vocational > 0 && (
                          <span className="font-heading text-[11px] font-medium text-csf-purple">
                            Voc: {formatINR(d.vocational)}
                          </span>
                        )}
                        {d.other > 0 && (
                          <span className="font-heading text-[11px] font-medium text-gray-400">
                            Other: {formatINR(d.other)}
                          </span>
                        )}
                      </div>
                      <span className="font-heading text-[11px] font-semibold text-gray-500 shrink-0">
                        {formatINR(d.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {states.length > 5 && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowAll(!showAll) }}
          className="font-heading text-xs text-csf-blue hover:text-csf-blue/80 mt-1 transition-colors"
        >
          {showAll ? 'Show fewer' : `+ ${states.length - 5} more states`}
        </button>
      )}
    </div>
  )
}

/* ── Leader badge ── */

function LeaderBadge({ label, name, title, linkedin, email, emailVerified, emailConfidence }: {
  label: string
  name: string
  title: string
  linkedin?: string | null
  email?: string | null
  emailVerified?: boolean
  emailConfidence?: number
}) {
  const confidenceColor = emailVerified ? 'bg-green-400' :
    (emailConfidence ?? 0) >= 75 ? 'bg-csf-yellow' :
    (emailConfidence ?? 0) >= 50 ? 'bg-amber-300' : 'bg-gray-300'
  const confidenceLabel = emailVerified ? 'Verified' :
    (emailConfidence ?? 0) >= 75 ? `${emailConfidence}% match` :
    (emailConfidence ?? 0) >= 50 ? `${emailConfidence}% match` : 'Low confidence'

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="font-heading text-[10px] font-semibold text-gray-400 uppercase">{label}:</span>
      <span className="font-heading text-xs font-medium text-gray-700">{name}</span>
      <span className="font-body text-[10px] text-gray-400">({title})</span>
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 text-[#0A66C2] hover:text-[#004182] transition-colors"
          title="LinkedIn profile"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
      )}
      {email && (
        <span className="inline-flex items-center gap-1 shrink-0">
          <a
            href={`mailto:${email}`}
            onClick={(e) => e.stopPropagation()}
            className="font-body text-[11px] text-csf-blue hover:text-csf-blue/80 hover:underline transition-colors"
            title={`Email: ${email}`}
          >
            {email}
          </a>
          <span
            className={`w-1.5 h-1.5 rounded-full ${confidenceColor}`}
            title={confidenceLabel}
          />
        </span>
      )}
    </div>
  )
}
