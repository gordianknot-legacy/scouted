import { SOURCES } from './config.js'
import { calculateScore, type RawOpportunity } from './scoring.js'
import { upsertOpportunities, type DbOpportunity } from './supabase.js'
import { parseNgobox } from './parsers/ngobox.js'
import { parseNgoboxRfp } from './parsers/ngobox-rfp.js'
import { parseFundsForNgos } from './parsers/fundsforngos.js'
import { parseIdr } from './parsers/idr.js'
import { parseDevex } from './parsers/devex.js'
import { parseAlliance } from './parsers/alliance.js'
import { parseCsrbox } from './parsers/csrbox.js'
import { parseGoogleCse } from './parsers/google-cse.js'

const PARSERS: Record<string, (url: string) => Promise<RawOpportunity[]>> = {
  ngobox: parseNgobox,
  'ngobox-rfp': parseNgoboxRfp,
  fundsforngos: parseFundsForNgos,
  idr: parseIdr,
  devex: parseDevex,
  alliance: parseAlliance,
  csrbox: parseCsrbox,
  'google-cse': parseGoogleCse,
}

// All Indian states + UTs for location detection
const INDIA_MARKERS = [
  'india', 'indian', 'delhi', 'mumbai', 'bangalore', 'bengaluru', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad',
  'uttar pradesh', 'madhya pradesh', 'haryana', 'gujarat', 'rajasthan', 'odisha', 'jharkhand',
  'himachal pradesh', 'maharashtra', 'bihar', 'tamil nadu', 'karnataka', 'andhra pradesh',
  'telangana', 'kerala', 'west bengal', 'punjab', 'assam', 'chhattisgarh', 'uttarakhand',
  'goa', 'tripura', 'meghalaya', 'manipur', 'nagaland', 'mizoram', 'sikkim', 'arunachal pradesh',
  'south asia', 'subcontinent', 'developing countr', 'lmic', 'low-income countr',
  'global south', 'asia-pacific',
  // India-specific programmes and institutions
  'niti aayog', 'samagra shiksha', 'nep 2020', 'sarva shiksha', 'mid-day meal', 'icds',
]

// Multi-word phrases checked with includes()
const EDUCATION_PHRASES = [
  'education', 'school', 'teacher', 'literacy', 'numeracy', 'edtech', 'ed-tech',
  'classroom', 'scholarship', 'fellowship', 'anganwadi', 'early childhood', 'ecce',
  'pedagog', 'curriculum', 'skill development', 'k-12', 'foundational learning',
  'foundational literacy', 'foundational numeracy',
  'school governance', 'high potential', 'national education policy', 'nep',
  'samagra shiksha', 'pre-primary',
]

// Short keywords that need word-boundary matching to avoid false positives
const EDUCATION_REGEX = /\b(fln|stem|learning|student|academic|training)\b/i

// Negative keywords — reject titles containing these (unless also education-related)
const NEGATIVE_KEYWORDS = ['veterinary', 'petroleum', 'mining', 'military']

function isIndiaRelevant(opp: RawOpportunity): boolean {
  const text = `${opp.title} ${opp.description} ${opp.location || ''} ${opp.tags.join(' ')}`.toLowerCase()
  return INDIA_MARKERS.some(marker => text.includes(marker))
}

const FOREIGN_COUNTRIES = [
  'pakistan', 'bangladesh', 'sri lanka', 'nepal', 'afghanistan',
  'united states', 'united kingdom', 'canada', 'australia',
  'philippines', 'indonesia', 'malaysia', 'thailand', 'vietnam',
  'nigeria', 'kenya', 'south africa', 'brazil', 'mexico',
  'china', 'japan', 'korea', 'taiwan',
]

function isExplicitlyForeignCountry(opp: RawOpportunity): boolean {
  const title = opp.title.toLowerCase()
  // If title explicitly mentions India, it's fine even if it mentions other countries
  if (INDIA_MARKERS.some(m => title.includes(m))) return false
  // Check if title mentions a foreign country
  return FOREIGN_COUNTRIES.some(c => title.includes(c))
}

function isEducationRelevant(opp: RawOpportunity): boolean {
  // Only check title + description — NOT tags, since tags are self-assigned by our parsers
  const text = `${opp.title} ${opp.description}`.toLowerCase()
  return EDUCATION_PHRASES.some(phrase => text.includes(phrase)) || EDUCATION_REGEX.test(text)
}

function hasNegativeKeyword(opp: RawOpportunity): boolean {
  const title = opp.title.toLowerCase()
  if (NEGATIVE_KEYWORDS.some(k => title.includes(k))) {
    return !isEducationRelevant(opp)
  }
  return false
}

async function main() {
  console.log('=== ScoutEd Scraper ===')
  console.log(`Started at ${new Date().toISOString()}`)
  console.log(`Sources: ${SOURCES.length}\n`)

  let totalParsed = 0
  const allOpportunities: DbOpportunity[] = []

  for (const source of SOURCES) {
    console.log(`\n[${source.name}] Fetching ${source.url}...`)

    const parser = PARSERS[source.parser]
    if (!parser) {
      console.warn(`[${source.name}] No parser found for "${source.parser}", skipping`)
      continue
    }

    try {
      const raw = await parser(source.url)
      console.log(`[${source.name}] Parsed ${raw.length} raw opportunities`)
      totalParsed += raw.length

      // Source classification for filtering
      //
      // India-focused sources: trust education tagging, only filter for education
      //   NGOBox (all India-based), FundsForNGOs /tag/india/, CSRBox, IDR
      //
      // Education-focused sources: trust education categorisation, only filter for India
      //   FundsForNGOs /education/, /edtech/
      //
      // Pre-filtered sources: already filtered in parser (pass through)
      //   Google CSE (searches for India+education), Devex (filtered in parser), Alliance (filtered in parser)
      //
      // General sources: require both India + education match
      //   (none currently)
      //
      const isIndiaSource = source.url.includes('ngobox.org') ||
                            source.url.includes('/tag/india/') ||
                            source.url.includes('csrbox.org') ||
                            source.url.includes('idronline.org')
      const isEducationSource = /education|edtech/i.test(source.url)
      const isPreFiltered = source.parser === 'google-cse' ||
                            source.parser === 'devex' ||
                            source.parser === 'alliance'

      // Filter out items with deadlines older than 3 months
      const cutoff = new Date()
      cutoff.setMonth(cutoff.getMonth() - 3)
      const cutoffStr = cutoff.toISOString().split('T')[0]

      const filtered = raw.filter(opp => {
        // Filter out very old expired deadlines (>3 months ago)
        if (opp.deadline && opp.deadline < cutoffStr) return false

        // Exclude items that explicitly mention foreign countries in title
        if (isExplicitlyForeignCountry(opp)) return false

        // Reject negative keywords (veterinary, petroleum, etc.)
        if (hasNegativeKeyword(opp)) return false

        // Pre-filtered sources already did India+education filtering in the parser
        if (isPreFiltered) return true

        // Education-tagged sources: trust the source's categorization
        if (isEducationSource) {
          return isIndiaSource || isIndiaRelevant(opp)
        }

        // General sources: require education keyword match
        if (!isEducationRelevant(opp)) return false

        // India-focused general sources pass if education match
        if (isIndiaSource) return true

        // International general sources need India mention
        return isIndiaRelevant(opp)
      })

      console.log(`[${source.name}] After filter: ${filtered.length}`)

      // Score each opportunity
      const scored: DbOpportunity[] = filtered.map(opp => ({
        ...opp,
        relevance_score: calculateScore(opp),
      }))

      allOpportunities.push(...scored)
    } catch (err) {
      console.error(`[${source.name}] Failed:`, err)
    }
  }

  // Deduplicate by source_url
  const seen = new Set<string>()
  const unique = allOpportunities.filter(opp => {
    if (seen.has(opp.source_url)) return false
    seen.add(opp.source_url)
    return true
  })

  console.log(`\n=== Summary ===`)
  console.log(`Total parsed: ${totalParsed}`)
  console.log(`Unique after dedup: ${unique.length}`)

  // Upsert to Supabase
  if (unique.length > 0) {
    const inserted = await upsertOpportunities(unique)
    console.log(`Upserted ${inserted} opportunities to Supabase`)
  } else {
    console.log('No relevant opportunities found.')
  }

  console.log(`\nCompleted at ${new Date().toISOString()}`)
}

main().catch(err => {
  console.error('Scraper failed:', err)
  process.exit(1)
})
