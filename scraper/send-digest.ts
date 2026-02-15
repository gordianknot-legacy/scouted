import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!resendApiKey) {
  console.error('Missing RESEND_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Opportunity {
  title: string
  source_url: string
  description: string
  relevance_score: number
  deadline: string | null
  tags: string[]
  organisation: string | null
  amount: string | null
  location: string | null
}

function buildEmailHtml(opportunities: Opportunity[], date: string): string {
  const rows = opportunities.map(opp => {
    const scoreColour = opp.relevance_score >= 75 ? '#22c55e' : opp.relevance_score >= 50 ? '#FFD400' : '#ef4444'
    const deadline = opp.deadline
      ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'No deadline'
    const tags = opp.tags.slice(0, 3).join(' · ')

    return `
    <tr>
      <td style="padding: 20px 24px; border-bottom: 1px solid #f0f0f0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="display:inline-block; background:${scoreColour}; color:#fff; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:12px; font-weight:bold; padding:3px 8px; border-radius:12px; margin-bottom:6px;">
                Score: ${opp.relevance_score}
              </span>
              ${opp.amount ? `<span style="display:inline-block; background:#FFF3CD; color:#856404; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:12px; padding:3px 8px; border-radius:12px; margin-left:4px;">${opp.amount}</span>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px;">
              <a href="${opp.source_url}" style="font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:16px; font-weight:bold; color:#00316B; text-decoration:none;">
                ${opp.title}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:4px; font-family:Cambria,Georgia,serif; font-size:14px; color:#666; line-height:1.5;">
              ${opp.description.substring(0, 200)}${opp.description.length > 200 ? '...' : ''}
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:12px; color:#999;">
              ${opp.organisation || ''} · ${opp.location || 'India'} · ${deadline} · ${tags}
            </td>
          </tr>
          <tr>
            <td style="padding-top:10px;">
              <a href="${opp.source_url}" style="display:inline-block; background:#FFD400; color:#00316B; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:13px; font-weight:bold; padding:8px 16px; border-radius:6px; text-decoration:none;">
                View Opportunity →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#00316B; padding:24px; border-radius:12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block; background:#FFD400; color:#00316B; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:14px; font-weight:bold; padding:4px 10px; border-radius:6px; margin-right:8px;">SE</span>
                    <span style="font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:22px; font-weight:bold; color:#fff;">
                      Scout<span style="color:#FFD400;">Ed</span> Daily Digest
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:6px; font-family:Cambria,Georgia,serif; font-size:14px; color:rgba(255,255,255,0.7);">
                    ${date} · Top ${opportunities.length} opportunities
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Opportunities -->
          <tr>
            <td style="background:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${rows}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9; padding:20px 24px; border-radius:0 0 12px 12px; border-top:2px solid #FFD400;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://scouted.whybe.ai" style="display:inline-block; background:#00316B; color:#fff; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:14px; font-weight:bold; padding:10px 24px; border-radius:8px; text-decoration:none;">
                      View All on ScoutEd →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:16px; font-family:Cambria,Georgia,serif; font-size:12px; color:#999;">
                    ScoutEd — CSF Partnerships &amp; Strategic Initiatives<br>
                    Opportunities are scored by relevance to CSF's mission in Indian education.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function main() {
  console.log('=== ScoutEd Daily Digest ===')

  // Fetch top opportunities from last 48 hours
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { data: opportunities, error: oppError } = await supabase
    .from('opportunities')
    .select('*')
    .gte('created_at', since)
    .order('relevance_score', { ascending: false })
    .limit(10)

  if (oppError) {
    console.error('Failed to fetch opportunities:', oppError.message)
    process.exit(1)
  }

  if (!opportunities || opportunities.length === 0) {
    console.log('No new opportunities in the last 48 hours. Skipping digest.')
    return
  }

  // Fetch subscribers
  const { data: subscribers, error: subError } = await supabase
    .from('subscribers')
    .select('email')

  if (subError) {
    console.error('Failed to fetch subscribers:', subError.message)
    process.exit(1)
  }

  if (!subscribers || subscribers.length === 0) {
    console.log('No subscribers. Skipping digest.')
    return
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const html = buildEmailHtml(opportunities as Opportunity[], today)
  const emails = subscribers.map(s => s.email)

  console.log(`Sending digest with ${opportunities.length} opportunities to ${emails.length} subscribers`)

  // Use sandbox sender unless domain is verified in Resend
  const fromAddress = process.env.RESEND_DOMAIN_VERIFIED === 'true'
    ? 'ScoutEd <digest@scouted.whybe.ai>'
    : 'ScoutEd <onboarding@resend.dev>'

  // Send via Resend (batch)
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      emails.map(email => ({
        from: fromAddress,
        to: email,
        subject: `ScoutEd Digest — ${today}`,
        html,
      }))
    ),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`Resend API error (${res.status}):`, body)
    process.exit(1)
  }

  const result = await res.json()
  console.log('Digest sent successfully:', result)
}

main().catch(err => {
  console.error('Digest failed:', err)
  process.exit(1)
})
