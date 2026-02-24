import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react'
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  MapPinIcon,
  BanknotesIcon,
  ClockIcon,
  EnvelopeIcon,
  BookmarkIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid'
import { Badge } from '../ui/Badge'
import { DownloadDropdown } from '../ui/DownloadDropdown'
import { RelevanceScore } from '../ui/RelevanceScore'
import { applyDecay } from '../../lib/scoring'
import type { Opportunity } from '../../types'

interface PreviewPaneProps {
  opportunity: Opportunity | null
  isOpen: boolean
  onClose: () => void
  isBookmarked: boolean
  onToggleBookmark: () => void
  onHide: () => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDeadline(deadline: string | null): { text: string; isUrgent: boolean; isPast: boolean } {
  if (!deadline) return { text: 'Rolling / Open', isUrgent: false, isPast: false }
  const d = new Date(deadline)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  if (diff < 0) return { text: `Closed (${formatted})`, isUrgent: false, isPast: true }
  if (diff <= 7) return { text: `${diff} days remaining — ${formatted}`, isUrgent: true, isPast: false }
  if (diff <= 30) return { text: `${diff} days remaining — ${formatted}`, isUrgent: false, isPast: false }
  return { text: formatted, isUrgent: false, isPast: false }
}

export function PreviewPane({
  opportunity,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onHide,
}: PreviewPaneProps) {
  if (!opportunity) return null

  const decayedScore = applyDecay(opportunity.relevance_score, opportunity.created_at)
  const deadline = formatDeadline(opportunity.deadline)

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 animate-fade-in" />

      {/* Desktop: right slide-over / Mobile: bottom sheet */}
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel className="w-full max-w-xl bg-white shadow-2xl flex flex-col animate-slide-in-right max-lg:hidden">
          <DesktopContent
            opportunity={opportunity}
            decayedScore={decayedScore}
            deadline={deadline}
            isBookmarked={isBookmarked}
            onToggleBookmark={onToggleBookmark}
            onHide={onHide}
            onClose={onClose}
          />
        </DialogPanel>

        {/* Mobile version */}
        <DialogPanel className="lg:hidden w-full max-h-[92vh] mt-auto bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-in-up">
          <MobileContent
            opportunity={opportunity}
            decayedScore={decayedScore}
            deadline={deadline}
            isBookmarked={isBookmarked}
            onToggleBookmark={onToggleBookmark}
            onHide={onHide}
            onClose={onClose}
          />
        </DialogPanel>
      </div>
    </Dialog>
  )
}

interface ContentProps {
  opportunity: Opportunity
  decayedScore: number
  deadline: { text: string; isUrgent: boolean; isPast: boolean }
  isBookmarked: boolean
  onToggleBookmark: () => void
  onHide: () => void
  onClose: () => void
}

function DesktopContent({ opportunity, decayedScore, deadline, isBookmarked, onToggleBookmark, onHide, onClose }: ContentProps) {
  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <RelevanceScore score={decayedScore} size="lg" />
          <div>
            <p className="text-xs font-heading text-gray-400 uppercase tracking-wider">Relevance Score</p>
            <p className="text-sm font-heading font-semibold text-gray-700">
              {decayedScore >= 75 ? 'High Match' : decayedScore >= 50 ? 'Medium Match' : 'Low Match'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Close preview"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-6">
        <OpportunityBody opportunity={opportunity} deadline={deadline} />
      </div>

      {/* Footer actions */}
      <ActionFooter
        opportunity={opportunity}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
        onHide={onHide}
      />
    </>
  )
}

function MobileContent({ opportunity, decayedScore, deadline, isBookmarked, onToggleBookmark, onHide, onClose }: ContentProps) {
  return (
    <>
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1 shrink-0">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <RelevanceScore score={decayedScore} />
          <p className="text-sm font-heading font-semibold text-gray-700">
            {decayedScore >= 75 ? 'High Match' : decayedScore >= 50 ? 'Medium Match' : 'Low Match'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
        <OpportunityBody opportunity={opportunity} deadline={deadline} />
      </div>

      {/* Footer */}
      <ActionFooter
        opportunity={opportunity}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
        onHide={onHide}
      />
    </>
  )
}

function OpportunityBody({ opportunity, deadline }: { opportunity: Opportunity; deadline: { text: string; isUrgent: boolean; isPast: boolean } }) {
  return (
    <>
      {/* Organisation */}
      {opportunity.organisation && (
        <p className="text-xs font-heading text-csf-blue/60 uppercase tracking-wider font-semibold">
          {opportunity.organisation}
        </p>
      )}

      {/* Title */}
      <h2 className="font-heading font-bold text-xl text-gray-900 leading-snug -mt-2">
        {opportunity.title}
      </h2>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {opportunity.tags.map(tag => (
          <Badge key={tag} label={tag} />
        ))}
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <DetailCard
          icon={CalendarDaysIcon}
          label="Deadline"
          value={deadline.text}
          highlight={deadline.isUrgent ? 'urgent' : deadline.isPast ? 'muted' : undefined}
        />
        <DetailCard
          icon={MapPinIcon}
          label="Location"
          value={opportunity.location || 'India'}
        />
        <DetailCard
          icon={BanknotesIcon}
          label="Funding"
          value={opportunity.amount || 'Not specified'}
        />
        <DetailCard
          icon={ClockIcon}
          label="Posted"
          value={formatDate(opportunity.created_at)}
        />
      </div>

      {/* Description */}
      <div>
        <h3 className="font-heading font-semibold text-sm text-gray-900 mb-2">About This Opportunity</h3>
        <p className="font-body text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {opportunity.description}
        </p>
      </div>

      {/* POC Email */}
      {opportunity.poc_email && (
        <div className="flex items-center gap-2 p-3 bg-csf-blue/5 rounded-xl">
          <EnvelopeIcon className="w-4 h-4 text-csf-blue shrink-0" />
          <div>
            <p className="text-xs font-heading text-gray-500">Point of Contact</p>
            <a
              href={`mailto:${opportunity.poc_email}`}
              className="text-sm font-body text-csf-blue hover:underline"
            >
              {opportunity.poc_email}
            </a>
          </div>
        </div>
      )}
    </>
  )
}

function DetailCard({ icon: Icon, label, value, highlight }: {
  icon: typeof CalendarDaysIcon
  label: string
  value: string
  highlight?: 'urgent' | 'muted'
}) {
  const bgClass = highlight === 'urgent'
    ? 'bg-red-50 border-red-100'
    : 'bg-gray-50 border-gray-100'
  const textClass = highlight === 'urgent'
    ? 'text-red-700'
    : highlight === 'muted'
      ? 'text-gray-400'
      : 'text-gray-800'

  return (
    <div className={`p-3 rounded-xl border ${bgClass}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[11px] font-heading text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-sm font-heading font-semibold ${textClass} leading-snug`}>{value}</p>
    </div>
  )
}

function ActionFooter({ opportunity, isBookmarked, onToggleBookmark, onHide }: {
  opportunity: Opportunity
  isBookmarked: boolean
  onToggleBookmark: () => void
  onHide: () => void
}) {
  return (
    <div className="border-t border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0 bg-white">
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleBookmark}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          {isBookmarked ? (
            <BookmarkIconSolid className="w-5 h-5 text-csf-blue" />
          ) : (
            <BookmarkIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
        <button
          onClick={onHide}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Hide opportunity"
          title="Mark as irrelevant"
        >
          <EyeSlashIcon className="w-5 h-5 text-gray-400" />
        </button>
        <DownloadDropdown opportunity={opportunity} size="md" />
      </div>
      <a
        href={opportunity.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-csf-blue text-white text-sm font-heading font-bold rounded-xl hover:bg-csf-blue/90 transition-all hover:shadow-lg hover:shadow-csf-blue/20"
      >
        View Source
        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
      </a>
    </div>
  )
}
