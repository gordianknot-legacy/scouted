import type { NewsletterContent, NewsletterSection } from '../../types'

interface TemplateOptions {
  unsubscribeUrl?: string
}

const BLUE = '#00316B'
const YELLOW = '#FFD400'
const HEADING_FONT = "'Gill Sans MT','Gill Sans',sans-serif"
const BODY_FONT = 'Cambria,Georgia,serif'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nl2br(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>')
}

function renderBulletList(text: string): string {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length <= 1) return `<p style="margin:0; font-family:${BODY_FONT}; font-size:15px; color:#444; line-height:1.7;">${nl2br(text)}</p>`

  return lines.map(line => {
    const cleaned = line.replace(/^[\-\*•]\s*/, '')
    return `<tr><td style="padding:5px 0; font-family:${BODY_FONT}; font-size:15px; color:#444; line-height:1.6;">
      <span style="display:inline-block; width:6px; height:6px; background:${YELLOW}; border-radius:50%; margin-right:10px; vertical-align:middle;"></span>
      ${escapeHtml(cleaned)}
    </td></tr>`
  }).join('')
}

function renderSection(section: NewsletterSection): string {
  switch (section.type) {
    case 'ceo_message':
      return `
        <tr><td style="padding:32px 32px 0;">
          ${section.image ? `
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
              <tr>
                <td>
                  <img src="${escapeHtml(section.image)}" alt="" width="80" height="80" style="width:80px; height:80px; border-radius:50%; object-fit:cover; display:block;" />
                </td>
              </tr>
            </table>
          ` : ''}
          <h2 style="margin:0 0 12px; font-family:${HEADING_FONT}; font-size:20px; font-weight:bold; color:${BLUE};">
            ${escapeHtml(section.title)}
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${renderBulletList(section.body)}
          </table>
        </td></tr>`

    case 'section_header':
      return `
        <tr><td style="padding:32px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:${YELLOW}; padding:12px 20px; border-radius:8px;">
                <h2 style="margin:0; font-family:${HEADING_FONT}; font-size:18px; font-weight:bold; color:${BLUE};">
                  ${escapeHtml(section.title)}
                </h2>
              </td>
            </tr>
          </table>
        </td></tr>`

    case 'impact_story':
      return `
        <tr><td style="padding:24px 32px 0;">
          ${section.image ? `
            <img src="${escapeHtml(section.image)}" alt="" width="536" style="width:100%; max-width:536px; height:auto; border-radius:8px; display:block; margin-bottom:16px;" />
          ` : ''}
          ${section.title ? `<h3 style="margin:0 0 8px; font-family:${HEADING_FONT}; font-size:16px; font-weight:bold; color:#1a1a1a;">${escapeHtml(section.title)}</h3>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${renderBulletList(section.body)}
          </table>
        </td></tr>`

    case 'stats':
      if (!section.stats || section.stats.length === 0) return ''
      const statCells = section.stats.map(s => `
        <td width="${Math.floor(100 / section.stats!.length)}%" style="padding:8px; text-align:center; vertical-align:top;">
          <div style="background:#f8f9fb; border-radius:12px; padding:20px 12px;">
            <p style="margin:0; font-family:${HEADING_FONT}; font-size:28px; font-weight:bold; color:${BLUE};">${escapeHtml(s.value)}</p>
            <p style="margin:6px 0 0; font-family:${BODY_FONT}; font-size:13px; color:#666;">${escapeHtml(s.label)}</p>
          </div>
        </td>
      `).join('')
      return `
        <tr><td style="padding:24px 32px 0;">
          ${section.title ? `<h3 style="margin:0 0 12px; font-family:${HEADING_FONT}; font-size:16px; font-weight:bold; color:#1a1a1a;">${escapeHtml(section.title)}</h3>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>${statCells}</tr>
          </table>
        </td></tr>`

    case 'events':
      if (!section.events || section.events.length === 0) return ''
      const eventRows = section.events.map(ev => `
        <tr>
          <td style="padding:8px 0; font-family:${HEADING_FONT}; font-size:13px; font-weight:bold; color:${BLUE}; width:100px; vertical-align:top;">${escapeHtml(ev.date)}</td>
          <td style="padding:8px 0; font-family:${BODY_FONT}; font-size:14px; color:#444; line-height:1.5;">${escapeHtml(ev.description)}</td>
        </tr>
      `).join('')
      return `
        <tr><td style="padding:24px 32px 0;">
          ${section.title ? `<h3 style="margin:0 0 12px; font-family:${HEADING_FONT}; font-size:16px; font-weight:bold; color:#1a1a1a;">${escapeHtml(section.title)}</h3>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${eventRows}
          </table>
        </td></tr>`

    case 'cta':
      return `
        <tr><td align="center" style="padding:32px 32px 0;">
          ${section.body ? `<p style="margin:0 0 16px; font-family:${BODY_FONT}; font-size:15px; color:#444; line-height:1.7;">${nl2br(section.body)}</p>` : ''}
          <a href="${escapeHtml(section.ctaUrl || '#')}" style="display:inline-block; background:${YELLOW}; color:${BLUE}; font-family:${HEADING_FONT}; font-size:15px; font-weight:bold; padding:14px 32px; border-radius:10px; text-decoration:none;">
            ${escapeHtml(section.ctaLabel || section.title || 'Learn More')} &rarr;
          </a>
        </td></tr>`

    case 'custom':
    default:
      return `
        <tr><td style="padding:24px 32px 0;">
          ${section.image ? `
            <img src="${escapeHtml(section.image)}" alt="" width="536" style="width:100%; max-width:536px; height:auto; border-radius:8px; display:block; margin-bottom:16px;" />
          ` : ''}
          ${section.title ? `<h3 style="margin:0 0 8px; font-family:${HEADING_FONT}; font-size:16px; font-weight:bold; color:#1a1a1a;">${escapeHtml(section.title)}</h3>` : ''}
          <p style="margin:0; font-family:${BODY_FONT}; font-size:15px; color:#444; line-height:1.7;">${nl2br(section.body)}</p>
        </td></tr>`
  }
}

export function buildNewsletterHtml(content: NewsletterContent, options: TemplateOptions = {}): string {
  const sections = content.sections.map(renderSection).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f4f6f9;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f9; padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${BLUE}; padding:28px 32px; border-radius:16px 16px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block; background:${YELLOW}; color:${BLUE}; font-family:${HEADING_FONT}; font-size:13px; font-weight:bold; padding:4px 10px; border-radius:8px; margin-right:8px;">SE</span>
                    <span style="font-family:${HEADING_FONT}; font-size:20px; font-weight:bold; color:#ffffff;">
                      Scout<span style="color:${YELLOW};">Ed</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${content.quarterLabel ? `
          <!-- Quarter Banner -->
          <tr>
            <td style="background:${YELLOW}; padding:10px 32px;">
              <p style="margin:0; font-family:${HEADING_FONT}; font-size:12px; font-weight:bold; color:${BLUE}; text-transform:uppercase; letter-spacing:2px; text-align:center;">
                ${escapeHtml(content.quarterLabel)}
              </p>
            </td>
          </tr>
          ` : ''}

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">

                ${content.heroImage ? `
                <!-- Hero Image -->
                <tr>
                  <td>
                    <img src="${escapeHtml(content.heroImage)}" alt="" width="600" style="width:100%; max-width:600px; height:auto; display:block;" />
                  </td>
                </tr>
                ` : ''}

                ${sections}

                <!-- Bottom padding -->
                <tr><td style="height:32px;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; border-radius:0 0 16px 16px; border-top:2px solid ${YELLOW}; background:#fafafa;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family:${BODY_FONT}; font-size:12px; color:#aaa; line-height:1.6;">
                    ScoutEd &mdash; CSF Partnerships &amp; Strategic Initiatives<br>
                    Central Square Foundation, New Delhi, India
                    ${options.unsubscribeUrl ? `<br><a href="${escapeHtml(options.unsubscribeUrl)}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a>` : ''}
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
