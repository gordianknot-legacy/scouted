import type { Opportunity } from '../../types'
import { CSF_PRIORITY_STATES, CSF_SECTORS } from '../constants'
import { applyDecay } from '../scoring'
import { KNOWN_EDUCATION_FUNDERS } from './known-funders'

// ── CSF Alignment Generator ─────────────────────────────────────────

export interface AlignmentPoint {
  text: string
  auto: boolean // true = auto-generated, false = team prompt
}

export function generateAlignment(opp: Opportunity): AlignmentPoint[] {
  const points: AlignmentPoint[] = []
  const desc = (opp.description + ' ' + opp.tags.join(' ')).toLowerCase()

  // Sector alignment
  const matchedSectors = CSF_SECTORS.filter(sector =>
    desc.includes(sector.toLowerCase())
  )
  if (matchedSectors.length > 0) {
    points.push({
      text: `Aligns with CSF's ${matchedSectors.join(', ')} focus area${matchedSectors.length > 1 ? 's' : ''}.`,
      auto: true,
    })
  }

  // Geography alignment
  const location = (opp.location || '').toLowerCase()
  const matchedStates = CSF_PRIORITY_STATES.filter(state =>
    desc.includes(state.toLowerCase()) || location.includes(state.toLowerCase())
  )
  if (matchedStates.length > 0) {
    points.push({
      text: `Located in ${matchedStates.join(', ')} \u2014 a CSF priority state${matchedStates.length > 1 ? 's' : ''}.`,
      auto: true,
    })
  }

  // Known funder alignment
  if (opp.organisation) {
    const orgLower = opp.organisation.toLowerCase()
    const match = KNOWN_EDUCATION_FUNDERS.find(f => orgLower.includes(f))
    if (match) {
      points.push({
        text: `${opp.organisation} is a known education funder in CSF's network.`,
        auto: true,
      })
    }
  }

  // Funding size alignment
  if (opp.amount) {
    const amountStr = opp.amount.toLowerCase()
    const croreMatch = amountStr.match(/(\d+)\s*(?:crore|cr)/i)
    const largeCurrency = amountStr.match(/(?:\$|£|€)\s*(\d[\d,.]*)\s*(?:million|m\b)/i)
    if ((croreMatch && parseInt(croreMatch[1]) >= 1) || largeCurrency) {
      points.push({
        text: `Funding of ${opp.amount} meets significant investment threshold.`,
        auto: true,
      })
    }
  }

  // Always append team prompts
  points.push(
    { text: '[TEAM INPUT] Describe how this opportunity aligns with CSF\'s current strategic priorities.', auto: false },
    { text: '[TEAM INPUT] Recommended CSF lead / point of contact for this application.', auto: false },
    { text: '[TEAM INPUT] Key risks or dependencies to flag before proceeding.', auto: false },
  )

  return points
}

// ── Timeline Calculator ─────────────────────────────────────────────

export interface TimelineItem {
  milestone: string
  date: string
  status: string
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

export function calculateTimeline(deadline: string | null): TimelineItem[] {
  const today = new Date()

  if (deadline) {
    const dl = new Date(deadline)
    return [
      { milestone: 'Review opportunity & assign lead', date: formatDateShort(today), status: 'Pending' },
      { milestone: 'Draft proposal outline', date: formatDateShort(addDays(dl, -21)), status: 'Pending' },
      { milestone: 'Complete full draft', date: formatDateShort(addDays(dl, -14)), status: 'Pending' },
      { milestone: 'Internal review & sign-off', date: formatDateShort(addDays(dl, -7)), status: 'Pending' },
      { milestone: 'Submit application', date: formatDateShort(dl), status: 'Deadline' },
    ]
  }

  // Rolling / no deadline — generic 4-week plan
  return [
    { milestone: 'Review opportunity & assign lead', date: formatDateShort(today), status: 'Pending' },
    { milestone: 'Draft proposal outline', date: formatDateShort(addDays(today, 7)), status: 'Pending' },
    { milestone: 'Complete full draft', date: formatDateShort(addDays(today, 14)), status: 'Pending' },
    { milestone: 'Internal review & sign-off', date: formatDateShort(addDays(today, 21)), status: 'Pending' },
    { milestone: 'Submit application', date: formatDateShort(addDays(today, 28)), status: 'Target' },
  ]
}

// ── Standard Checklist ──────────────────────────────────────────────

export const APPLICATION_CHECKLIST = [
  'Confirm eligibility criteria are met',
  'Identify CSF lead and team members',
  'Review funder priorities and past grants',
  'Prepare organisational profile / capability statement',
  'Draft theory of change aligned with funder goals',
  'Prepare detailed budget and cost justification',
  'Collect letters of support / partnership MOUs',
  'Complete M&E framework and impact indicators',
  'Internal review and leadership sign-off',
  'Submit application before deadline',
]

// ── CSR Pitch Content ───────────────────────────────────────────────

export const CSF_PITCH_CONTENT = {
  educationChallenge: [
    'India faces a foundational learning crisis: NIPUN Bharat aims for universal foundational literacy and numeracy by Grade 3, yet over 50% of children in Grade 5 cannot read a Grade 2 text.',
    'The National Education Policy 2020 calls for systemic reform across curriculum, assessment, teacher training, and governance \u2014 requiring collaboration between government, civil society, and the private sector.',
    'CSR investment in education can catalyse state-level reforms that reach millions of children, particularly in underserved geographies.',
  ],
  csfImpact: [
    'Technical partner to 9+ state governments for foundational literacy, school governance, and EdTech integration.',
    'Programmes reaching over 5 Crore students across priority states including UP, MP, Haryana, and Gujarat.',
    'Helped unlock over \u20B913,500 Crore in government spending on education reform.',
    'Evidence-led approach with rigorous monitoring frameworks and independent impact evaluations.',
    'Deep expertise in FLN (Foundational Literacy and Numeracy), classroom instruction, school governance, and EdTech.',
  ],
  proposedPartnership: [
    '[TEAM INPUT] Proposed states / geographies for partnership.',
    '[TEAM INPUT] Specific CSF programmes or interventions to be supported (e.g., FLN programme in UP, EdTech integration in MP).',
    '[TEAM INPUT] Target reach \u2014 number of schools, teachers, and students.',
    '[TEAM INPUT] Duration and phasing of the proposed partnership.',
  ],
  investmentFramework: [
    { item: 'Programme Design & Setup', amount: '[TEAM INPUT]' },
    { item: 'State Implementation Support', amount: '[TEAM INPUT]' },
    { item: 'Monitoring, Evaluation & Learning', amount: '[TEAM INPUT]' },
    { item: 'Capacity Building & Training', amount: '[TEAM INPUT]' },
    { item: 'Total Proposed Investment', amount: '[TEAM INPUT]' },
  ],
  whyPartnerWithCsf: [
    'Proven track record of catalysing education reform at state scale.',
    'Deep relationships with state education departments and SCERT/DIETs.',
    'Rigorous evidence and data systems for transparent impact reporting.',
    'Ability to leverage CSR investment to unlock significantly larger government funding.',
    '[TEAM INPUT] Specific relationship context or prior association with the company.',
  ],
} as const

// ── CSR File Naming ─────────────────────────────────────────────────

function sanitiseCompany(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40)
}

export function generateCsrFileName(company: string, ext: 'pptx' | 'docx'): string {
  const date = new Date().toISOString().slice(0, 10)
  return `CSF-CSR-Concept_${sanitiseCompany(company)}_${date}.${ext}`
}

// ── File Naming ─────────────────────────────────────────────────────

function sanitise(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
}

export function generateFileName(title: string, ext: 'pptx' | 'docx'): string {
  const date = new Date().toISOString().slice(0, 10)
  return `CSF-Grant-Draft_${sanitise(title)}_${date}.${ext}`
}

// ── Decayed score for documents ─────────────────────────────────────

export function getDecayedScore(opp: Opportunity): number {
  return applyDecay(opp.relevance_score, opp.created_at, opp.type)
}
