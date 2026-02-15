export interface Source {
  name: string
  url: string
  parser: string
}

// Sources for scouting education funding opportunities and potential donors
export const SOURCES: Source[] = [
  // === Indian Grant Aggregators ===
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

  // === CSR Data ===
  {
    name: 'CSRBox Education CSR',
    url: 'https://csrbox.org/India-list-CSR-projects-India',
    parser: 'csrbox',
  },

  // === Philanthropy & Development News ===
  {
    name: 'IDR (India Development Review)',
    url: 'https://idronline.org/sectors/education/feed',
    parser: 'idr',
  },
  {
    name: 'Devex News',
    url: 'https://devex.com/news/feed.rss',
    parser: 'devex',
  },
  {
    name: 'Alliance Magazine',
    url: 'https://alliancemagazine.org/feed',
    parser: 'alliance',
  },

  // === Discovery (Google Custom Search) ===
  {
    name: 'Google CSE Discovery',
    url: 'https://www.googleapis.com/customsearch/v1',
    parser: 'google-cse',
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

// Known major education funders — used for donor scoring (+15)
// Includes CSF's current donors and other known large education philanthropies
export const KNOWN_EDUCATION_FUNDERS = [
  // CSF current donors
  'bajaj', 'british asian trust', 'campus', 'datla', 'marshall',
  'ey foundation', 'founders pledge', 'gates foundation', 'bill & melinda gates',
  'google.org', 'havells', 'hdfc', 'parivartan', 'kalinga',
  'lt foods', 'maitri trust', 'motivation for excellence',
  'mohanlal bhartia', 'michael & susan dell', 'dell foundation',
  'mubadala', 'nalanda', 'natco', 'prevail fund',
  'reliance foundation', 'steadview', 'tarsadia', 'ubs optimus',
  // Other known education philanthropies
  'azim premji', 'wipro foundation', 'infosys foundation', 'tata trusts',
  'tata steel', 'adani foundation', 'bharti foundation',
  'ikea foundation', 'mastercard foundation', 'hewlett foundation',
  'children\'s investment fund', 'ciff', 'omidyar network',
  'mulago foundation', 'packard foundation', 'ford foundation',
  'macarthur foundation', 'rockefeller', 'skoll foundation',
  'echidna giving', 'lego foundation', 'aga khan foundation',
  'open society', 'soros', 'unicef', 'world bank', 'dfid', 'usaid',
  'save the children', 'room to read', 'pratham',
  // Large Indian corporates with education CSR
  'mahindra', 'godrej', 'kotak', 'hero', 'birla', 'ambani',
  'ultratech', 'larsen', 'hindalco', 'jsw', 'vedanta',
  'cipla foundation', 'dr reddy', 'sun pharma', 'sbi foundation',
  'hcl foundation', 'tech mahindra',
]
