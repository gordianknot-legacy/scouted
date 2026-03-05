import { useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { ImageUpload } from './ImageUpload'
import type { NewsletterSection, NewsletterSectionType } from '../../types'

interface SectionEditorProps {
  section: NewsletterSection
  index: number
  total: number
  onChange: (updated: NewsletterSection) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onPolish?: (section: NewsletterSection) => void
  isPolishing?: boolean
}

const SECTION_TYPES: { key: NewsletterSectionType; label: string }[] = [
  { key: 'ceo_message', label: 'CEO Message' },
  { key: 'section_header', label: 'Section Header' },
  { key: 'impact_story', label: 'Impact Story' },
  { key: 'stats', label: 'Stats Grid' },
  { key: 'events', label: 'Events List' },
  { key: 'cta', label: 'Call to Action' },
  { key: 'custom', label: 'Custom' },
]

export function SectionEditor({
  section, index, total, onChange, onMoveUp, onMoveDown, onDelete, onPolish, isPolishing,
}: SectionEditorProps) {
  const [collapsed, setCollapsed] = useState(false)

  const update = (partial: Partial<NewsletterSection>) => {
    onChange({ ...section, ...partial })
  }

  const typeLabel = SECTION_TYPES.find(t => t.key === section.type)?.label || section.type

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 bg-gray-50/80 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="font-heading text-xs font-bold text-gray-400 w-6">{index + 1}</span>
        <span className="font-heading text-xs font-semibold text-csf-blue uppercase tracking-wide flex-1">
          {typeLabel}
        </span>
        {section.title && (
          <span className="font-body text-xs text-gray-400 truncate max-w-[200px]">
            {section.title}
          </span>
        )}
        <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
          {onPolish && (
            <button
              onClick={() => onPolish(section)}
              disabled={isPolishing}
              className="p-1.5 rounded-lg hover:bg-csf-purple/10 text-csf-purple transition-colors disabled:opacity-50"
              title="AI Polish"
            >
              <SparklesIcon className="w-4 h-4" />
            </button>
          )}
          <button onClick={onMoveUp} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 disabled:opacity-30 transition-colors">
            <ChevronUpIcon className="w-4 h-4" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 disabled:opacity-30 transition-colors">
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Type Selector */}
          <div>
            <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Type</label>
            <select
              value={section.type}
              onChange={e => update({ type: e.target.value as NewsletterSectionType })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
            >
              {SECTION_TYPES.map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          {section.type !== 'stats' && section.type !== 'events' && (
            <div>
              <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
              <input
                type="text"
                value={section.title}
                onChange={e => update({ title: e.target.value })}
                placeholder={section.type === 'section_header' ? 'Section heading...' : 'Title...'}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
              />
            </div>
          )}

          {/* Body text */}
          {section.type !== 'section_header' && section.type !== 'stats' && section.type !== 'events' && (
            <div>
              <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Body</label>
              <textarea
                value={section.body}
                onChange={e => update({ body: e.target.value })}
                placeholder="Write content here... Use new lines for bullet points."
                rows={section.type === 'ceo_message' ? 6 : 4}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30 resize-none"
              />
            </div>
          )}

          {/* Image upload for supported types */}
          {(section.type === 'ceo_message' || section.type === 'impact_story' || section.type === 'custom') && (
            <ImageUpload
              label="Image"
              value={section.image}
              onChange={image => update({ image })}
            />
          )}

          {/* Stats editor */}
          {section.type === 'stats' && (
            <StatsEditor
              stats={section.stats || []}
              onChange={stats => update({ stats })}
              title={section.title}
              onTitleChange={title => update({ title })}
            />
          )}

          {/* Events editor */}
          {section.type === 'events' && (
            <EventsEditor
              events={section.events || []}
              onChange={events => update({ events })}
              title={section.title}
              onTitleChange={title => update({ title })}
            />
          )}

          {/* CTA fields */}
          {section.type === 'cta' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Button Label</label>
                <input
                  type="text"
                  value={section.ctaLabel || ''}
                  onChange={e => update({ ctaLabel: e.target.value })}
                  placeholder="Learn More"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
                />
              </div>
              <div>
                <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Button URL</label>
                <input
                  type="url"
                  value={section.ctaUrl || ''}
                  onChange={e => update({ ctaUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatsEditor({
  stats,
  onChange,
  title,
  onTitleChange,
}: {
  stats: { label: string; value: string }[]
  onChange: (s: { label: string; value: string }[]) => void
  title: string
  onTitleChange: (t: string) => void
}) {
  const update = (i: number, field: 'label' | 'value', val: string) => {
    const next = [...stats]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Our Impact in Numbers"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
        />
      </div>
      {stats.map((s, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={s.value}
            onChange={e => update(i, 'value', e.target.value)}
            placeholder="5 Cr+"
            className="w-24 px-3 py-2 rounded-xl border border-gray-200 font-heading text-sm font-bold text-csf-blue placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
          />
          <input
            type="text"
            value={s.label}
            onChange={e => update(i, 'label', e.target.value)}
            placeholder="Students reached"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
          />
          <button
            onClick={() => onChange(stats.filter((_, j) => j !== i))}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...stats, { label: '', value: '' }])}
        className="text-sm font-heading font-medium text-csf-blue hover:underline"
      >
        + Add stat
      </button>
    </div>
  )
}

function EventsEditor({
  events,
  onChange,
  title,
  onTitleChange,
}: {
  events: { date: string; description: string }[]
  onChange: (e: { date: string; description: string }[]) => void
  title: string
  onTitleChange: (t: string) => void
}) {
  const update = (i: number, field: 'date' | 'description', val: string) => {
    const next = [...events]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Upcoming Events"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
        />
      </div>
      {events.map((ev, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={ev.date}
            onChange={e => update(i, 'date', e.target.value)}
            placeholder="15 Mar"
            className="w-24 px-3 py-2 rounded-xl border border-gray-200 font-heading text-sm font-bold text-csf-blue placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
          />
          <input
            type="text"
            value={ev.description}
            onChange={e => update(i, 'description', e.target.value)}
            placeholder="Event description..."
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
          />
          <button
            onClick={() => onChange(events.filter((_, j) => j !== i))}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...events, { date: '', description: '' }])}
        className="text-sm font-heading font-medium text-csf-blue hover:underline"
      >
        + Add event
      </button>
    </div>
  )
}
