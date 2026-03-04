import { useState, useMemo } from 'react'
import { ChevronUpIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { formatINR } from '../../lib/formatters'
import type { CompanySummary } from '../../lib/csr-utils'
import type { CsrLead } from '../../types'

type SortField = 'eduSpend' | 'vocSpend' | 'totalSpend' | 'company' | 'eduPct'
type SortDir = 'asc' | 'desc'

interface CsrCompanyTableProps {
  companies: CompanySummary[]
  shortlist: {
    isShortlisted: (cin: string) => boolean
    toggle: (cin: string) => void
  }
  leads: CsrLead[]
  onMoveToPipeline: (cin: string, company: string) => void
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function CsrCompanyTable({ companies, shortlist, leads, onMoveToPipeline, page, pageSize, onPageChange }: CsrCompanyTableProps) {
  const leadsByCin = useMemo(() => {
    const map = new Map<string, CsrLead>()
    for (const l of leads) map.set(l.cin, l)
    return map
  }, [leads])

  const [sortField, setSortField] = useState<SortField>('eduSpend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedCin, setExpandedCin] = useState<string | null>(null)

  const eduPct = (c: CompanySummary) => {
    if (c.totalSpend === 0) return 0
    return Math.round((c.eduSpend / c.totalSpend) * 100)
  }

  const sorted = useMemo(() => {
    return [...companies].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'company': cmp = a.company.localeCompare(b.company); break
        case 'totalSpend': cmp = a.totalSpend - b.totalSpend; break
        case 'eduSpend': cmp = a.eduSpend - b.eduSpend; break
        case 'vocSpend': cmp = a.vocSpend - b.vocSpend; break
        case 'eduPct': cmp = eduPct(a) - eduPct(b); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [companies, sortField, sortDir])

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
              <th
                className="text-right px-4 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-csf-blue transition-colors"
                onClick={() => toggleSort('eduSpend')}
              >
                Education <SortIcon field="eduSpend" />
              </th>
              <th
                className="text-right px-4 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-csf-blue transition-colors"
                onClick={() => toggleSort('vocSpend')}
              >
                Vocational <SortIcon field="vocSpend" />
              </th>
              <th
                className="text-right px-4 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-csf-blue transition-colors"
                onClick={() => toggleSort('totalSpend')}
              >
                Total CSR <SortIcon field="totalSpend" />
              </th>
              <th
                className="text-center px-4 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-csf-blue transition-colors w-40"
                onClick={() => toggleSort('eduPct')}
              >
                Edu % <SortIcon field="eduPct" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((c, i) => {
              const rank = page * pageSize + i + 1
              const isExpanded = expandedCin === c.cin
              const pct = eduPct(c)
              const starred = shortlist.isShortlisted(c.cin)

              return (
                <CompanyRow
                  key={c.cin}
                  company={c}
                  rank={rank}
                  eduPct={pct}
                  isExpanded={isExpanded}
                  isShortlisted={starred}
                  lead={leadsByCin.get(c.cin)}
                  onMoveToPipeline={() => onMoveToPipeline(c.cin, c.company)}
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
          const pct = eduPct(c)
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
                    </div>

                    {/* Key metrics */}
                    <div className="flex items-baseline gap-4 mt-2">
                      <div>
                        <p className="font-body text-[11px] text-gray-400 uppercase">Education</p>
                        <p className="font-heading text-base font-bold text-csf-blue">
                          {formatINR(c.eduSpend)}
                        </p>
                      </div>
                      {c.vocSpend > 0 && (
                        <div>
                          <p className="font-body text-[11px] text-gray-400 uppercase">Vocational</p>
                          <p className="font-heading text-sm text-gray-600">
                            {formatINR(c.vocSpend)}
                          </p>
                        </div>
                      )}
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
                  {(c.eduProjects.length > 0 || c.vocProjects.length > 0) && (
                    <button
                      onClick={() => setExpandedCin(isExpanded ? null : c.cin)}
                      className="mt-0.5 shrink-0 p-1"
                    >
                      <ChevronRightIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded: education & vocational projects */}
              {isExpanded && (c.eduProjects.length > 0 || c.vocProjects.length > 0) && (
                <div>
                  <ExpandedProjects
                    eduProjects={c.eduProjects}
                    vocProjects={c.vocProjects}
                    cin={c.cin}
                  />
                  <div className="px-6 pb-3">
                    <button
                      onClick={() => onMoveToPipeline(c.cin, c.company)}
                      disabled={inPipeline}
                      className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium bg-csf-purple text-white hover:bg-csf-purple/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {inPipeline ? 'In Pipeline' : 'Move to Pipeline'}
                    </button>
                  </div>
                </div>
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

/* ── Desktop row ── */

function CompanyRow({
  company: c,
  rank,
  eduPct,
  isExpanded,
  isShortlisted,
  lead,
  onMoveToPipeline,
  onToggle,
  onStar,
}: {
  company: CompanySummary
  rank: number
  eduPct: number
  isExpanded: boolean
  isShortlisted: boolean
  lead?: CsrLead
  onMoveToPipeline: () => void
  onToggle: () => void
  onStar: (e: React.MouseEvent) => void
}) {
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
          {(c.eduProjects.length > 0 || c.vocProjects.length > 0) && (
            <ChevronRightIcon className={`w-3.5 h-3.5 text-gray-400 transition-transform inline ${isExpanded ? 'rotate-90' : ''}`} />
          )}
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
          </div>
        </td>

        {/* Education Spend — primary metric */}
        <td className="px-4 py-3 text-right">
          <span className={`font-heading text-sm font-bold ${
            c.eduSpend > 0 ? 'text-csf-blue' : 'text-gray-300'
          }`}>
            {c.eduSpend > 0 ? formatINR(c.eduSpend) : '—'}
          </span>
        </td>

        {/* Vocational Spend */}
        <td className="px-4 py-3 text-right">
          <span className={`font-heading text-sm ${
            c.vocSpend > 0 ? 'text-gray-600' : 'text-gray-300'
          }`}>
            {c.vocSpend > 0 ? formatINR(c.vocSpend) : '—'}
          </span>
        </td>

        {/* Total CSR */}
        <td className="px-4 py-3 text-right font-heading text-sm text-gray-500">
          {formatINR(c.totalSpend)}
        </td>

        {/* Education % — wider bar */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-gray-100 flex">
              {eduPct > 0 && (
                <div
                  className={`h-full rounded-full transition-all ${
                    eduPct >= 50 ? 'bg-csf-yellow' : 'bg-csf-yellow/50'
                  }`}
                  style={{ width: `${eduPct}%` }}
                />
              )}
            </div>
            <span className={`font-heading text-xs w-8 text-right shrink-0 ${
              eduPct >= 50 ? 'font-semibold text-gray-700' : 'text-gray-400'
            }`}>
              {eduPct}%
            </span>
          </div>
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (c.eduProjects.length > 0 || c.vocProjects.length > 0) && (
        <tr>
          <td colSpan={7} className="p-0">
            <ExpandedProjects
              eduProjects={c.eduProjects}
              vocProjects={c.vocProjects}
              cin={c.cin}
            />
            <div className="px-6 pb-3">
              <button
                onClick={(e) => { e.stopPropagation(); onMoveToPipeline() }}
                disabled={!!lead}
                className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium bg-csf-purple text-white hover:bg-csf-purple/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {lead ? 'In Pipeline' : 'Move to Pipeline'}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ── Shared expanded projects ── */

function ExpandedProjects({
  eduProjects,
  vocProjects,
  cin,
}: {
  eduProjects: { field: string; spend: number }[]
  vocProjects: { field: string; spend: number }[]
  cin: string
}) {
  return (
    <div className="bg-gray-50/80 border-t border-gray-100 px-6 py-3 space-y-3">
      <p className="font-body text-[11px] text-gray-400 font-mono text-right">{cin}</p>

      {eduProjects.length > 0 && (
        <ProjectSection
          label="Education"
          projects={eduProjects}
          prefix="Education: "
          accentClass="text-csf-blue"
        />
      )}

      {vocProjects.length > 0 && (
        <ProjectSection
          label="Vocational Skills"
          projects={vocProjects}
          prefix="Vocational Skills: "
          accentClass="text-csf-purple"
        />
      )}
    </div>
  )
}

function ProjectSection({
  label,
  projects,
  prefix,
  accentClass,
}: {
  label: string
  projects: { field: string; spend: number }[]
  prefix: string
  accentClass: string
}) {
  const cleaned = projects.map(p => ({
    name: p.field.replace(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'), ''),
    spend: p.spend,
  }))

  const showAll = cleaned.length <= 6
  const visible = showAll ? cleaned : cleaned.slice(0, 5)

  return (
    <div>
      <p className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} ({projects.length})
      </p>
      <div className="space-y-1">
        {visible.map((p, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <p className="font-body text-xs text-gray-600 min-w-0 leading-relaxed">
              {p.name}
            </p>
            <p className={`font-heading text-xs font-semibold shrink-0 ${accentClass}`}>
              {formatINR(p.spend)}
            </p>
          </div>
        ))}
        {!showAll && (
          <p className="font-body text-xs text-gray-400 italic">
            + {cleaned.length - 5} more projects
          </p>
        )}
      </div>
    </div>
  )
}
