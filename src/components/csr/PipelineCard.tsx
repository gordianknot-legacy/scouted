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
      className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:shadow-md hover:border-gray-200 transition-all"
    >
      <p className="font-heading text-sm font-semibold text-gray-900 truncate">
        {company.company}
      </p>

      <div className="flex items-baseline gap-3 mt-1.5">
        {company.eduSpend > 0 && (
          <div>
            <p className="font-body text-[10px] text-gray-400 uppercase">Edu</p>
            <p className="font-heading text-xs font-bold text-csf-blue">
              {formatINR(company.eduSpend)}
            </p>
          </div>
        )}
        <div>
          <p className="font-body text-[10px] text-gray-400 uppercase">Total</p>
          <p className="font-heading text-xs text-gray-500">
            {formatINR(company.totalSpend)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        {stageInfo && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-heading font-semibold ${stageInfo.colour}`}>
            {stageInfo.label}
          </span>
        )}
        {assignedTo && (
          <span className="font-body text-[10px] text-gray-400 truncate ml-1">
            {assignedTo}
          </span>
        )}
      </div>
    </button>
  )
}
