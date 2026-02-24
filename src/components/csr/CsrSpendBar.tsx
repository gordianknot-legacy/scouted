import type { CsrSpendingRecord } from '../../types'

interface CsrSpendBarProps {
  records: CsrSpendingRecord[]
  company: string
}

export function CsrSpendBar({ records, company }: CsrSpendBarProps) {
  const companyRecords = records.filter(r => r.company === company)

  const educationSpend = companyRecords
    .filter(r => r.field.toLowerCase() !== 'other')
    .reduce((sum, r) => sum + Number(r.spend_inr), 0)

  const otherSpend = companyRecords
    .filter(r => r.field.toLowerCase() === 'other')
    .reduce((sum, r) => sum + Number(r.spend_inr), 0)

  const total = educationSpend + otherSpend
  if (total === 0) return null

  const eduPct = Math.round((educationSpend / total) * 100)

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-3 rounded-full overflow-hidden bg-gray-100 flex">
        {eduPct > 0 && (
          <div
            className="bg-csf-yellow h-full transition-all"
            style={{ width: `${eduPct}%` }}
          />
        )}
        {eduPct < 100 && (
          <div
            className="bg-csf-blue/20 h-full transition-all"
            style={{ width: `${100 - eduPct}%` }}
          />
        )}
      </div>
      <span className="font-heading text-xs text-gray-500 w-10 text-right shrink-0">
        {eduPct}%
      </span>
    </div>
  )
}
