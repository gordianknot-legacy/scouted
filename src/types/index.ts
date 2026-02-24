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
