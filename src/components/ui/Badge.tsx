const COLOUR_MAP: Record<string, string> = {
  'FLN / Foundational Literacy': 'bg-csf-light-blue/20 text-csf-blue border-csf-light-blue/30',
  'FLN': 'bg-csf-light-blue/20 text-csf-blue border-csf-light-blue/30',
  'Foundational Literacy': 'bg-csf-light-blue/20 text-csf-blue border-csf-light-blue/30',
  'Foundational Learning': 'bg-csf-light-blue/20 text-csf-blue border-csf-light-blue/30',
  'School Governance': 'bg-csf-purple/10 text-csf-purple border-csf-purple/20',
  'EdTech': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  'Early Childhood': 'bg-amber-50 text-amber-700 border-amber-200/60',
  'Classroom Instruction': 'bg-csf-orange/10 text-csf-orange border-csf-orange/20',
  'High Potential Students': 'bg-violet-50 text-violet-700 border-violet-200/60',
  'Education': 'bg-gray-50 text-gray-600 border-gray-200/60',
  'Teacher Training': 'bg-blue-50 text-blue-700 border-blue-200/60',
  'Education Research': 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
}

const DEFAULT_COLOUR = 'bg-gray-50 text-gray-600 border-gray-200/60'

// Normalise FLN-related tags to a single display label
function normaliseLabel(label: string): string {
  const lower = label.toLowerCase()
  if (lower === 'fln' || lower.includes('foundational literacy') || lower.includes('foundational numeracy') || lower.includes('foundational learning')) {
    return 'FLN / Foundational Literacy'
  }
  return label
}

interface BadgeProps {
  label: string
}

export function Badge({ label }: BadgeProps) {
  const normalised = normaliseLabel(label)
  const colourClass = COLOUR_MAP[normalised] || COLOUR_MAP[label] || DEFAULT_COLOUR

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-heading font-medium border ${colourClass}`}>
      {normalised}
    </span>
  )
}
