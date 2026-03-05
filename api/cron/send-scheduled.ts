import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendNewsletter } from '../lib/send-newsletter'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = req.headers.authorization
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    // Find scheduled newsletters that are due
    const now = new Date().toISOString()
    const queryRes = await fetch(
      `${SUPABASE_URL}/rest/v1/newsletters?status=eq.scheduled&scheduled_at=lte.${now}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )

    if (!queryRes.ok) {
      throw new Error(`Failed to query newsletters: ${queryRes.status}`)
    }

    const newsletters = await queryRes.json() as { id: string }[]

    if (newsletters.length === 0) {
      return res.status(200).json({ ok: true, message: 'No scheduled newsletters due' })
    }

    const results: { id: string; sent_count?: number; error?: string }[] = []

    for (const nl of newsletters) {
      try {
        const result = await sendNewsletter(nl.id)
        results.push({ id: nl.id, sent_count: result.sent_count })
      } catch (err) {
        console.error(`Failed to send newsletter ${nl.id}:`, err)
        results.push({ id: nl.id, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    return res.status(200).json({ ok: true, results })
  } catch (err) {
    console.error('Cron error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Cron failed' })
  }
}
