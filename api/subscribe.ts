import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY

function buildConfirmationEmail(email: string): string {
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f4f6f9;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f9; padding:32px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#00316B; padding:28px 32px; border-radius:16px 16px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block; background:#FFD400; color:#00316B; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:13px; font-weight:bold; padding:4px 10px; border-radius:8px; margin-right:8px;">SE</span>
                    <span style="font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:20px; font-weight:bold; color:#ffffff;">
                      Scout<span style="color:#FFD400;">Ed</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff; padding:36px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Checkmark icon -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="display:inline-block; width:56px; height:56px; background:#f0fdf4; border-radius:16px; line-height:56px; text-align:center;">
                      <span style="font-size:28px; line-height:56px;">&#10003;</span>
                    </div>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <h1 style="margin:0; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:22px; font-weight:bold; color:#1a1a1a;">
                      You're Subscribed!
                    </h1>
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0; font-family:Cambria,Georgia,serif; font-size:15px; color:#666; line-height:1.7; text-align:center;">
                      Welcome to the ScoutEd daily digest. You'll receive the top-scored funding and grant opportunities relevant to CSF's mission in Indian education, delivered straight to your inbox.
                    </p>
                  </td>
                </tr>

                <!-- Details card -->
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fb; border-radius:12px; border:1px solid #e8ecf0;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom:12px;">
                                <span style="font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:11px; color:#8896a6; text-transform:uppercase; letter-spacing:1px;">Subscription Details</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;">
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:12px; color:#8896a6; width:80px; vertical-align:top; padding:2px 0;">Email</td>
                                    <td style="font-family:Cambria,Georgia,serif; font-size:14px; color:#1a1a1a; padding:2px 0;">${email}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;">
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:12px; color:#8896a6; width:80px; vertical-align:top; padding:2px 0;">Delivery</td>
                                    <td style="font-family:Cambria,Georgia,serif; font-size:14px; color:#1a1a1a; padding:2px 0;">Daily at 8:30 AM IST</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:12px; color:#8896a6; width:80px; vertical-align:top; padding:2px 0;">Since</td>
                                    <td style="font-family:Cambria,Georgia,serif; font-size:14px; color:#1a1a1a; padding:2px 0;">${date}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- What to expect -->
                <tr>
                  <td style="padding-top:28px; padding-bottom:4px;">
                    <h2 style="margin:0; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:14px; font-weight:bold; color:#00316B;">What You'll Receive</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 0; font-family:Cambria,Georgia,serif; font-size:14px; color:#555; line-height:1.5;">
                          <span style="display:inline-block; width:6px; height:6px; background:#FFD400; border-radius:50%; margin-right:10px; vertical-align:middle;"></span>
                          Top-scored opportunities from the last 24 hours
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; font-family:Cambria,Georgia,serif; font-size:14px; color:#555; line-height:1.5;">
                          <span style="display:inline-block; width:6px; height:6px; background:#FFD400; border-radius:50%; margin-right:10px; vertical-align:middle;"></span>
                          Direct links to grant applications and RFPs
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; font-family:Cambria,Georgia,serif; font-size:14px; color:#555; line-height:1.5;">
                          <span style="display:inline-block; width:6px; height:6px; background:#FFD400; border-radius:50%; margin-right:10px; vertical-align:middle;"></span>
                          Relevance scores based on sector, geography, and funding
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; font-family:Cambria,Georgia,serif; font-size:14px; color:#555; line-height:1.5;">
                          <span style="display:inline-block; width:6px; height:6px; background:#FFD400; border-radius:50%; margin-right:10px; vertical-align:middle;"></span>
                          Deadline alerts so you never miss a window
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding-top:28px;">
                    <a href="https://scouted.whybe.ai" style="display:inline-block; background:#FFD400; color:#00316B; font-family:'Gill Sans MT','Gill Sans',sans-serif; font-size:14px; font-weight:bold; padding:12px 28px; border-radius:10px; text-decoration:none;">
                      Explore ScoutEd Now &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; border-radius:0 0 16px 16px; border-top:2px solid #FFD400; background:#fafafa;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family:Cambria,Georgia,serif; font-size:12px; color:#aaa; line-height:1.6;">
                    ScoutEd &mdash; CSF Partnerships &amp; Strategic Initiatives<br>
                    Scouting grant opportunities for Indian education, daily.
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body || {}
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' })
  }

  const cleanEmail = email.trim().toLowerCase()

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // Upsert subscriber into Supabase (on_conflict=email for dedup)
  const supabaseRes = await fetch(
    `${SUPABASE_URL}/rest/v1/subscribers?on_conflict=email`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ email: cleanEmail }),
  })

  // 201 = new subscriber, 200/409 = already exists (both OK)
  if (!supabaseRes.ok && supabaseRes.status !== 409) {
    const body = await supabaseRes.text()
    console.error('Supabase error:', supabaseRes.status, body)
    return res.status(500).json({ error: 'Failed to save subscription' })
  }

  // Send confirmation email via Resend
  if (RESEND_API_KEY) {
    try {
      const html = buildConfirmationEmail(cleanEmail)
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Use verified domain when available, otherwise sandbox
      from: process.env.RESEND_DOMAIN_VERIFIED === 'true'
        ? 'ScoutEd <digest@scouted.whybe.ai>'
        : 'ScoutEd <onboarding@resend.dev>',
          to: cleanEmail,
          subject: "Welcome to ScoutEd \u2014 You're Subscribed!",
          html,
        }),
      })

      if (!emailRes.ok) {
        const body = await emailRes.text()
        console.error('Resend error:', body)
        // Don't fail the subscription if email fails
      }
    } catch (err) {
      console.error('Email send error:', err)
    }
  }

  return res.status(200).json({ ok: true })
}
