const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY

interface Donor {
  id: string
  email: string
  name: string
  unsubscribe_token: string
}

interface Newsletter {
  id: string
  subject: string
  html_rendered: string
}

async function supabaseGet(path: string): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
}

async function supabasePatch(table: string, id: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  })
}

function personaliseHtml(html: string, donor: Donor): string {
  const unsubUrl = `https://scouted.whybe.ai/api/donor-unsubscribe?token=${donor.unsubscribe_token}`
  return html.replace(/{{unsubscribe_url}}/g, unsubUrl)
    // Also handle template-generated unsubscribe links
    .replace(/>Unsubscribe<\/a>/g, ` href="${unsubUrl}">Unsubscribe</a>`)
}

export async function sendNewsletter(
  newsletterId: string,
  testEmail?: string
): Promise<{ sent_count: number }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Server configuration error')
  }
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  // Fetch newsletter
  const nlRes = await supabaseGet(`newsletters?id=eq.${newsletterId}&select=id,subject,html_rendered`)
  if (!nlRes.ok) throw new Error('Failed to fetch newsletter')
  const newsletters = await nlRes.json()
  if (!newsletters.length) throw new Error('Newsletter not found')
  const nl = newsletters[0] as Newsletter

  if (!nl.html_rendered) throw new Error('Newsletter has no rendered HTML')
  if (!nl.subject) throw new Error('Newsletter has no subject line')

  // Test mode: send to single email
  if (testEmail) {
    const fromAddress = process.env.RESEND_DOMAIN_VERIFIED === 'true'
      ? 'ScoutEd <newsletter@scouted.whybe.ai>'
      : 'ScoutEd <onboarding@resend.dev>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: testEmail,
        subject: `[TEST] ${nl.subject}`,
        html: nl.html_rendered,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend error: ${body}`)
    }

    return { sent_count: 1 }
  }

  // Production: send to all active donors
  const donorRes = await supabaseGet('donors?is_active=eq.true&select=id,email,name,unsubscribe_token')
  if (!donorRes.ok) throw new Error('Failed to fetch donors')
  const donors = (await donorRes.json()) as Donor[]

  if (donors.length === 0) throw new Error('No active donors')

  const fromAddress = process.env.RESEND_DOMAIN_VERIFIED === 'true'
    ? 'ScoutEd <newsletter@scouted.whybe.ai>'
    : 'ScoutEd <onboarding@resend.dev>'

  const emailPayloads = donors.map(donor => ({
    from: fromAddress,
    to: donor.email,
    subject: nl.subject,
    html: personaliseHtml(nl.html_rendered, donor),
  }))

  // Resend batch API (max 100 per call)
  const batches = []
  for (let i = 0; i < emailPayloads.length; i += 100) {
    batches.push(emailPayloads.slice(i, i + 100))
  }

  let totalSent = 0
  for (const batch of batches) {
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`Resend batch error: ${body}`)
      // Update newsletter status to failed
      await supabasePatch('newsletters', newsletterId, {
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      throw new Error(`Failed to send batch: ${body}`)
    }

    totalSent += batch.length
  }

  // Update newsletter status
  await supabasePatch('newsletters', newsletterId, {
    status: 'sent',
    sent_at: new Date().toISOString(),
    sent_count: totalSent,
    updated_at: new Date().toISOString(),
  })

  return { sent_count: totalSent }
}
