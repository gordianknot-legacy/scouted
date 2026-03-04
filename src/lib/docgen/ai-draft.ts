import type { CsrCompanyData } from './csr-concept-generator'
import { formatINR } from '../formatters'

export interface AiDraftResult {
  educationChallenge: string[]
  csfImpact: string[]
  proposedPartnership: string[]
  investmentFramework: { item: string; amount: string }[]
  whyPartnerWithCsf: string[]
}

const SYSTEM_PROMPT = `You are a senior partnerships strategist at Central Square Foundation (CSF), India's leading education non-profit. You write concept notes for CSR partnerships with Indian corporates.

Rules:
- Use British English spelling (programme, organisation, colour)
- Use Indian numbering format (Lakh, Crore) for amounts
- Refer to CSF's focus areas: Foundational Literacy and Numeracy (FLN), School Governance, EdTech, Early Childhood Education, Classroom Instruction
- Reference NIPUN Bharat, NEP 2020, and state education reform where relevant
- Be specific about CSF's impact: 9+ state partners, 5 Crore+ students reached, ₹13,500 Crore unlocked
- Write in a professional but compelling voice suitable for C-suite / CSR heads
- Each section should have 3-5 bullet points, concise but substantive`

export async function generateAiDraft(data: CsrCompanyData): Promise<AiDraftResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY not set')

  const userPrompt = `Generate a CSR partnership concept note for:

Company: ${data.company}
CIN: ${data.cin}
Total CSR Spending (FY 2023-24): ${formatINR(data.totalSpend)}
Education CSR: ${formatINR(data.eduSpend)}
Vocational Skills CSR: ${formatINR(data.vocSpend)}
Education as % of Total: ${data.totalSpend > 0 ? Math.round((data.eduSpend / data.totalSpend) * 100) : 0}%
${data.priorAssociation ? `Prior Association with CSF: ${data.priorAssociation}` : ''}
${data.notes ? `Additional Notes: ${data.notes}` : ''}

Top Education Projects:
${data.eduProjects.slice(0, 5).map(p => `- ${p.field}: ${formatINR(p.spend)}`).join('\n')}

Return a JSON object with these keys (each value is an array of strings):
- educationChallenge: 3 bullet points about India's education challenge, contextualised to this company's CSR focus
- csfImpact: 4-5 bullet points about CSF's impact and relevance
- proposedPartnership: 4 bullet points suggesting specific partnership areas based on the company's existing CSR profile
- investmentFramework: array of {item, amount} objects (5 rows) with realistic budget suggestions
- whyPartnerWithCsf: 4-5 bullet points customised to why this specific company should partner with CSF

Return ONLY valid JSON, no markdown fences.`

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
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content || ''

  // Parse JSON from response (strip markdown fences if present)
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned) as AiDraftResult

  // Validate structure
  if (!Array.isArray(parsed.educationChallenge) || !Array.isArray(parsed.csfImpact)) {
    throw new Error('Invalid AI draft structure')
  }

  return parsed
}
