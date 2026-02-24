import { formatINR } from '../../lib/formatters'
import type { CsrSpendingRecord } from '../../types'

interface CsrSummaryCardsProps {
  data: CsrSpendingRecord[]
}

export function CsrSummaryCards({ data }: CsrSummaryCardsProps) {
  const uniqueCompanies = new Set(data.map(r => r.cin)).size

  const educationSpend = data
    .filter(r => r.field.toLowerCase() !== 'other')
    .reduce((sum, r) => sum + Number(r.spend_inr), 0)

  const otherSpend = data
    .filter(r => r.field.toLowerCase() === 'other')
    .reduce((sum, r) => sum + Number(r.spend_inr), 0)

  const cards = [
    {
      label: 'Total Companies',
      value: uniqueCompanies.toLocaleString('en-IN'),
      accent: false,
    },
    {
      label: 'Education Spending',
      value: formatINR(educationSpend),
      accent: true,
    },
    {
      label: 'Other CSR Spending',
      value: formatINR(otherSpend),
      accent: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(card => (
        <div
          key={card.label}
          className={`bg-white rounded-2xl border shadow-sm p-5 ${
            card.accent ? 'border-csf-yellow' : 'border-gray-100'
          }`}
        >
          <p className="font-body text-xs text-gray-500 uppercase tracking-wider">
            {card.label}
          </p>
          <p className="font-heading text-2xl font-bold text-csf-blue mt-1">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
