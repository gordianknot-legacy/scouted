import type { NewsletterSection, NewsletterContent } from '../../types'

const POLISH_SYSTEM = `You are a senior communications writer at Central Square Foundation (CSF), India's leading education non-profit. You polish newsletter copy for quarterly donor newsletters.

Rules:
- Use British English spelling (programme, organisation, colour, favour)
- Indian context — reference Indian states, NIPUN Bharat, NEP 2020 where relevant
- Never invent statistics, numbers, or data that wasn't in the original
- Only polish and tighten existing copy — do not add new content from scratch
- Keep the same meaning and facts; improve clarity, flow, and tone
- Professional but warm voice suitable for high-net-worth donors and CSR heads
- Keep bullet points concise (1-2 lines each)
- Return ONLY valid JSON, no markdown fences`

const SUBJECT_SYSTEM = `You are a senior communications writer at Central Square Foundation. Generate email subject lines for quarterly donor newsletters.

Rules:
- British English
- Professional but engaging
- Under 60 characters
- Reference the quarter/period if mentioned in the content
- Return ONLY a JSON array of 3-5 subject line strings, no markdown fences`

const STRUCTURE_SYSTEM = `You are a senior communications writer at Central Square Foundation. You take raw free-text newsletter content and structure it into sections for a branded email template.

Available section types:
- ceo_message: CEO/leadership message (title + body text)
- section_header: Bold yellow section divider (title only)
- impact_story: Story with optional image (title + body, use bullet points)
- stats: Grid of stat cards (title + stats array of {label, value})
- events: Date-based list (title + events array of {date, description})
- cta: Call to action button (body text + ctaLabel + ctaUrl)
- custom: Generic text section (title + body)

Rules:
- British English
- Identify natural section boundaries in the text
- Use section_header to introduce topic changes
- Extract numbers/metrics into stats sections where appropriate
- Preserve all original information — restructure but don't remove content
- Return ONLY valid JSON matching this shape: { quarterLabel: string, sections: Array<{ id: string, type: string, title: string, body: string, image: null, stats?: Array<{label: string, value: string}>, events?: Array<{date: string, description: string}>, ctaLabel?: string, ctaUrl?: string }> }
- Generate unique UUIDs for each section id`

async function callOpenRouter(systemPrompt: string, userPrompt: string, temperature = 0.5): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY not set')

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
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 3000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content || ''
  return content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
}

export async function polishSection(section: NewsletterSection): Promise<{ title: string; body: string }> {
  const prompt = `Polish this newsletter section:

Type: ${section.type}
Title: ${section.title}
Body:
${section.body}

Return JSON: { "title": "polished title", "body": "polished body text" }`

  const raw = await callOpenRouter(POLISH_SYSTEM, prompt, 0.5)
  const parsed = JSON.parse(raw)

  if (!parsed.title && !parsed.body) throw new Error('Invalid polish result')
  return { title: parsed.title || section.title, body: parsed.body || section.body }
}

export async function suggestSubjectLines(content: NewsletterContent): Promise<string[]> {
  const sectionSummary = content.sections
    .filter(s => s.title || s.body)
    .map(s => `${s.type}: ${s.title}${s.body ? ' — ' + s.body.substring(0, 100) : ''}`)
    .join('\n')

  const prompt = `Suggest email subject lines for this newsletter:

Quarter: ${content.quarterLabel || 'Not specified'}
Sections:
${sectionSummary}

Return a JSON array of 3-5 subject line strings.`

  const raw = await callOpenRouter(SUBJECT_SYSTEM, prompt, 0.8)
  const parsed = JSON.parse(raw)

  if (!Array.isArray(parsed)) throw new Error('Invalid subject lines result')
  return parsed
}

export async function structureFromFreeText(rawText: string): Promise<NewsletterContent> {
  const prompt = `Structure this newsletter text into sections:

${rawText}

Return the structured JSON.`

  const raw = await callOpenRouter(STRUCTURE_SYSTEM, prompt, 0.5)
  const parsed = JSON.parse(raw)

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid structured result')
  }

  // Ensure all sections have required fields
  parsed.sections = parsed.sections.map((s: Record<string, unknown>) => ({
    id: (s.id as string) || crypto.randomUUID(),
    type: s.type || 'custom',
    title: s.title || '',
    body: s.body || '',
    image: null,
    ...(s.stats ? { stats: s.stats } : {}),
    ...(s.events ? { events: s.events } : {}),
    ...(s.ctaLabel ? { ctaLabel: s.ctaLabel } : {}),
    ...(s.ctaUrl ? { ctaUrl: s.ctaUrl } : {}),
  }))

  return {
    quarterLabel: (parsed.quarterLabel as string) || '',
    heroImage: null,
    sections: parsed.sections,
  }
}
