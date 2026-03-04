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

export type PipelineStage = 'prospect' | 'researching' | 'outreach' | 'proposal_sent' | 'won' | 'lost' | 'paused'

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

export const PIPELINE_STAGES: { key: PipelineStage; label: string; colour: string }[] = [
  { key: 'prospect', label: 'Prospect', colour: 'bg-gray-100 text-gray-700' },
  { key: 'researching', label: 'Researching', colour: 'bg-blue-50 text-csf-blue' },
  { key: 'outreach', label: 'Outreach', colour: 'bg-yellow-50 text-yellow-800' },
  { key: 'proposal_sent', label: 'Proposal Sent', colour: 'bg-purple-50 text-purple-700' },
  { key: 'won', label: 'Won', colour: 'bg-green-50 text-green-800' },
  { key: 'lost', label: 'Lost', colour: 'bg-red-50 text-red-700' },
  { key: 'paused', label: 'Paused', colour: 'bg-gray-50 text-gray-400' },
]
