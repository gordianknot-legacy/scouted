import type { RawOpportunity } from '../scoring.js'
import { stripTags } from './utils.js'

interface DetailConfig {
  /** CSS-like content selector description for logging */
  sourceName: string
  /** Max opportunities to enrich (prevents runaway fetches) */
  maxItems?: number
  /** Concurrent batch size */
  batchSize?: number
  /** Delay between batches in ms */
  batchDelay?: number
  /** Per-page fetch timeout in ms */
  timeout?: number
}

const DEFAULT_CONFIG: Required<Omit<DetailConfig, 'sourceName'>> = {
  maxItems: 30,
  batchSize: 3,
  batchDelay: 1000,
  timeout: 10000,
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

/**
 * Enrich opportunities by fetching their source_url detail pages.
 * Extracts full description, POC email, and better amount/deadline info.
 * Falls back to original data if any individual fetch fails.
 */
export async function enrichWithDetails(
  opportunities: RawOpportunity[],
  config: DetailConfig,
): Promise<RawOpportunity[]> {
  const { maxItems, batchSize, batchDelay, timeout } = { ...DEFAULT_CONFIG, ...config }
  const toEnrich = opportunities.slice(0, maxItems)
  const skipped = opportunities.slice(maxItems)

  console.log(`[${config.sourceName}] Enriching ${toEnrich.length} items with detail pages...`)

  const enriched: RawOpportunity[] = []

  for (let i = 0; i < toEnrich.length; i += batchSize) {
    const batch = toEnrich.slice(i, i + batchSize)

    const results = await Promise.allSettled(
      batch.map(opp => fetchDetail(opp, timeout))
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        enriched.push(result.value)
      } else {
        // Should not happen since fetchDetail catches internally, but safety net
        enriched.push(batch[results.indexOf(result)])
      }
    }

    // Delay between batches (skip after last batch)
    if (i + batchSize < toEnrich.length) {
      await new Promise(resolve => setTimeout(resolve, batchDelay))
    }
  }

  console.log(`[${config.sourceName}] Enrichment complete.`)
  return [...enriched, ...skipped]
}

async function fetchDetail(
  opp: RawOpportunity,
  timeout: number,
): Promise<RawOpportunity> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    const res = await fetch(opp.source_url, {
      headers: HEADERS,
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return opp

    const html = await res.text()
    return extractDetailFromHtml(opp, html)
  } catch {
    // Timeout, network error, etc. — return original
    return opp
  }
}

function extractDetailFromHtml(opp: RawOpportunity, html: string): RawOpportunity {
  const updated = { ...opp }

  // Extract main content — try common content selectors
  const contentMatch =
    html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)

  if (contentMatch) {
    const fullText = stripTags(contentMatch[1]).trim()
    if (fullText.length > 50 && fullText !== opp.title) {
      updated.description = fullText.substring(0, 2000)
    }
  } else {
    // Fallback: extract <p> tags from body
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    const combined = paragraphs
      .map(m => stripTags(m[1]).trim())
      .filter(t => t.length > 30)
      .join(' ')
    if (combined.length > 50 && combined !== opp.title) {
      updated.description = combined.substring(0, 2000)
    }
  }

  // Extract POC email from mailto links
  if (!opp.poc_email) {
    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
    if (mailtoMatch) {
      updated.poc_email = mailtoMatch[1]
    }
  }

  return updated
}
