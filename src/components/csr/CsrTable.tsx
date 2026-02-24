import { useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { formatINR } from '../../lib/formatters'
import type { CsrSpendingRecord } from '../../types'

type SortField = 'company' | 'spend_inr'
type SortDir = 'asc' | 'desc'

interface CsrTableProps {
  data: CsrSpendingRecord[]
}

export function CsrTable({ data }: CsrTableProps) {
  const [sortField, setSortField] = useState<SortField>('spend_inr')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir(field === 'company' ? 'asc' : 'desc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (sortField === 'company') {
      const cmp = a.company.localeCompare(b.company)
      return sortDir === 'asc' ? cmp : -cmp
    }
    const cmp = Number(a.spend_inr) - Number(b.spend_inr)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? (
      <ChevronUpIcon className="w-3.5 h-3.5 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-3.5 h-3.5 inline ml-1" />
    )
  }

  const isEducation = (field: string) => field.toLowerCase() !== 'other'

  if (data.length === 0) return null

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th
                className="text-left px-5 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-csf-blue transition-colors"
                onClick={() => toggleSort('company')}
              >
                Company <SortIcon field="company" />
              </th>
              <th className="text-left px-5 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider">
                CIN
              </th>
              <th className="text-left px-5 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th
                className="text-right px-5 py-3 font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-csf-blue transition-colors"
                onClick={() => toggleSort('spend_inr')}
              >
                Spend (INR) <SortIcon field="spend_inr" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 font-heading text-sm font-medium text-gray-900">
                  {row.company}
                </td>
                <td className="px-5 py-3 font-body text-xs text-gray-400 font-mono">
                  {row.cin}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-heading font-medium ${
                      isEducation(row.field)
                        ? 'bg-csf-yellow/20 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {row.field}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-heading text-sm font-semibold text-csf-blue">
                  {formatINR(Number(row.spend_inr))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {sorted.map(row => (
          <div key={row.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold text-gray-900 truncate">
                  {row.company}
                </p>
                <p className="font-body text-[11px] text-gray-400 font-mono mt-0.5">
                  {row.cin}
                </p>
              </div>
              <span
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-heading font-medium ${
                  isEducation(row.field)
                    ? 'bg-csf-yellow/20 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {row.field}
              </span>
            </div>
            <p className="font-heading text-lg font-bold text-csf-blue mt-2">
              {formatINR(Number(row.spend_inr))}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
