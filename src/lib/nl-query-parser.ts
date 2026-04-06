import type { CompanySummary } from './csr-utils'
import type { CsrLead } from '../types'

/**
 * Structured filter produced by the NL parser.
 * Each field is optional — only set fields are applied.
 */
export interface NlFilter {
  // Company name
  companySearch?: string

  // Spend thresholds
  minEduSpend?: number
  maxEduSpend?: number
  minVocSpend?: number
  maxVocSpend?: number
  minTotalSpend?: number
  maxTotalSpend?: number

  // Education percentage
  minEduPct?: number
  maxEduPct?: number

  // Boolean filters
  shortlistedOnly?: boolean
  notShortlisted?: boolean
  inPipeline?: boolean
  notInPipeline?: boolean
  hasCsrHeadEmail?: boolean
  hasVerifiedEmail?: boolean
  hasCeo?: boolean
  hasLinkedin?: boolean
  hasReport?: boolean
  hasFundedNgos?: boolean
  hasEduSpend?: boolean
  hasVocSpend?: boolean

  // NGO partner name search
  ngoSearch?: string

  // Pipeline stage
  pipelineStage?: string

  // Sort / limit
  topN?: number
  sortBy?: 'eduSpend' | 'vocSpend' | 'totalSpend' | 'eduPct' | 'company'
  sortDir?: 'asc' | 'desc'

  // Meta
  countOnly?: boolean
}

// ── Amount parsing ──────────────────────────────────────────────────

const CRORE = 1_00_00_000
const LAKH = 1_00_000

function parseAmount(numStr: string, unit?: string): number {
  const n = parseFloat(numStr.replace(/,/g, ''))
  if (isNaN(n)) return 0
  const u = (unit || '').toLowerCase().trim()
  if (/^(crore|cr|crs?)$/i.test(u)) return n * CRORE
  if (/^(lakh|lac|lakhs?|lacs?)$/i.test(u)) return n * LAKH
  if (/^(million|m|mn)$/i.test(u)) return n * 10_00_000
  if (/^(billion|b|bn)$/i.test(u)) return n * 100_00_00_000
  // Bare number — if small (1-1000), user likely means crore
  if (!u && n >= 1 && n <= 1000) return n * CRORE
  return n
}

// ── Spend context detection ─────────────────────────────────────────

type SpendField = 'edu' | 'voc' | 'total'

function detectSpendContext(text: string): SpendField {
  if (/\bvoc(?:ational)?(?:\s+skill)?/i.test(text)) return 'voc'
  if (/\btotal(?:\s+csr)?/i.test(text)) return 'total'
  return 'edu'
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Check if a number in the text is immediately followed by % */
function isPercentageContext(text: string): boolean {
  return /\d\s*%/.test(text) ||
    /(?:percent(?:age)?|edu(?:cation)?\s*%|edu(?:cation)?\s+percent)/i.test(text)
}

// ── Rule-based parser ───────────────────────────────────────────────

export function parseNlQuery(query: string): NlFilter | null {
  const raw = query.trim()
  if (!raw) return null

  const q = raw.replace(/\s+/g, ' ').replace(/[?!.]+$/g, '').trim()
  const lower = q.toLowerCase()
  const filter: NlFilter = {}
  let matched = false

  // ── Strip question preamble ──
  const stripped = lower
    .replace(/^(which|what|who(?:\s+are)?|show(?:\s+me)?|list(?:\s+all)?|find(?:\s+me)?|display|get|give(?:\s+me)?|tell(?:\s+me)?|i\s+want(?:\s+to\s+see)?)\s+/i, '')
    .replace(/^(the|all|all\s+the|every)\s+/i, '')
    .replace(/^compan(?:y|ies)\s+(?:that|which|who|where|with|having|spending)\s+/i, '')

  // ── "how many" / count queries ──
  if (/^how\s+many\b/i.test(lower)) {
    filter.countOnly = true
    matched = true
  }

  // ── "top N" / "bottom N" / "first N" / "largest N" ──
  const topMatch = stripped.match(/\b(?:top|first|biggest|largest|highest)\s+(\d+)\b/)
  if (topMatch) {
    filter.topN = parseInt(topMatch[1], 10)
    filter.sortBy = detectSpendContext(stripped) === 'voc' ? 'vocSpend' :
                     detectSpendContext(stripped) === 'total' ? 'totalSpend' : 'eduSpend'
    filter.sortDir = 'desc'
    matched = true
  }
  const bottomMatch = stripped.match(/\b(?:bottom|last|smallest|lowest)\s+(\d+)\b/)
  if (bottomMatch) {
    filter.topN = parseInt(bottomMatch[1], 10)
    filter.sortBy = detectSpendContext(stripped) === 'voc' ? 'vocSpend' :
                     detectSpendContext(stripped) === 'total' ? 'totalSpend' : 'eduSpend'
    filter.sortDir = 'asc'
    matched = true
  }

  // ══════════════════════════════════════════════════════════════════
  // PERCENTAGE CHECKS — must run BEFORE spend thresholds so that
  // "above 80%" is not misinterpreted as "above 80 crore".
  // ══════════════════════════════════════════════════════════════════

  // Pattern 1: "education percentage above 50" / "edu % over 60" / "edu% above 75"
  const pctA = lower.match(/edu(?:cation)?\s*(?:%|percent(?:age)?)\s+(?:over|above|more\s+than|at\s+least|greater\s+than|>=?\s*)\s*(\d+)/i)
  if (pctA) { filter.minEduPct = parseInt(pctA[1], 10) / 100; matched = true }

  // Pattern 2: "above 80% education" / "over 50% edu" / ">50% edu" / "more than 90% education spend"
  if (!filter.minEduPct) {
    const pctB = lower.match(/(?:over|above|more\s+than|at\s+least|greater\s+than|>=?\s*)\s*(\d+)\s*%\s*(?:edu(?:cation)?|education\s+spend)/i)
    if (pctB) { filter.minEduPct = parseInt(pctB[1], 10) / 100; matched = true }
  }

  // Pattern 3: "education spend above 80%" / "education above 80%" — keyword + number%
  if (!filter.minEduPct) {
    const pctC = lower.match(/edu(?:cation)?(?:\s+spend(?:ing)?)?\s+(?:over|above|more\s+than|at\s+least|greater\s+than|>=?\s*)\s*(\d+)\s*%/i)
    if (pctC) { filter.minEduPct = parseInt(pctC[1], 10) / 100; matched = true }
  }

  // Pattern 4: "companies with education above 80%" — "education" ... comparator ... number%
  if (!filter.minEduPct) {
    const pctD = lower.match(/(?:with\s+)?edu(?:cation)?[^,]*?(?:over|above|more\s+than|at\s+least|greater\s+than|>=?\s*)\s*(\d+)\s*%/i)
    if (pctD) { filter.minEduPct = parseInt(pctD[1], 10) / 100; matched = true }
  }

  // Pattern 5: Bare "80% education" / "80% edu" — number% + education keyword (no comparator)
  if (!filter.minEduPct) {
    const pctE = lower.match(/(\d+)\s*%\s*edu(?:cation)?/i)
    if (pctE) { filter.minEduPct = parseInt(pctE[1], 10) / 100; matched = true }
  }

  // Pattern 6: "high edu %" / "strong education percentage"
  if (!filter.minEduPct) {
    if (/(?:high|strong)\s+edu(?:cation)?\s+(?:%|percent(?:age)?)/i.test(lower)) {
      filter.minEduPct = 0.5
      matched = true
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // SPEND THRESHOLDS — only match when NOT a percentage context
  // ══════════════════════════════════════════════════════════════════

  // "over/above/more than/at least/exceeding X crore/lakh"
  if (!filter.minEduPct) {
    const minSpendPatterns = [
      /(?:over|above|more\s+than|greater\s+than|at\s+least|minimum|min|exceeding|exceed|>=?\s*)\s*(?:₹\s*|rs\.?\s*|inr\s*)?([\d,.]+)\s*(crore|cr|crs?|lakh|lac|lakhs?|lacs?|million|m|mn|billion|b|bn)?\b/gi,
      /(?:spend(?:s|ing)?|spenders?)\s+(?:over|above|more\s+than|at\s+least)\s*(?:₹\s*|rs\.?\s*|inr\s*)?([\d,.]+)\s*(crore|cr|crs?|lakh|lac|lakhs?|lacs?|million|m|mn)?\b/gi,
    ]
    for (const pattern of minSpendPatterns) {
      const match = pattern.exec(lower)
      if (match && !isPercentageContext(lower)) {
        const amount = parseAmount(match[1], match[2])
        if (amount > 0) {
          const field = detectSpendContext(lower)
          if (field === 'voc') filter.minVocSpend = amount
          else if (field === 'total') filter.minTotalSpend = amount
          else filter.minEduSpend = amount
          matched = true
        }
        break
      }
    }
  }

  // "under/below/less than/up to/max X crore/lakh"
  if (!filter.minEduPct) {
    const maxSpendPatterns = [
      /(?:under|below|less\s+than|up\s+to|at\s+most|max(?:imum)?|<=?\s*)\s*(?:₹\s*|rs\.?\s*|inr\s*)?([\d,.]+)\s*(crore|cr|crs?|lakh|lac|lakhs?|lacs?|million|m|mn|billion|b|bn)?\b/gi,
    ]
    for (const pattern of maxSpendPatterns) {
      const match = pattern.exec(lower)
      if (match && !isPercentageContext(lower)) {
        const amount = parseAmount(match[1], match[2])
        if (amount > 0) {
          const field = detectSpendContext(lower)
          if (field === 'voc') filter.maxVocSpend = amount
          else if (field === 'total') filter.maxTotalSpend = amount
          else filter.maxEduSpend = amount
          matched = true
        }
        break
      }
    }
  }

  // "between X and Y crore" / "from X to Y crore"
  if (!filter.minEduSpend && !filter.maxEduSpend && !filter.minVocSpend && !filter.maxVocSpend && !filter.minTotalSpend && !filter.maxTotalSpend) {
    const rangePattern = /(?:between|from)\s*(?:₹\s*|rs\.?\s*)?([\d,.]+)\s*(?:and|to|-)\s*(?:₹\s*|rs\.?\s*)?([\d,.]+)\s*(crore|cr|crs?|lakh|lac|lakhs?|lacs?|million|m|mn)?\b/gi
    const rangeMatch = rangePattern.exec(lower)
    if (rangeMatch) {
      const lo = parseAmount(rangeMatch[1], rangeMatch[3])
      const hi = parseAmount(rangeMatch[2], rangeMatch[3])
      if (lo > 0 && hi > 0) {
        const field = detectSpendContext(lower)
        if (field === 'voc') { filter.minVocSpend = lo; filter.maxVocSpend = hi }
        else if (field === 'total') { filter.minTotalSpend = lo; filter.maxTotalSpend = hi }
        else { filter.minEduSpend = lo; filter.maxEduSpend = hi }
        matched = true
      }
    }
  }

  // "X crore+" shorthand
  if (!filter.minEduSpend && !filter.minVocSpend && !filter.minTotalSpend) {
    const plusPattern = /(?:₹\s*|rs\.?\s*|inr\s*)?([\d,.]+)\s*(crore|cr|crs?|lakh|lac|lakhs?|lacs?)\s*\+/gi
    const plusMatch = plusPattern.exec(lower)
    if (plusMatch) {
      const amount = parseAmount(plusMatch[1], plusMatch[2])
      if (amount > 0) {
        const field = detectSpendContext(lower)
        if (field === 'voc') filter.minVocSpend = amount
        else if (field === 'total') filter.minTotalSpend = amount
        else filter.minEduSpend = amount
        matched = true
      }
    }
  }

  // ── Shortlisted / starred ──
  if (/\b(shortlisted|starred|favourit(?:e|ed)|bookmarked|my\s+list)\b/i.test(lower)) {
    // Check for negation BEFORE the keyword
    const beforeKeyword = lower.split(/shortlist|star|favourit|bookmark/i)[0] || ''
    if (/\b(not|un|without|exclude|excluding|except)\b/i.test(beforeKeyword)) {
      filter.notShortlisted = true
    } else {
      filter.shortlistedOnly = true
    }
    matched = true
  }

  // ── Pipeline status ──
  // IMPORTANT: Check "not in pipeline" BEFORE "in pipeline" to avoid both matching
  if (/\b(not\s+(?:in\s+)?(?:the\s+)?pipeline|without\s+pipeline|no\s+pipeline|outside\s+pipeline|haven'?t\s+(?:been\s+)?added|not\s+(?:yet\s+)?added)\b/i.test(lower)) {
    filter.notInPipeline = true
    matched = true
  } else if (/\b(in\s+(?:the\s+)?pipeline|pipeline\s+companies|pipeline\s+leads|already\s+added|added\s+to\s+pipeline)\b/i.test(lower)) {
    filter.inPipeline = true
    matched = true
  }

  // ── Pipeline stage (specific) ──
  // Use word-boundary-aware matching, check multi-word phrases first (longest first)
  const stagePatterns: [RegExp, string][] = [
    [/\b(?:proposal[\s_]sent|sent\s+proposal)\b/i, 'proposal_sent'],
    [/\bclosed\s+won\b/i, 'won'],
    [/\bclosed\s+lost\b/i, 'lost'],
    [/\bon[\s-]hold\b/i, 'paused'],
    [/\breaching\s+out\b/i, 'outreach'],
    [/\b(?:in\s+)?outreach\b/i, 'outreach'],
    [/\bresearching\b/i, 'researching'],
    [/\bprospect(?:s)?\b(?!\s+(?:for|of|to|that|which|who|we|i|should|could|would|can|may))/i, 'prospect'],
    [/\bresponded\b/i, 'responded'],
    [/\baccepted\b/i, 'won'],
    [/\bdeclined\b/i, 'lost'],
    [/\brejected\b/i, 'lost'],
    [/\bpaused\b/i, 'paused'],
    // "won" and "lost" need word boundaries to avoid matching inside other words
    [/\bwon\b(?!\s+(?:'t|t))/i, 'won'],
    [/\blost\b(?!\s+(?:track|touch|sight))/i, 'lost'],
  ]
  for (const [pattern, stage] of stagePatterns) {
    if (pattern.test(lower)) {
      filter.pipelineStage = stage
      filter.inPipeline = true
      // Override notInPipeline if a specific stage is requested
      filter.notInPipeline = undefined
      matched = true
      break
    }
  }

  // ── Contact / leadership info ──
  // Email — require context words to avoid "email me" false positives
  if (/\b((?:csr\s*head\s*)?email\s+(?:available|address|id)|(?:with|has|have|having)\s+(?:csr\s*head\s*)?email|contactable|reachable)\b/i.test(lower)) {
    filter.hasCsrHeadEmail = true
    matched = true
  }
  if (/\b(verified\s+email|confirmed\s+email|email\s+verified|valid\s+email)\b/i.test(lower)) {
    filter.hasVerifiedEmail = true
    matched = true
  }

  // CEO
  if (/\b((?:has|with)\s+ceo|ceo\s+(?:info|available|details|name)|know(?:n)?\s+ceo)\b/i.test(lower)) {
    filter.hasCeo = true
    matched = true
  }

  // LinkedIn
  if (/\b(linkedin|linked\s+in)\b/i.test(lower)) {
    filter.hasLinkedin = true
    matched = true
  }

  // ── Report ──
  if (/\b((?:has|with|and)\s+(?:annual\s+|csr\s+)?report|report\s+(?:available|link)|annual\s+report|csr\s+report)\b/i.test(lower)) {
    filter.hasReport = true
    matched = true
  }

  // ── NGO partners (boolean: has any) ──
  if (/\b((?:has|with)\s+(?:education\s+)?ngos?|ngos?\s+partners?|funded\s+ngos?|education\s+ngos?|(?:has|with)\s+partners?|partners?\s+(?:available|listed))\b/i.test(lower)) {
    filter.hasFundedNgos = true
    matched = true
  }

  // ── NGO partner name search ──
  // Patterns: "<Name> is an NGO partner", "companies funding <Name>",
  // "who funds <Name>", "partnered with <Name>", "works with <Name>"
  if (!filter.ngoSearch) {
    const ngoNamePatterns: RegExp[] = [
      // "<Name> is an/a NGO/education partner"
      /^(.+?)\s+(?:is\s+)?(?:an?\s+)?(?:ngo|education)\s+partner/i,
      // "<Name> is a partner" / "<Name> as partner"
      /^(.+?)\s+(?:is\s+(?:an?\s+)?|as\s+(?:an?\s+)?)partner/i,
      // "companies funding <Name>" / "who funds <Name>" / "funds <Name>"
      /(?:fund(?:s|ed|ing)?|sponsor(?:s|ed|ing)?)\s+(.+?)$/i,
      // "partnered with <Name>" / "partner with <Name>" / "works with <Name>" / "working with <Name>"
      /(?:partner(?:ed|ing|s)?\s+with|work(?:s|ed|ing)?\s+with)\s+(.+?)$/i,
      // "NGO partner <Name>" / "ngo partner: <Name>"
      /(?:ngo|education)\s+partner:?\s+(.+?)$/i,
      // "companies with <Name> as partner/NGO"
      /(?:with|has|have)\s+(.+?)\s+as\s+(?:an?\s+)?(?:ngo|partner)/i,
      // "show <Name> partners" / "list <Name> funders" (Name before "partners/funders")
      /^(?:show|list|find|display|get)?\s*(.+?)\s+(?:partners?|funders?|funding\s+companies)\s*$/i,
    ]
    for (const pattern of ngoNamePatterns) {
      const m = raw.match(pattern)
      if (m) {
        let name = m[1].trim()
        // Strip leading preamble words that aren't part of a name
        name = name.replace(/^(?:show|list|find|display|get|which|what|all|the|companies?\s+(?:that\s+)?(?:fund|partner|work)(?:s|ed|ing)?\s*(?:with)?\s*)\s*/i, '').trim()
        // Must look like a proper name — reject if ALL words are generic/filter terms
        const genericWords = new Set(['companies', 'company', 'top', 'bottom', 'over', 'above', 'under', 'below', 'shortlisted', 'shortlist', 'pipeline', 'with', 'has', 'have', 'and', 'or', 'the', 'all', 'every', 'that', 'which', 'who', 'how', 'many', 'ngo', 'ngos', 'partner', 'partners', 'funded', 'funding', 'education', 'an', 'a', 'is', 'are', 'their', 'these', 'those', 'some', 'any'])
        const nameWords = name.toLowerCase().split(/\s+/)
        const hasProperWord = nameWords.some(w => !genericWords.has(w))
        if (name.length >= 2 && hasProperWord) {
          filter.ngoSearch = name
          filter.hasFundedNgos = true
          matched = true
          break
        }
      }
    }
  }

  // ── Has education / vocational spend (non-zero) ──
  if (/\b(?:spend(?:s|ing)?(?:\s+(?:on|in))?\s+education|education\s+spend(?:ers?|ing)?|edu(?:cation)?\s+csr)\b/i.test(lower) && !filter.minEduSpend && !filter.minEduPct) {
    filter.hasEduSpend = true
    matched = true
  }
  if (/\b(?:spend(?:s|ing)?(?:\s+(?:on|in))?\s+voc(?:ational)?|voc(?:ational)?\s+spend(?:ers?|ing)?|voc(?:ational)?\s+csr|vocational\s+skill)\b/i.test(lower) && !filter.minVocSpend) {
    filter.hasVocSpend = true
    matched = true
  }

  // ── Sort ──
  if (/\bsort(?:ed)?\s+by\b/i.test(lower) || /\border(?:ed)?\s+by\b/i.test(lower) || /\bby\s+(?:education|vocational|total|name|edu\s*%)/i.test(lower) || /\balphabetica/i.test(lower)) {
    if (/\bvoc(?:ational)?/i.test(lower)) { filter.sortBy = 'vocSpend'; filter.sortDir = 'desc' }
    else if (/\btotal/i.test(lower)) { filter.sortBy = 'totalSpend'; filter.sortDir = 'desc' }
    else if (/\bedu(?:cation)?\s*(?:%|percent)/i.test(lower)) { filter.sortBy = 'eduPct'; filter.sortDir = 'desc' }
    else if (/\bname\b|alphabeti/i.test(lower)) { filter.sortBy = 'company'; filter.sortDir = 'asc' }
    else { filter.sortBy = 'eduSpend'; filter.sortDir = 'desc' }
    matched = true
  }
  if (/\b(ascending|asc|lowest\s+first|smallest\s+first|a\s*-?\s*z)\b/i.test(lower)) {
    filter.sortDir = 'asc'
  }
  if (/\b(descending|desc|highest\s+first|biggest\s+first|z\s*-?\s*a)\b/i.test(lower)) {
    filter.sortDir = 'desc'
  }

  // ── Education / vocational context for topN without explicit sort ──
  if (filter.topN && !filter.sortBy) {
    const ctx = detectSpendContext(stripped)
    if (ctx === 'voc') filter.sortBy = 'vocSpend'
    else if (ctx === 'total') filter.sortBy = 'totalSpend'
    else if (/\bedu(?:cation)?\s*(?:%|percent)/i.test(stripped)) filter.sortBy = 'eduPct'
    else filter.sortBy = 'eduSpend'
    if (!filter.sortDir) filter.sortDir = 'desc'
  }

  // ── Company name search ──
  // 1. Quoted strings always become company search
  const quotedMatch = raw.match(/["'\u201C\u201D\u2018\u2019]([^"'\u201C\u201D\u2018\u2019]+)["'\u201C\u201D\u2018\u2019]/)
  if (quotedMatch) {
    filter.companySearch = quotedMatch[1].trim()
    matched = true
  }

  // 2. "named/called X" — extract from ORIGINAL case string
  if (!filter.companySearch) {
    const namedMatch = raw.match(/(?:named|called|name\s+is|name\s+contains?)\s+["']?([A-Za-z][\w\s]+?)["']?\s*(?:$|(?:with|that|who|spending|over|above|and))/i)
    if (namedMatch && namedMatch[1].trim().length >= 2) {
      filter.companySearch = namedMatch[1].trim()
      matched = true
    }
  }

  // 3. "starting with X" / "beginning with X"
  if (!filter.companySearch) {
    const startsMatch = raw.match(/(?:start(?:ing|s)?|begin(?:ning|s)?)\s+with\s+["']?([A-Za-z][\w\s]*?)["']?\s*$/i)
    if (startsMatch) {
      filter.companySearch = startsMatch[1].trim()
      matched = true
    }
  }

  // 4. Fallback: treat unmatched input as company search if it looks like a name
  if (!matched && q.length >= 2 && q.length <= 60) {
    const filterKeywords = /\b(top|bottom|over|above|under|below|more|less|shortlist|pipeline|email|report|ngo|sort|how\s+many|spend|crore|lakh|education|vocational|csr|percent|%)\b/i
    if (!filterKeywords.test(q)) {
      filter.companySearch = raw.trim() // preserve original case
      matched = true
    }
  }

  return matched ? filter : null
}

// ── Human-readable description of applied filter ────────────────────

export function describeFilter(filter: NlFilter): string {
  const parts: string[] = []

  if (filter.companySearch) parts.push(`name contains "${filter.companySearch}"`)
  if (filter.minEduSpend) parts.push(`education spend >= ${fmtCr(filter.minEduSpend)}`)
  if (filter.maxEduSpend) parts.push(`education spend <= ${fmtCr(filter.maxEduSpend)}`)
  if (filter.minVocSpend) parts.push(`vocational spend >= ${fmtCr(filter.minVocSpend)}`)
  if (filter.maxVocSpend) parts.push(`vocational spend <= ${fmtCr(filter.maxVocSpend)}`)
  if (filter.minTotalSpend) parts.push(`total CSR >= ${fmtCr(filter.minTotalSpend)}`)
  if (filter.maxTotalSpend) parts.push(`total CSR <= ${fmtCr(filter.maxTotalSpend)}`)
  if (filter.minEduPct) parts.push(`education % >= ${Math.round(filter.minEduPct * 100)}%`)
  if (filter.shortlistedOnly) parts.push('shortlisted only')
  if (filter.notShortlisted) parts.push('not shortlisted')
  if (filter.inPipeline) parts.push(filter.pipelineStage ? `pipeline: ${filter.pipelineStage.replace('_', ' ')}` : 'in pipeline')
  if (filter.notInPipeline) parts.push('not in pipeline')
  if (filter.hasCsrHeadEmail) parts.push('has CSR head email')
  if (filter.hasVerifiedEmail) parts.push('verified email')
  if (filter.hasCeo) parts.push('has CEO info')
  if (filter.hasLinkedin) parts.push('has LinkedIn')
  if (filter.hasReport) parts.push('has report')
  if (filter.ngoSearch) parts.push(`NGO partner: "${filter.ngoSearch}"`)
  else if (filter.hasFundedNgos) parts.push('has NGO partners')
  if (filter.hasEduSpend) parts.push('has education spend')
  if (filter.hasVocSpend) parts.push('has vocational spend')
  if (filter.topN) parts.push(`top ${filter.topN}`)
  if (filter.sortBy) parts.push(`sorted by ${filter.sortBy}${filter.sortDir === 'asc' ? ' (asc)' : ''}`)
  if (filter.countOnly) parts.push('count only')

  return parts.length > 0 ? parts.join(' · ') : 'no filters applied'
}

function fmtCr(n: number): string {
  if (n >= CRORE) return `₹${(n / CRORE).toFixed(n % CRORE === 0 ? 0 : 1)} Cr`
  if (n >= LAKH) return `₹${(n / LAKH).toFixed(n % LAKH === 0 ? 0 : 1)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

// ── Filter application ──────────────────────────────────────────────

export function applyNlFilter(
  companies: CompanySummary[],
  filter: NlFilter,
  shortlist: { isShortlisted: (cin: string) => boolean },
  leads: CsrLead[],
): CompanySummary[] {
  const leadMap = new Map(leads.filter(l => !l.is_archived).map(l => [l.cin, l]))

  let result = companies

  if (filter.companySearch) {
    const q = filter.companySearch.toLowerCase()
    result = result.filter(c => c.company.toLowerCase().includes(q))
  }

  if (filter.minEduSpend) result = result.filter(c => c.eduSpend >= filter.minEduSpend!)
  if (filter.maxEduSpend) result = result.filter(c => c.eduSpend <= filter.maxEduSpend!)
  if (filter.minVocSpend) result = result.filter(c => c.vocSpend >= filter.minVocSpend!)
  if (filter.maxVocSpend) result = result.filter(c => c.vocSpend <= filter.maxVocSpend!)
  if (filter.minTotalSpend) result = result.filter(c => c.totalSpend >= filter.minTotalSpend!)
  if (filter.maxTotalSpend) result = result.filter(c => c.totalSpend <= filter.maxTotalSpend!)

  if (filter.minEduPct) {
    result = result.filter(c => c.totalSpend > 0 && (c.eduSpend / c.totalSpend) >= filter.minEduPct!)
  }
  if (filter.maxEduPct) {
    result = result.filter(c => c.totalSpend > 0 && (c.eduSpend / c.totalSpend) <= filter.maxEduPct!)
  }

  if (filter.hasEduSpend) result = result.filter(c => c.eduSpend > 0)
  if (filter.hasVocSpend) result = result.filter(c => c.vocSpend > 0)

  if (filter.shortlistedOnly) result = result.filter(c => shortlist.isShortlisted(c.cin))
  if (filter.notShortlisted) result = result.filter(c => !shortlist.isShortlisted(c.cin))

  if (filter.inPipeline) {
    if (filter.pipelineStage) {
      result = result.filter(c => leadMap.get(c.cin)?.pipeline_stage === filter.pipelineStage)
    } else {
      result = result.filter(c => leadMap.has(c.cin))
    }
  }
  if (filter.notInPipeline) result = result.filter(c => !leadMap.has(c.cin))

  if (filter.hasCsrHeadEmail) result = result.filter(c => c.csrHead?.email)
  if (filter.hasVerifiedEmail) result = result.filter(c => c.csrHead?.email_verified === true)
  if (filter.hasCeo) result = result.filter(c => c.ceo?.name)
  if (filter.hasLinkedin) result = result.filter(c => c.ceo?.linkedin || c.csrHead?.linkedin)

  if (filter.hasReport) result = result.filter(c => c.reportUrl)

  // NGO name search (substring match against funded NGO names)
  if (filter.ngoSearch) {
    const nq = filter.ngoSearch.toLowerCase()
    result = result.filter(c =>
      c.fundedNgos?.some(ngo => ngo.ngo.toLowerCase().includes(nq))
    )
  } else if (filter.hasFundedNgos) {
    result = result.filter(c => c.fundedNgos && c.fundedNgos.length > 0)
  }

  if (filter.sortBy) {
    const dir = filter.sortDir === 'asc' ? 1 : -1
    result = [...result].sort((a, b) => {
      let av: number | string, bv: number | string
      switch (filter.sortBy) {
        case 'eduSpend': av = a.eduSpend; bv = b.eduSpend; break
        case 'vocSpend': av = a.vocSpend; bv = b.vocSpend; break
        case 'totalSpend': av = a.totalSpend; bv = b.totalSpend; break
        case 'eduPct':
          av = a.totalSpend > 0 ? a.eduSpend / a.totalSpend : 0
          bv = b.totalSpend > 0 ? b.eduSpend / b.totalSpend : 0
          break
        case 'company': av = a.company.toLowerCase(); bv = b.company.toLowerCase(); break
        default: return 0
      }
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }

  if (filter.topN && filter.topN > 0) {
    result = result.slice(0, filter.topN)
  }

  return result
}

// ── Example queries (used by UI for suggestions) ────────────────────

export const EXAMPLE_QUERIES = [
  'Top 20 education spenders',
  'Companies over 50 crore',
  'Shortlisted with CSR head email',
  'Not in pipeline with report',
  'Between 10 and 100 crore education spend',
  'Top 10 vocational spenders',
  'Companies with NGO partners',
  'Companies funding Pratham',
  'Bottom 5 education spenders',
  'Education percentage above 80',
]
