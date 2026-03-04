const COLOUR_MAP: Record<string, string> = {
  'FLN / Foundational Literacy': 'bg-csf-light-blue/20 text-csf-blue border-csf-light-blue/30',
  'FLN': 'bg-csf-light-blue/20 text-csf-blue border-csf-light-blue/30',
  'Foundational Literacy': 'bg-csf-light-blue/20 text-csf-blue border-csf-light-blue/30',
  'Foundational Learning': 'bg-csf-light-blue/20 text-csf-blue border-csf-light-blue/30',
  'School Governance': 'bg-csf-purple/10 text-csf-purple border-csf-purple/20',
  'EdTech': 'bg-csf-lime/10 text-csf-blue border-csf-lime/25',
  'Early Childhood': 'bg-csf-yellow/15 text-csf-blue border-csf-yellow/30',
  'Classroom Instruction': 'bg-csf-orange/10 text-csf-orange border-csf-orange/20',
  'High Potential Students': 'bg-csf-purple/10 text-csf-purple border-csf-purple/20',
  'Education': 'bg-gray-50 text-gray-600 border-gray-200/60',
  'Teacher Training': 'bg-csf-light-blue/15 text-csf-blue border-csf-light-blue/25',
  'Education Research': 'bg-csf-orange/8 text-csf-orange border-csf-orange/15',
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
