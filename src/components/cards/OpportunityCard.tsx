import {
  BookmarkIcon,
  EyeSlashIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid'
import { Badge } from '../ui/Badge'
import { RelevanceScore } from '../ui/RelevanceScore'
import { applyDecay } from '../../lib/scoring'
import type { Opportunity } from '../../types'

interface OpportunityCardProps {
  opportunity: Opportunity
  isBookmarked: boolean
  onToggleBookmark: () => void
  onHide: () => void
  onClick: () => void
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'Rolling'
  const d = new Date(deadline)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const formatted = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  if (diff < 0) return `Closed`
  if (diff <= 7) return `${diff}d left`
  return formatted
}

export function OpportunityCard({
  opportunity,
  isBookmarked,
  onToggleBookmark,
  onHide,
  onClick,
}: OpportunityCardProps) {
  const decayedScore = applyDecay(opportunity.relevance_score, opportunity.created_at)
  const deadlineText = formatDeadline(opportunity.deadline)
  const isUrgent = opportunity.deadline && Math.ceil((new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7 && Math.ceil((new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) >= 0

  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-csf-blue/20 shadow-sm hover:shadow-lg hover:shadow-csf-blue/5 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Score accent bar */}
      <div className="h-0.5" style={{
        background: decayedScore >= 75
          ? 'linear-gradient(90deg, #22c55e, #4ade80)'
          : decayedScore >= 50
            ? 'linear-gradient(90deg, #eab308, #facc15)'
            : 'linear-gradient(90deg, #ef4444, #f87171)',
      }} />

      <div className="p-4 sm:p-5">
        {/* Top row: org + score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {opportunity.organisation && (
              <p className="text-[11px] font-heading text-csf-blue/50 uppercase tracking-wider font-semibold mb-1.5 truncate">
                {opportunity.organisation}
              </p>
            )}
            <h3 className="font-heading font-bold text-[15px] sm:text-base text-gray-900 leading-snug line-clamp-2 group-hover:text-csf-blue transition-colors">
              {opportunity.title}
            </h3>
          </div>
          <RelevanceScore score={decayedScore} size="sm" />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {opportunity.tags.slice(0, 3).map(tag => (
            <Badge key={tag} label={tag} />
          ))}
        </div>

        {/* Description preview */}
        <p className="mt-3 text-sm text-gray-500 font-body leading-relaxed line-clamp-2">
          {opportunity.description}
        </p>

        {/* Bottom meta row */}
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400 font-heading">
            {opportunity.amount && (
              <span className="font-semibold text-gray-600">{opportunity.amount}</span>
            )}
            {opportunity.location && (
              <span>{opportunity.location}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-heading">
            <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className={isUrgent ? 'text-red-600 font-semibold' : 'text-gray-400'}>{deadlineText}</span>
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-gray-50/50 border-t border-gray-50">
        <div className="flex items-center gap-0.5">
          <button
            onClick={e => { e.stopPropagation(); onToggleBookmark() }}
            className="p-2 rounded-lg hover:bg-gray-200/60 transition-colors"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? (
              <BookmarkIconSolid className="w-4.5 h-4.5 text-csf-blue" />
            ) : (
              <BookmarkIcon className="w-4.5 h-4.5 text-gray-400" />
            )}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onHide() }}
            className="p-2 rounded-lg hover:bg-gray-200/60 transition-colors"
            aria-label="Hide opportunity"
            title="Mark as irrelevant"
          >
            <EyeSlashIcon className="w-4.5 h-4.5 text-gray-400" />
          </button>
        </div>

        <a
          href={opportunity.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-csf-blue text-xs font-heading font-semibold rounded-lg hover:bg-csf-blue/5 transition-colors"
        >
          Source
          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
        </a>
      </div>
    </article>
  )
}
