// CSF Priority States — these get +20 geography bonus in scoring
export const CSF_PRIORITY_STATES = [
  'Punjab',
  'Haryana',
  'Uttar Pradesh',
  'Telangana',
  'Odisha',
  'Assam',
  'Bihar',
  'Himachal Pradesh',
  'Gujarat',
] as const

// All Indian states/UTs for the filter dropdown
export const ALL_INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
] as const

// FLN and Foundational Literacy are merged into a single sector
export const CSF_SECTORS = [
  'FLN / Foundational Literacy',
  'School Governance',
  'EdTech',
  'Early Childhood',
  'Classroom Instruction',
  'High Potential Students',
  'Education',
  'Teacher Training',
] as const

// Keywords that map to the merged FLN sector for scoring
export const FLN_KEYWORDS = [
  'fln',
  'foundational literacy',
  'foundational numeracy',
  'foundational learning',
] as const

export const SCORE_WEIGHTS = {
  sectorMatch: 30,
  geographyMatch: 20,
  fundingSize: 20,
  duration: 10,
  decayPerWeek: 5,
} as const

export const SCORE_THRESHOLDS = {
  high: 75,
  medium: 50,
} as const

// Type-aware decay rates (points per week)
export const DECAY_BY_TYPE: Record<string, number> = {
  grant: 5,
  rfp: 5,
  news: 8,
  blog: 8,
  government: 5,
}

// Content type display configuration
export const OPPORTUNITY_TYPES = [
  { key: 'grant', label: 'Grants', colour: 'bg-emerald-50 text-emerald-700' },
  { key: 'rfp', label: 'RFPs', colour: 'bg-purple-50 text-purple-700' },
  { key: 'news', label: 'News', colour: 'bg-blue-50 text-blue-700' },
  { key: 'government', label: 'Govt', colour: 'bg-red-50 text-red-700' },
  { key: 'blog', label: 'Blogs', colour: 'bg-amber-50 text-amber-700' },
] as const
