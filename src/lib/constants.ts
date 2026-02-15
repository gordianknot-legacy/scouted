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
