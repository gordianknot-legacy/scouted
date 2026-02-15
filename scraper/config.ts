export interface Source {
  name: string
  url: string
  parser: string
}

// Indian K-12 education and early childhood education focused sources
export const SOURCES: Source[] = [
  {
    name: 'NGOBox Education Grants',
    url: 'https://ngobox.org/tag-Education-and-Education-Technology-(edtech)',
    parser: 'ngobox',
  },
  {
    name: 'NGOBox All Grants',
    url: 'https://ngobox.org/grant_announcement_listing.php',
    parser: 'ngobox',
  },
  {
    name: 'NGOBox RFP/EOI',
    url: 'https://ngobox.org/rfp_eoi_listing.php',
    parser: 'ngobox-rfp',
  },
  {
    name: 'FundsForNGOs Education',
    url: 'https://www2.fundsforngos.org/category/education/',
    parser: 'fundsforngos',
  },
  {
    name: 'FundsForNGOs India',
    url: 'https://www2.fundsforngos.org/tag/india/',
    parser: 'fundsforngos',
  },
]

// FLN and Foundational Literacy are merged
export const CSF_SECTORS = [
  'FLN',
  'Foundational Literacy',
  'Foundational Numeracy',
  'Foundational Learning',
  'School Governance',
  'EdTech',
  'Early Childhood',
  'Classroom Instruction',
  'High Potential Students',
  'Education',
  'Teacher Training',
]

// Priority states — higher relevance score
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
]
