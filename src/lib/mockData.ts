import type { Opportunity } from '../types'

// All opportunities are REAL RFPs / Calls for Applications with verified URLs.
// Only India-focused K-12 education / early childhood opportunities.
// No Indian government sources. International funders included where project is in India.
// Scores computed by algorithm: Sector +30, Geo (priority states) +20, Funding ≥1Cr +20, Duration ≥2yr +10
// Priority states: Punjab, Haryana, UP, Telangana, Odisha, Assam, Bihar, HP, Gujarat
export const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Michael & Susan Dell Foundation — Quality Schools Programme India',
    source_url: 'https://www.dell.org/apply/',
    description:
      'Accepts proposals for education projects in India focused on providing high-quality educational experiences to students from low-income backgrounds. Strengthens school leadership, empowers educators, and equips students with academic skills. Average grant size approximately ₹5 Crore ($600,000). Does not fund more than 25% of project budget or 10% of organisation\'s annual operating expenses. Rolling applications year-round. Historical focus on Haryana, Rajasthan, and Himachal Pradesh.',
    relevance_score: 70, // Sector(Education,School Governance,EdTech)+30, Geo(Haryana,HP)+20, Funding(₹5Cr)+20
    deadline: null,
    poc_email: null,
    tags: ['Education', 'School Governance', 'EdTech', 'High Potential Students'],
    created_at: '2026-02-14T08:00:00Z',
    organisation: 'Dell Foundation',
    amount: '~₹5 Crore (avg)',
    location: 'India',
  },
  {
    id: '2',
    title: 'HCLTech Grant — Education Category (Edition XII)',
    source_url: 'https://www.hclfoundation.org/hcltech-grant',
    description:
      'Annual grant programme for NGOs. The winning NGO in the Education category receives ₹5 Crore for a comprehensive four-year project. Eight runners-up receive ₹50 Lakh each for two-year projects. Total committed fund of ₹24 Crore across four categories. Designed for rural areas only. Requires minimum 5 years of organisational existence and average annual expenditure of ₹50 Lakh+. Edition XII expected to open ~May 2026.',
    relevance_score: 60, // Sector(Education)+30, Funding(₹5Cr)+20, Duration(4yr)+10
    deadline: '2026-06-30',
    poc_email: null,
    tags: ['Education', 'Classroom Instruction', 'Teacher Training'],
    created_at: '2026-02-13T08:00:00Z',
    organisation: 'HCL Foundation',
    amount: '₹5 Crore (winner)',
    location: 'India',
  },
  {
    id: '3',
    title: 'ACT For Education — EdTech Fund for Bharat',
    source_url: 'https://actgrants.in/act-for-education/',
    description:
      'A ₹100 Crore fund to seed capabilities of education-centric organisations, accelerating their impact through strategic partnerships and distribution networks. Targets bottom three quartiles of India\'s population. Requires: tech-first solution leveraging technology for reach and affordability; designed for low-income families; demonstrated evidence of learning impact; potential for scale to millions of users in 3-5 years; and clear roadmap to sustainability.',
    relevance_score: 60, // Sector(EdTech,Foundational Literacy)+30, Funding(₹100Cr)+20, Duration(3-5yr)+10
    deadline: null,
    poc_email: null,
    tags: ['EdTech', 'Foundational Literacy', 'Classroom Instruction'],
    created_at: '2026-02-12T08:00:00Z',
    organisation: 'ACT Grants',
    amount: '₹100 Crore (fund)',
    location: 'India',
  },
  {
    id: '4',
    title: 'Wipro Foundation — Systemic Education Reform Grants',
    source_url: 'https://www.wiprofoundation.org/education/',
    description:
      'Provides grants to strengthen capacities of organisations working closely with teachers, head-teachers, communities, and the public education system towards improving the quality of school education in India. Grants of ₹30 to 60 Lakh over 3 years. Does NOT fund running of private schools, infrastructure, asset procurement, or student sponsorship. Focuses on systemic reform and capacity building. Active in Maharashtra and Gujarat. Next cycle expected mid-2026.',
    relevance_score: 60, // Sector(Education,Teacher Training,School Governance)+30, Geo(Gujarat)+20, Duration(3yr)+10
    deadline: null,
    poc_email: null,
    tags: ['Education', 'Teacher Training', 'School Governance', 'Classroom Instruction'],
    created_at: '2026-02-11T08:00:00Z',
    organisation: 'Wipro Foundation',
    amount: '₹30–60 Lakh (3 years)',
    location: 'Gujarat',
  },
  {
    id: '5',
    title: 'SBI Foundation — SBIF Muskaan Child Development RFP',
    source_url: 'https://sbifoundation.in/request-for-proposal',
    description:
      'Invites proposals from Indian nonprofits addressing child development challenges, including early childhood care, creating Model Anganwadi Centres, and supporting children in vulnerable situations. Preferred regions: Jharkhand, Odisha, Telangana. Grant range ₹25 Lakh to ₹2 Crore per project for 2-year period. Requires minimum 3 years of relevant experience. Watch for next RFP cycle.',
    relevance_score: 60, // Sector(Early Childhood,Education)+30, Geo(Odisha,Telangana)+20, Duration(2yr)+10
    deadline: null,
    poc_email: null,
    tags: ['Early Childhood', 'Education', 'FLN'],
    created_at: '2026-02-10T08:00:00Z',
    organisation: 'SBI Foundation',
    amount: '₹25 Lakh – ₹2 Crore',
    location: 'Odisha',
  },
  {
    id: '6',
    title: 'SBI Foundation — Foundational Learning for Out-of-School Girls (SBIF ILM)',
    source_url: 'https://sbifoundation.in/request-for-proposal',
    description:
      'CSR initiative for Foundational Literacy and Numeracy for out-of-school girls aged 6-14 from marginalised, tribal, and economically weaker communities. Project period 1-3 years (2025-2028). Requires registered Indian non-profit with 5+ years experience in FLN, remedial education, or girls\' education. Grant range ₹50 Lakh to ₹3 Crore. Watch for next RFP cycle.',
    relevance_score: 50, // Sector(FLN)+30, Funding(₹3Cr)+20. Geo: pan-India but no specific priority state in location. Duration check: "3 years" but in range "1-3" so first match is 1.
    deadline: null,
    poc_email: null,
    tags: ['FLN', 'Foundational Literacy', 'Education'],
    created_at: '2026-02-09T08:00:00Z',
    organisation: 'SBI Foundation',
    amount: '₹50 Lakh – ₹3 Crore',
    location: 'India',
  },
  {
    id: '7',
    title: 'Spencer Foundation — Large Research Grants on Education',
    source_url: 'https://www.spencer.org/grant_types/large-research-grant',
    description:
      'Supports large-scale academic education research that contributes to the improvement of education. India-based researchers studying foundational literacy, school governance, EdTech, classroom instruction, etc. are eligible. International proposals explicitly accepted. Duration: 1–5 years. Pre-proposal due February 24, 2026; full proposals due June 23, 2026.',
    relevance_score: 40, // Sector(Education,Classroom Instruction)+30, Duration(5yr)+10
    deadline: '2026-02-24',
    poc_email: null,
    tags: ['Education', 'Classroom Instruction', 'Education Research'],
    created_at: '2026-02-08T08:00:00Z',
    organisation: 'Spencer Foundation',
    amount: '$125,000–$500,000',
    location: 'India',
  },
  {
    id: '8',
    title: 'Spencer Foundation — Small Research Grants on Education',
    source_url: 'https://www.spencer.org/grant_types/small-research-grant',
    description:
      'Supports education research projects contributing to the improvement of education. Topics relevant to K-12, foundational literacy, early childhood, and school governance are eligible. Open to researchers at non-profit/public institutions internationally, including India. PI must hold a doctoral degree. Duration: 1–5 years.',
    relevance_score: 40, // Sector(Education)+30, Duration(5yr)+10
    deadline: '2026-04-15',
    poc_email: null,
    tags: ['Education', 'Foundational Literacy', 'Education Research'],
    created_at: '2026-02-07T08:00:00Z',
    organisation: 'Spencer Foundation',
    amount: 'Up to $50,000',
    location: 'India',
  },
  {
    id: '9',
    title: 'Spencer Foundation — Research-Practice Partnership Grants',
    source_url: 'https://www.spencer.org/grant_types/research-practice-partnerships',
    description:
      'Supports collaborative research between researchers and education practitioners (e.g., school systems, NGOs). Designed to produce research that directly informs education practice. Open internationally, including India-based partnerships. Duration: up to 3 years.',
    relevance_score: 40, // Sector(Education)+30, Duration(3yr)+10
    deadline: '2026-03-31',
    poc_email: null,
    tags: ['Education', 'Classroom Instruction', 'Education Research'],
    created_at: '2026-02-06T08:00:00Z',
    organisation: 'Spencer Foundation',
    amount: 'Up to $400,000',
    location: 'India',
  },
  {
    id: '10',
    title: 'Global Fund for Children — Small Grants for Education Organisations',
    source_url: 'https://globalfundforchildren.org/for-community-based-organizations/',
    description:
      'Provides grants to small, community-based organisations working directly with children and youth, including education projects in India. Grant decisions made twice yearly (June and December). Partners receive multi-year support for 3-6 years. Organisation budget must not exceed $200,000.',
    relevance_score: 40, // Sector(Education)+30, Duration(3-6yr → 3yr match)+10
    deadline: null,
    poc_email: null,
    tags: ['Education', 'Early Childhood'],
    created_at: '2026-02-05T08:00:00Z',
    organisation: 'Global Fund for Children',
    amount: '$5,000–$20,000/year',
    location: 'India',
  },
  {
    id: '11',
    title: 'Asha for Education — Project Funding for Indian Education NGOs',
    source_url: 'https://sv.ashanet.org/ngos/',
    description:
      'Funds education projects for underprivileged children in India (ages 5-14). Supports primary education, non-formal education, special education, and innovative educational methods. Has disbursed over $45 million to 400+ project partners across India. Projects must be secular, non-discriminatory, and focused on education. Rolling applications accepted year-round.',
    relevance_score: 30, // Sector(Education,Foundational Literacy)+30
    deadline: null,
    poc_email: null,
    tags: ['Education', 'Foundational Literacy', 'Early Childhood'],
    created_at: '2026-02-04T08:00:00Z',
    organisation: 'Asha for Education',
    amount: 'Varies by project',
    location: 'India',
  },
  {
    id: '12',
    title: 'Cisco India Cash Grants — Education Programme',
    source_url: 'https://www.cisco.com/c/en_in/about/csr/india-cash-grants.html',
    description:
      'Cash grants for nonprofits and NGOs working in education in India. Programmes must serve an audience greater than 65% economically underserved. Applications via Letter of Inquiry. Focus areas include digital literacy, EdTech for schools, and STEM education for underserved communities. Expected to reopen in early 2026.',
    relevance_score: 30, // Sector(Education,EdTech)+30
    deadline: null,
    poc_email: null,
    tags: ['Education', 'EdTech'],
    created_at: '2026-02-03T08:00:00Z',
    organisation: 'Cisco Foundation',
    amount: 'Varies',
    location: 'India',
  },
]
