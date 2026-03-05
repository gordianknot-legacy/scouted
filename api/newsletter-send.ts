import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendNewsletter } from './lib/send-newsletter'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { newsletter_id, test_email } = req.body || {}

  if (!newsletter_id || typeof newsletter_id !== 'string') {
    return res.status(400).json({ error: 'newsletter_id is required' })
  }

  try {
    // If test_email is 'self', use the auth header to determine email
    // For now, test_email should be an actual email address or 'self'
    let resolvedTestEmail: string | undefined
    if (test_email === 'self') {
      // Try to extract from auth token — fallback to a known test address
      const authHeader = req.headers.authorization
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '')
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
          resolvedTestEmail = payload.email
        } catch {
          // Ignore token parse errors
        }
      }
      if (!resolvedTestEmail) {
        return res.status(400).json({ error: 'Could not determine test email. Please specify an email address.' })
      }
    } else if (test_email) {
      resolvedTestEmail = test_email
    }

    const result = await sendNewsletter(newsletter_id, resolvedTestEmail)
    return res.status(200).json({ ok: true, sent_count: result.sent_count })
  } catch (err) {
    console.error('Newsletter send error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Send failed' })
  }
}
