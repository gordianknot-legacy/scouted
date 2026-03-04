import { formatINR } from '../../lib/formatters'
import { PIPELINE_STAGES } from '../../types'
import type { PipelineStage } from '../../types'
import type { CompanySummary } from '../../lib/csr-utils'

interface PipelineCardProps {
  company: CompanySummary
  stage: PipelineStage
  assignedTo: string
  onClick: () => void
}

export function PipelineCard({ company, stage, assignedTo, onClick }: PipelineCardProps) {
  const stageInfo = PIPELINE_STAGES.find(s => s.key === stage)

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent p-3.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all"
    >
      <p className="font-heading text-sm font-semibold text-gray-900 truncate">
        {company.company}
      </p>

      <div className="flex items-baseline gap-3 mt-1.5">
        {company.eduSpend > 0 && (
          <div>
            <p className="font-body text-[11px] text-gray-400 uppercase">Edu</p>
            <p className="font-heading text-xs font-bold text-csf-blue">
              {formatINR(company.eduSpend)}
            </p>
          </div>
        )}
        <div>
          <p className="font-body text-[11px] text-gray-400 uppercase">Total</p>
          <p className="font-heading text-xs text-gray-500">
            {formatINR(company.totalSpend)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        {stageInfo && (
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-heading font-semibold ${stageInfo.colour}`}>
            {stageInfo.label}
          </span>
        )}
        {assignedTo && (
          <span className="font-body text-[11px] text-gray-400 truncate ml-1">
            {assignedTo}
          </span>
        )}
      </div>
    </button>
  )
}
