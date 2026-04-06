import type { NlFilter } from './nl-query-parser'

const SYSTEM_PROMPT = `You are a structured filter generator for a CSR (Corporate Social Responsibility) spending database. Given a natural language query about Indian companies' CSR spending data, return a JSON object with filter fields.

Available filter fields (all optional — only include fields relevant to the query):
- companySearch (string): substring match on company name
- minEduSpend / maxEduSpend (number): education spend range in INR (1 Crore = 10000000, 1 Lakh = 100000)
- minVocSpend / maxVocSpend (number): vocational skills spend range in INR
- minTotalSpend / maxTotalSpend (number): total CSR spend range in INR
- minEduPct / maxEduPct (number): education as fraction of total (0.0 to 1.0)
- shortlistedOnly (boolean): only starred/shortlisted companies
- notShortlisted (boolean): exclude shortlisted
- inPipeline (boolean): companies added to pipeline
- notInPipeline (boolean): companies not in pipeline
- pipelineStage (string): one of: prospect, researching, outreach, proposal_sent, responded, won, lost, paused
- hasCsrHeadEmail (boolean): has CSR head email address
- hasVerifiedEmail (boolean): email is verified
- hasCeo (boolean): has CEO information
- hasLinkedin (boolean): has LinkedIn profile for CEO or CSR head
- hasReport (boolean): has annual/CSR report link
- hasFundedNgos (boolean): has funded education NGO partners
- ngoSearch (string): substring match on funded NGO partner name (e.g. "Pratham", "Educate Girls")
- hasEduSpend (boolean): has non-zero education spend
- hasVocSpend (boolean): has non-zero vocational spend
- topN (number): limit results to top N
- sortBy (string): one of: eduSpend, vocSpend, totalSpend, eduPct, company
- sortDir (string): asc or desc
- countOnly (boolean): user just wants a count, not the full list

Return ONLY valid JSON, no markdown fences, no explanation.`

/**
 * Falls back to OpenRouter LLM to parse a query the rule-based parser couldn't handle.
 * Returns null if the API key is missing or the call fails.
 */
export async function parseWithLlm(query: string): Promise<NlFilter | null> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    })

    if (!response.ok) return null

    const json = await response.json()
    const content = json.choices?.[0]?.message?.content || ''
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned) as NlFilter

    // Sanity check — must be an object with at least one known key
    const validKeys = new Set([
      'companySearch', 'minEduSpend', 'maxEduSpend', 'minVocSpend', 'maxVocSpend',
      'minTotalSpend', 'maxTotalSpend', 'minEduPct', 'maxEduPct', 'shortlistedOnly',
      'notShortlisted', 'inPipeline', 'notInPipeline', 'pipelineStage',
      'hasCsrHeadEmail', 'hasVerifiedEmail', 'hasCeo', 'hasLinkedin', 'hasReport',
      'hasFundedNgos', 'ngoSearch', 'hasEduSpend', 'hasVocSpend', 'topN', 'sortBy', 'sortDir', 'countOnly',
    ])
    const keys = Object.keys(parsed)
    if (keys.length === 0 || !keys.some(k => validKeys.has(k))) return null

    // Strip unknown keys
    for (const k of keys) {
      if (!validKeys.has(k)) delete (parsed as Record<string, unknown>)[k]
    }

    return parsed
  } catch {
    return null
  }
}
