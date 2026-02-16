import type { DbOpportunity } from './supabase.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const BATCH_SIZE = 10
const DELAY_MS = 3000
const MAX_RETRIES = 2

// Ordered by preference: best free model first, smaller/alternate fallbacks after
const MODELS = [
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-4b-it:free',
]

const SYSTEM_PROMPT = `You are a classifier for Central Square Foundation (CSF), an Indian education non-profit focused on K-12 school education.

For each item, reply ONLY with a JSON array of booleans — true if RELEVANT, false if NOT RELEVANT. Example: [true, false, true]

RELEVANT (CSF's focus areas):
- K-12 school education in India (primary, secondary, upper secondary)
- Foundational Literacy and Numeracy (FLN), ECCE / Anganwadi education
- Teacher training and professional development for school teachers
- EdTech for school-age children
- School governance, school leadership
- Education policy (NEP 2020, Samagra Shiksha, Right to Education)
- CSR / philanthropic funding specifically for school education in India
- Grants, RFPs, or funding opportunities for education NGOs working in India

NOT RELEVANT (reject these):
- Higher education only (universities, colleges, postgraduate) with no K-12 component
- Healthcare, nutrition, sanitation, WASH (unless part of a school programme)
- Women empowerment, gender programmes (unless specifically about girls' school education)
- Agriculture, environment, climate change
- Livelihood, microfinance, vocational training for adults, self-help groups
- International programmes with no India connection
- Corporate training, workforce development, adult skills
- Sports, arts, culture (unless school curriculum related)`

function formatItem(opp: DbOpportunity, index: number): string {
  const desc = opp.description.slice(0, 200).replace(/\n/g, ' ')
  const org = opp.organisation || 'Unknown'
  const tags = opp.tags.length > 0 ? opp.tags.join(', ') : 'None'
  return `Item ${index + 1}: "${opp.title}" | Org: ${org} | Desc: ${desc} | Tags: ${tags}`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Sentinel: when the daily free-model quota is exhausted, stop all further calls
let dailyQuotaExhausted = false

type CallResult =
  | { ok: true; values: boolean[] }
  | { ok: false; retryable: boolean }

async function callOpenRouter(
  items: string[],
  model: string,
  apiKey: string,
): Promise<CallResult> {
  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: items.join('\n') },
    ],
    temperature: 0,
    max_tokens: 256,
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://scouted.csf.org.in',
      'X-Title': 'ScoutEd Scraper',
    },
    body: JSON.stringify(body),
  })

  if (res.status === 429) {
    const errBody = await res.text().catch(() => '{}')
    // Detect daily quota exhaustion — no point retrying until midnight UTC
    if (errBody.includes('free-models-per-day')) {
      console.warn(`[LLM Filter] Daily free-model quota exhausted. Skipping remaining batches.`)
      dailyQuotaExhausted = true
      return { ok: false, retryable: false }
    }
    // Upstream provider rate limit — retryable with backoff
    console.warn(`[LLM Filter] ${model} rate-limited upstream, will retry`)
    return { ok: false, retryable: true }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown')
    console.warn(`[LLM Filter] ${model} returned ${res.status}: ${text.slice(0, 200)}`)
    return { ok: false, retryable: false }
  }

  const json = await res.json() as {
    choices?: { message?: { content?: string } }[]
    error?: { message?: string; code?: number }
  }

  if (json.error) {
    console.warn(`[LLM Filter] ${model} API error: ${json.error.message || JSON.stringify(json.error)}`)
    return { ok: false, retryable: false }
  }

  const content = json.choices?.[0]?.message?.content?.trim()
  if (!content) {
    console.warn(`[LLM Filter] Empty response from ${model}:`, JSON.stringify(json).slice(0, 300))
    return { ok: false, retryable: false }
  }

  // Extract JSON array from response (model may wrap in markdown code blocks)
  const match = content.match(/\[[\s\S]*?\]/)
  if (!match) {
    console.warn(`[LLM Filter] Could not parse array from: ${content.slice(0, 100)}`)
    return { ok: false, retryable: false }
  }

  try {
    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed) || parsed.length !== items.length) {
      console.warn(`[LLM Filter] Array length mismatch: got ${parsed.length}, expected ${items.length}`)
      return { ok: false, retryable: false }
    }
    return { ok: true, values: parsed.map(v => Boolean(v)) }
  } catch {
    console.warn(`[LLM Filter] JSON parse failed: ${match[0].slice(0, 100)}`)
    return { ok: false, retryable: false }
  }
}

async function classifyBatch(
  batch: DbOpportunity[],
  apiKey: string,
): Promise<boolean[]> {
  const formatted = batch.map((opp, i) => formatItem(opp, i))

  // Try each model in order, with retries for retryable errors
  for (const model of MODELS) {
    if (dailyQuotaExhausted) break

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = DELAY_MS * Math.pow(2, attempt)
        console.log(`[LLM Filter] Retry ${model} (attempt ${attempt + 1}/${MAX_RETRIES}) after ${backoff}ms...`)
        await sleep(backoff)
      }

      const result = await callOpenRouter(formatted, model, apiKey)

      if (result.ok) return result.values

      if (dailyQuotaExhausted) break
      if (!result.retryable) break // skip to next model
    }
  }

  // Fail open — accept all items in this batch
  console.warn(`[LLM Filter] All models failed for batch, accepting all ${batch.length} items`)
  return batch.map(() => true)
}

export async function classifyWithLlm(items: DbOpportunity[]): Promise<DbOpportunity[]> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.log('[LLM Filter] Skipping — OPENROUTER_API_KEY not set')
    return items
  }

  if (items.length === 0) return items

  console.log(`\n[LLM Filter] Classifying ${items.length} items (batch size: ${BATCH_SIZE})...`)

  const accepted: DbOpportunity[] = []
  const batches = Math.ceil(items.length / BATCH_SIZE)

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const batch = items.slice(i, i + BATCH_SIZE)

    // If daily quota is gone, accept remaining items without calling API
    if (dailyQuotaExhausted) {
      console.log(`[LLM Filter] Batch ${batchNum}/${batches} — skipped (quota exhausted), accepting ${batch.length} items`)
      accepted.push(...batch)
      continue
    }

    console.log(`[LLM Filter] Batch ${batchNum}/${batches} (${batch.length} items)...`)
    const results = await classifyBatch(batch, apiKey)

    for (let j = 0; j < batch.length; j++) {
      if (results[j]) {
        accepted.push(batch[j])
      } else {
        console.log(`[LLM Filter] Rejected: "${batch[j].title}"`)
      }
    }

    // Rate limit delay between batches (skip after last batch)
    if (i + BATCH_SIZE < items.length) {
      await sleep(DELAY_MS)
    }
  }

  console.log(`[LLM Filter] Result: ${accepted.length}/${items.length} items accepted`)
  return accepted
}
