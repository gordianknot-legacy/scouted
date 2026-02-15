import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function buildConfirmationHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed — ScoutEd</title>
</head>
<body style="margin:0; padding:0; background:#f4f6f9; font-family:'Gill Sans MT','Gill Sans',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f9; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#00316B; padding:24px 32px;">
              <span style="display:inline-block; background:#FFD400; color:#00316B; font-size:13px; font-weight:bold; padding:4px 10px; border-radius:8px; margin-right:8px;">SE</span>
              <span style="font-size:20px; font-weight:bold; color:#ffffff;">
                Scout<span style="color:#FFD400;">Ed</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px; text-align:center;">
              <div style="display:inline-block; width:56px; height:56px; background:#f0fdf4; border-radius:16px; line-height:56px; text-align:center; margin-bottom:20px;">
                <span style="font-size:28px;">&#10003;</span>
              </div>
              <h1 style="margin:0 0 12px; font-size:22px; color:#1a1a1a;">Unsubscribed Successfully</h1>
              <p style="margin:0 0 24px; font-family:Cambria,Georgia,serif; font-size:15px; color:#666; line-height:1.7;">
                You've been removed from the ScoutEd daily digest. You won't receive any more emails from us.
              </p>
              <a href="https://scouted.whybe.ai" style="display:inline-block; background:#FFD400; color:#00316B; font-size:14px; font-weight:bold; padding:12px 28px; border-radius:10px; text-decoration:none;">
                Visit ScoutEd &rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; background:#fafafa; border-top:2px solid #FFD400; text-align:center;">
              <p style="margin:0; font-family:Cambria,Georgia,serif; font-size:12px; color:#aaa;">
                ScoutEd &mdash; CSF Partnerships &amp; Strategic Initiatives
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildErrorHtml(message: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error — ScoutEd</title>
</head>
<body style="margin:0; padding:0; background:#f4f6f9; font-family:'Gill Sans MT','Gill Sans',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f9; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#00316B; padding:24px 32px;">
              <span style="display:inline-block; background:#FFD400; color:#00316B; font-size:13px; font-weight:bold; padding:4px 10px; border-radius:8px; margin-right:8px;">SE</span>
              <span style="font-size:20px; font-weight:bold; color:#ffffff;">
                Scout<span style="color:#FFD400;">Ed</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px; text-align:center;">
              <h1 style="margin:0 0 12px; font-size:22px; color:#1a1a1a;">Something Went Wrong</h1>
              <p style="margin:0 0 24px; font-family:Cambria,Georgia,serif; font-size:15px; color:#666; line-height:1.7;">
                ${message}
              </p>
              <a href="https://scouted.whybe.ai" style="display:inline-block; background:#00316B; color:#fff; font-size:14px; font-weight:bold; padding:12px 28px; border-radius:10px; text-decoration:none;">
                Go to ScoutEd &rarr;
              </a>
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token } = req.query
  if (!token || typeof token !== 'string') {
    res.setHeader('Content-Type', 'text/html')
    return res.status(400).send(buildErrorHtml('Invalid or missing unsubscribe token.'))
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.setHeader('Content-Type', 'text/html')
    return res.status(500).send(buildErrorHtml('Server configuration error. Please try again later.'))
  }

  // Delete subscriber by unsubscribe_token using service_role
  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/subscribers?unsubscribe_token=eq.${token}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal',
    },
  })

  if (!deleteRes.ok) {
    const body = await deleteRes.text()
    console.error('Supabase delete error:', deleteRes.status, body)
    res.setHeader('Content-Type', 'text/html')
    return res.status(500).send(buildErrorHtml('Could not process your unsubscribe request. Please try again.'))
  }

  res.setHeader('Content-Type', 'text/html')
  return res.status(200).send(buildConfirmationHtml())
}
