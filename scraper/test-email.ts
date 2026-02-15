/**
 * Test script: sends a single test digest email to verify Resend is working.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxxx TEST_EMAIL=you@example.com npx tsx test-email.ts
 *
 * This does NOT need Supabase — it uses hardcoded sample data.
 */

const resendApiKey = process.env.RESEND_API_KEY
const testEmail = process.env.TEST_EMAIL

if (!resendApiKey) {
  console.error('Missing RESEND_API_KEY. Set it as an environment variable.')
  process.exit(1)
}
if (!testEmail) {
  console.error('Missing TEST_EMAIL. Set it as an environment variable.')
  process.exit(1)
}

const sampleOpportunities = [
  {
    title: 'Michael & Susan Dell Foundation — Quality Schools Programme India',
    source_url: 'https://www.dell.org/apply/',
    description:
      'Accepts proposals for education projects in India focused on providing high-quality educational experiences to students from low-income backgrounds. Average grant size approximately \u20B95 Crore ($600,000). Rolling applications year-round.',
    relevance_score: 70,
    deadline: null,
    tags: ['Education', 'School Governance', 'EdTech'],
    organisation: 'Dell Foundation',
    amount: '~\u20B95 Crore (avg)',
    location: 'India',
  },
  {
    title: 'HCLTech Grant — Education Category (Edition XII)',
    source_url: 'https://www.hclfoundation.org/hcltech-grant',
    description:
      'Annual grant programme for NGOs. The winning NGO in the Education category receives \u20B95 Crore for a comprehensive four-year project. Eight runners-up receive \u20B950 Lakh each.',
    relevance_score: 60,
    deadline: '2026-06-30',
    tags: ['Education', 'Classroom Instruction', 'Teacher Training'],
    organisation: 'HCL Foundation',
    amount: '\u20B95 Crore (winner)',
    location: 'India',
  },
  {
    title: 'ACT For Education — EdTech Fund for Bharat',
    source_url: 'https://actgrants.in/act-for-education/',
    description:
      'A \u20B9100 Crore fund to seed capabilities of education-centric organisations, accelerating their impact through technology.',
    relevance_score: 60,
    deadline: null,
    tags: ['EdTech', 'Foundational Literacy'],
    organisation: 'ACT Grants',
    amount: '\u20B9100 Crore (fund)',
    location: 'India',
  },
]

function buildEmailHtml(opportunities: typeof sampleOpportunities, date: string): string {
  const rows = opportunities.map(opp => {
    const scoreColour = opp.relevance_score >= 75 ? '#22c55e' : opp.relevance_score >= 50 ? '#FFD400' : '#ef4444'
    const deadline = opp.deadline
      ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Rolling'
    const tags = opp.tags.slice(0, 3).join(' \u00B7 ')

    return `
    <tr>
      <td style="padding: 20px 24px; border-bottom: 1px solid #f0f0f0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="display:inline-block; background:${scoreColour}; color:#fff; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:12px; font-weight:bold; padding:3px 8px; border-radius:12px;">
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
              ${opp.organisation || ''} \u00B7 ${opp.location || 'India'} \u00B7 ${deadline} \u00B7 ${tags}
            </td>
          </tr>
          <tr>
            <td style="padding-top:10px;">
              <a href="${opp.source_url}" style="display:inline-block; background:#FFD400; color:#00316B; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:13px; font-weight:bold; padding:8px 16px; border-radius:6px; text-decoration:none;">
                View Opportunity \u2192
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
                    ${date} \u00B7 Top ${opportunities.length} opportunities \u00B7 TEST EMAIL
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
                      View All on ScoutEd \u2192
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:16px; font-family:Cambria,Georgia,serif; font-size:12px; color:#999;">
                    ScoutEd \u2014 CSF Partnerships &amp; Strategic Initiatives<br>
                    This is a TEST email. Opportunities shown are sample data.
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
  console.log('=== ScoutEd Test Email ===')
  console.log(`Sending test digest to: ${testEmail}`)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const html = buildEmailHtml(sampleOpportunities, today)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ScoutEd <onboarding@resend.dev>',
      to: testEmail,
      subject: `[TEST] ScoutEd Digest \u2014 ${today}`,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`Resend API error (${res.status}):`, body)
    process.exit(1)
  }

  const result = await res.json()
  console.log('Test email sent successfully!')
  console.log('Response:', JSON.stringify(result, null, 2))
  console.log(`\nCheck ${testEmail} inbox (also check spam).`)
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
