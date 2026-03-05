export interface Opportunity {
  id: string
  title: string
  source_url: string
  description: string
  relevance_score: number
  deadline: string | null
  poc_email: string | null
  tags: string[]
  created_at: string
  organisation: string | null
  amount: string | null
  location: string | null
}

export interface UserAction {
  user_id: string
  opportunity_id: string
  is_bookmarked: boolean
  is_hidden: boolean
}

export interface Subscriber {
  id: string
  email: string
  created_at: string
}

export type ScoreLevel = 'high' | 'medium' | 'low'

export interface Filters {
  scoreLevel: ScoreLevel | null
  sectors: string[]
  states: string[]
  deadlineBefore: string | null
  search: string
}

export interface CsrSpendingRecord {
  id: string
  company: string
  cin: string
  field: string
  spend_inr: number
  fiscal_year: string
  created_at: string
}

// ── CSR Lead Pipeline ───────────────────────────────────────────────

export type PipelineStage = 'prospect' | 'researching' | 'outreach' | 'proposal_sent' | 'responded' | 'won' | 'lost' | 'paused'

export interface CsrLead {
  id: string
  cin: string
  company: string
  pipeline_stage: PipelineStage
  ishmeet_connected: boolean | null
  saurabh_connected: boolean | null
  connection_notes: string
  prior_association: string
  notes: string
  assigned_to: string
  fiscal_year: string
  created_at: string
  updated_at: string
}

// ── Donor Newsletter ────────────────────────────────────────────────

export interface Donor {
  id: string
  name: string
  email: string
  organisation: string | null
  tags: string[]
  is_active: boolean
  unsubscribe_token: string
  created_at: string
  updated_at: string
}

export type NewsletterStatus = 'draft' | 'scheduled' | 'sent' | 'failed'

export type NewsletterSectionType =
  | 'ceo_message'
  | 'section_header'
  | 'impact_story'
  | 'stats'
  | 'events'
  | 'cta'
  | 'custom'

export interface NewsletterSection {
  id: string
  type: NewsletterSectionType
  title: string
  body: string
  image: string | null
  stats?: { label: string; value: string }[]
  events?: { date: string; description: string }[]
  ctaLabel?: string
  ctaUrl?: string
}

export interface NewsletterContent {
  quarterLabel: string
  heroImage: string | null
  sections: NewsletterSection[]
}

export interface Newsletter {
  id: string
  title: string
  subject: string
  content_json: NewsletterContent
  html_rendered: string | null
  status: NewsletterStatus
  scheduled_at: string | null
  sent_at: string | null
  sent_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export const PIPELINE_STAGES: { key: PipelineStage; label: string; colour: string }[] = [
  { key: 'prospect', label: 'Prospect', colour: 'bg-gray-100 text-gray-700' },
  { key: 'researching', label: 'Researching', colour: 'bg-csf-light-blue/15 text-csf-blue' },
  { key: 'outreach', label: 'Outreach', colour: 'bg-csf-yellow/15 text-csf-blue' },
  { key: 'proposal_sent', label: 'Proposal Sent', colour: 'bg-csf-purple/10 text-csf-purple' },
  { key: 'responded', label: 'Responded', colour: 'bg-csf-light-blue/20 text-csf-blue' },
  { key: 'won', label: 'Accepted', colour: 'bg-csf-lime/15 text-csf-blue' },
  { key: 'lost', label: 'Declined', colour: 'bg-csf-orange/10 text-csf-orange' },
  { key: 'paused', label: 'Paused', colour: 'bg-gray-50 text-gray-400' },
]
