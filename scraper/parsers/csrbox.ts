import * as cheerio from 'cheerio'
import https from 'node:https'
import type { RawOpportunity } from '../scoring.js'
import { extractTags, extractLocation, dedup } from './utils.js'

/**
 * Parser for CSRBox — csrbox.org.
 * Scrapes the CSR Projects listing filtered for education sector.
 * Uses AJAX POST endpoint to filter server-side for education + large budgets.
 * CSRBox has broken SSL cert chain — we use rejectUnauthorized: false.
 */

const LISTING_URL = 'https://csrbox.org/India-list-CSR-projects-India'
const AJAX_URL = 'https://csrbox.org/ajaxdata.php'

// Max pages to scrape per year tab (20 items per page)
const MAX_PAGES = 3

// Recent year tabs to scrape
const YEAR_TABS = ['2023-24', '2022-23', '2021-22', 'Ongoing']

/** POST to CSRBox AJAX endpoint with SSL verification disabled */
function postInsecure(url: string, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      rejectUnauthorized: false,
      timeout: 20000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html, */*',
        'Referer': LISTING_URL,
      },
    }
    const req = https.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(body)
    req.end()
  })
}

/** GET with SSL verification disabled */
function fetchInsecure(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      rejectUnauthorized: false,
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchInsecure(res.headers.location).then(resolve, reject)
        return
      }
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

export async function parseCsrbox(_url: string): Promise<RawOpportunity[]> {
  const items: RawOpportunity[] = []

  try {
    // AJAX endpoint: education sector (sct=15) + budgets >= 1 Cr + recent years
    let ajaxWorked = false
    for (const year of YEAR_TABS) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        try {
          const body = `page=${page}&tab=${encodeURIComponent(year)}&sct[]=15&projects[]=1-5&projects[]=5-10&projects[]=10-25&projects[]=25`
          const html = await postInsecure(AJAX_URL, body)

          if (!html || html.trim().length < 50) break
          ajaxWorked = true

          const count = parseTableRows(html, items)
          console.log(`[CSRBox] ${year} page ${page}: ${count} entries (>= ₹1 Cr)`)

          if (count === 0) break
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch {
          break
        }
      }
    }

    if (!ajaxWorked) {
      console.log('[CSRBox] AJAX failed, falling back to page scrape')
      await scrapeListingPages(items)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('certificate') || message.includes('SSL') || message.includes('TLS')) {
      console.warn('[CSRBox] SSL certificate error — skipping.')
    } else {
      console.error('[CSRBox] Error:', err)
    }
  }

  console.log(`[CSRBox] Total: ${items.length} education CSR entries`)
  return dedup(items)
}

/** Fallback: scrape the regular listing page */
async function scrapeListingPages(items: RawOpportunity[]) {
  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const url = `${LISTING_URL}?page=${page}`
      const html = await fetchInsecure(url)
      const count = parseTableRows(html, items)
      console.log(`[CSRBox] Listing page ${page}: ${count} entries`)
      if (count === 0) break
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch {
      break
    }
  }
}

/** Parse table rows from CSRBox HTML — works for both AJAX response and full page */
function parseTableRows(html: string, items: RawOpportunity[]): number {
  const $ = cheerio.load(html)
  let count = 0

  $('tr.item').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 5) return

    // Column layout: [hidden ID] [Project Name + link] [Company + link] [Sector] [Budget] [Location]
    const projectLink = $(cells[1]).find('a')
    const projectTitle = projectLink.text().trim()
    const detailUrl = projectLink.attr('href') || ''

    const companyLink = $(cells[2]).find('a, input[type="submit"]')
    const companyName = companyLink.attr('value') || companyLink.text().trim()

    const sector = $(cells[3]).text().trim()
    const budget = $(cells[4]).text().trim()

    const locationCell = cells.length >= 6 ? $(cells[5]) : null
    const locationText = locationCell?.find('a')?.text()?.trim() || locationCell?.text()?.trim() || ''

    if (!projectTitle || projectTitle.length < 3) return

    const fullUrl = detailUrl.startsWith('http')
      ? detailUrl
      : `https://csrbox.org/${detailUrl.replace(/^\//, '')}`

    // Parse budget — e.g., "INR 0.08 Cr", "INR 5.30 Cr"
    const budgetMatch = budget.match(/([\d.]+)\s*Cr/i)
    const amount = budgetMatch ? `₹${budgetMatch[1]} Crore` : null

    // Skip budgets < 1 Crore (user requirement: only ₹1 Crore+ opportunities)
    if (!budgetMatch || parseFloat(budgetMatch[1]) < 1) return

    const displayTitle = companyName
      ? `${companyName} — ${projectTitle}`
      : projectTitle

    const fullText = `${displayTitle} ${sector} ${locationText}`

    items.push({
      title: displayTitle.substring(0, 300),
      source_url: fullUrl,
      description: `${sector}. Budget: ${budget}. Location: ${locationText || 'India'}.`.substring(0, 2000),
      deadline: null,
      poc_email: null,
      tags: [...extractTags(fullText), 'CSR'],
      organisation: companyName || 'CSRBox',
      amount,
      location: extractLocation(fullText) || (locationText && locationText !== 'NA' ? locationText : 'India'),
    })
    count++
  })

  return count
}
