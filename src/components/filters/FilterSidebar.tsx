import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { ALL_INDIAN_STATES, CSF_SECTORS } from '../../lib/constants'
import type { Filters, ScoreLevel } from '../../types'

interface FilterSidebarProps {
  filters: Filters
  onChange: (filters: Filters) => void
  onClose?: () => void
  isMobile?: boolean
}

const SCORE_OPTIONS: { value: ScoreLevel | null; label: string; dot: string }[] = [
  { value: null, label: 'All', dot: 'bg-gray-300' },
  { value: 'high', label: 'High (75+)', dot: 'bg-green-500' },
  { value: 'medium', label: 'Medium (50–74)', dot: 'bg-yellow-500' },
  { value: 'low', label: 'Low (<50)', dot: 'bg-red-500' },
]

export function FilterSidebar({ filters, onChange, onClose, isMobile }: FilterSidebarProps) {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const toggleArrayItem = (key: 'sectors' | 'states', item: string) => {
    const arr = filters[key]
    const next = arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
    updateFilter(key, next)
  }

  const clearAll = () => {
    onChange({ scoreLevel: null, sectors: [], states: [], deadlineBefore: null, search: '' })
  }

  const hasFilters = filters.scoreLevel || filters.sectors.length > 0 || filters.states.length > 0 || filters.deadlineBefore

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-csf-blue/5 rounded-lg flex items-center justify-center">
            <FunnelIcon className="w-4 h-4 text-csf-blue" />
          </div>
          <h2 className="font-heading font-bold text-sm text-gray-900">Filters</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-[11px] text-csf-orange hover:underline font-heading font-medium"
            >
              Clear all
            </button>
          )}
          {isMobile && onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Score Level */}
      <div>
        <h3 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Score</h3>
        <div className="flex flex-wrap gap-1.5">
          {SCORE_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => updateFilter('scoreLevel', opt.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-all ${
                filters.scoreLevel === opt.value
                  ? 'bg-csf-blue text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${filters.scoreLevel === opt.value ? 'bg-white' : opt.dot}`} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sectors */}
      <div>
        <h3 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sector</h3>
        <div className="flex flex-wrap gap-1.5">
          {CSF_SECTORS.map(sector => {
            const isActive = filters.sectors.includes(sector)
            return (
              <button
                key={sector}
                onClick={() => toggleArrayItem('sectors', sector)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-medium transition-all border ${
                  isActive
                    ? 'bg-csf-blue/10 text-csf-blue border-csf-blue/20'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                }`}
              >
                {sector}
              </button>
            )
          })}
        </div>
      </div>

      {/* States */}
      <div>
        <h3 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">State</h3>
        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
          {ALL_INDIAN_STATES.map(state => {
            const isActive = filters.states.includes(state)
            return (
              <label
                key={state}
                className={`flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg transition-colors ${
                  isActive ? 'bg-csf-blue/5' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleArrayItem('states', state)}
                  className="accent-csf-blue rounded w-3.5 h-3.5"
                />
                <span className={`text-xs font-body ${isActive ? 'text-csf-blue font-medium' : 'text-gray-600'}`}>{state}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Deadline */}
      <div>
        <h3 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Deadline Before</h3>
        <input
          type="date"
          value={filters.deadlineBefore || ''}
          onChange={e => updateFilter('deadlineBefore', e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-csf-blue/15 focus:border-csf-blue/40 transition-all"
        />
      </div>
    </div>
  )
}
