import type { Opportunity } from '../../types'
import { COLOURS, FONTS, scoreColour } from './brand'
import {
  generateAlignment,
  calculateTimeline,
  APPLICATION_CHECKLIST,
  generateFileName,
  getDecayedScore,
} from './content'

export async function generatePptx(opp: Opportunity): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pres = new PptxGenJS()

  pres.layout = 'LAYOUT_WIDE'
  pres.author = 'ScoutEd | Central Square Foundation'
  pres.subject = opp.title

  const score = getDecayedScore(opp)
  const alignment = generateAlignment(opp)
  const timeline = calculateTimeline(opp.deadline)

  // ── Helpers ─────────────────────────────────────────────────────

  function addFooter(slide: ReturnType<typeof pres.addSlide>) {
    // Yellow accent bar at top
    slide.addShape('rect', {
      x: 0, y: 0, w: '100%', h: 0.08,
      fill: { color: COLOURS.csfYellow },
    })
    // Footer text
    slide.addText('ScoutEd  |  Central Square Foundation', {
      x: 0.5, y: 6.9, w: 12, h: 0.4,
      fontSize: 9,
      fontFace: FONTS.heading,
      color: COLOURS.gray,
    })
  }

  // ── Slide 1: Cover ──────────────────────────────────────────────

  const s1 = pres.addSlide()
  s1.background = { fill: COLOURS.csfBlue }
  // Yellow accent bar
  s1.addShape('rect', {
    x: 0, y: 0, w: '100%', h: 0.12,
    fill: { color: COLOURS.csfYellow },
  })
  // Logo placeholder
  s1.addText('[CSF Logo]', {
    x: 0.8, y: 1.0, w: 3, h: 0.6,
    fontSize: 14,
    fontFace: FONTS.heading,
    color: COLOURS.csfYellow,
    bold: true,
  })
  // Title
  s1.addText(opp.title, {
    x: 0.8, y: 2.2, w: 11, h: 2.0,
    fontSize: 32,
    fontFace: FONTS.heading,
    color: COLOURS.white,
    bold: true,
    wrap: true,
  })
  // Organisation
  if (opp.organisation) {
    s1.addText(opp.organisation, {
      x: 0.8, y: 4.3, w: 11, h: 0.5,
      fontSize: 18,
      fontFace: FONTS.heading,
      color: COLOURS.csfYellow,
    })
  }
  // Date
  s1.addText(`Grant Application Draft  |  ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, {
    x: 0.8, y: 5.2, w: 11, h: 0.5,
    fontSize: 14,
    fontFace: FONTS.body,
    color: COLOURS.white,
  })
  // Score badge
  s1.addText(`Relevance: ${score}/100`, {
    x: 0.8, y: 6.2, w: 2.5, h: 0.5,
    fontSize: 14,
    fontFace: FONTS.heading,
    color: COLOURS.csfBlue,
    bold: true,
    fill: { color: scoreColour(score) },
    align: 'center',
    shape: 'roundRect',
    rectRadius: 0.1,
  })
  // Footer
  s1.addText('ScoutEd  |  Central Square Foundation', {
    x: 0.8, y: 6.9, w: 11, h: 0.4,
    fontSize: 9,
    fontFace: FONTS.heading,
    color: COLOURS.gray,
  })

  // ── Slide 2: Overview ───────────────────────────────────────────

  const s2 = pres.addSlide()
  addFooter(s2)
  s2.addText('Opportunity Overview', {
    x: 0.5, y: 0.4, w: 12, h: 0.7,
    fontSize: 26,
    fontFace: FONTS.heading,
    color: COLOURS.csfBlue,
    bold: true,
  })

  const deadlineText = opp.deadline
    ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Rolling / Open'

  const overviewRows: [string, string][] = [
    ['Deadline', deadlineText],
    ['Location', opp.location || 'India'],
    ['Funding', opp.amount || 'Not specified'],
    ['Sectors', opp.tags.join(', ') || 'General Education'],
    ['Relevance Score', `${score} / 100`],
    ['Organisation', opp.organisation || 'Not specified'],
  ]

  const tableRows = overviewRows.map(([label, value]) => [
    { text: label, options: { bold: true, fontFace: FONTS.heading, fontSize: 13, color: COLOURS.white, fill: { color: COLOURS.csfBlue } } },
    { text: value, options: { fontFace: FONTS.body, fontSize: 13, color: COLOURS.black } },
  ])

  s2.addTable(tableRows, {
    x: 0.5, y: 1.4, w: 12,
    border: { type: 'solid', pt: 0.5, color: COLOURS.lightGray },
    colW: [3, 9],
    rowH: 0.6,
    autoPage: false,
  })

  // POC
  if (opp.poc_email) {
    s2.addText(`Point of Contact: ${opp.poc_email}`, {
      x: 0.5, y: 5.5, w: 12, h: 0.4,
      fontSize: 12,
      fontFace: FONTS.body,
      color: COLOURS.csfBlue,
      italic: true,
    })
  }

  // ── Slide 3: Description ────────────────────────────────────────

  const s3 = pres.addSlide()
  addFooter(s3)
  s3.addText('About This Opportunity', {
    x: 0.5, y: 0.4, w: 12, h: 0.7,
    fontSize: 26,
    fontFace: FONTS.heading,
    color: COLOURS.csfBlue,
    bold: true,
  })

  const descText = opp.description.length > 2000
    ? opp.description.substring(0, 2000) + `\n\n[Full description at: ${opp.source_url}]`
    : opp.description

  s3.addText(descText, {
    x: 0.5, y: 1.4, w: 12, h: 5.2,
    fontSize: 12,
    fontFace: FONTS.body,
    color: COLOURS.black,
    wrap: true,
    valign: 'top',
    lineSpacingMultiple: 1.3,
  })

  // ── Slide 4: CSF Alignment ──────────────────────────────────────

  const s4 = pres.addSlide()
  addFooter(s4)
  s4.addText('CSF Alignment Analysis', {
    x: 0.5, y: 0.4, w: 12, h: 0.7,
    fontSize: 26,
    fontFace: FONTS.heading,
    color: COLOURS.csfBlue,
    bold: true,
  })

  let yPos = 1.4
  const autoPoints = alignment.filter(p => p.auto)
  const teamPoints = alignment.filter(p => !p.auto)

  for (const point of autoPoints) {
    s4.addText(`\u2713  ${point.text}`, {
      x: 0.5, y: yPos, w: 12, h: 0.45,
      fontSize: 13,
      fontFace: FONTS.body,
      color: '16A34A', // green-600
      wrap: true,
    })
    yPos += 0.5
  }

  if (teamPoints.length > 0) {
    yPos += 0.3
    s4.addText('Team Input Required', {
      x: 0.5, y: yPos, w: 12, h: 0.5,
      fontSize: 16,
      fontFace: FONTS.heading,
      color: COLOURS.gray,
      bold: true,
    })
    yPos += 0.6

    for (const point of teamPoints) {
      s4.addText(point.text, {
        x: 0.5, y: yPos, w: 12, h: 0.45,
        fontSize: 12,
        fontFace: FONTS.body,
        color: COLOURS.gray,
        italic: true,
        wrap: true,
      })
      yPos += 0.5
    }
  }

  // ── Slide 5: Next Steps ─────────────────────────────────────────

  const s5 = pres.addSlide()
  addFooter(s5)
  s5.addText('Next Steps & Checklist', {
    x: 0.5, y: 0.4, w: 12, h: 0.7,
    fontSize: 26,
    fontFace: FONTS.heading,
    color: COLOURS.csfBlue,
    bold: true,
  })

  // Timeline table
  const tlHeader = [
    { text: 'Milestone', options: { bold: true, fontFace: FONTS.heading, fontSize: 11, color: COLOURS.white, fill: { color: COLOURS.csfBlue } } },
    { text: 'Date', options: { bold: true, fontFace: FONTS.heading, fontSize: 11, color: COLOURS.white, fill: { color: COLOURS.csfBlue } } },
    { text: 'Status', options: { bold: true, fontFace: FONTS.heading, fontSize: 11, color: COLOURS.white, fill: { color: COLOURS.csfBlue } } },
  ]
  const tlRows = timeline.map(item => [
    { text: item.milestone, options: { fontFace: FONTS.body, fontSize: 11 } },
    { text: item.date, options: { fontFace: FONTS.body, fontSize: 11 } },
    { text: item.status, options: { fontFace: FONTS.heading, fontSize: 11, bold: true } },
  ])

  s5.addTable([tlHeader, ...tlRows], {
    x: 0.5, y: 1.3, w: 12,
    border: { type: 'solid', pt: 0.5, color: COLOURS.lightGray },
    colW: [5, 4, 3],
    rowH: 0.45,
    autoPage: false,
  })

  // Checklist
  s5.addText('Application Checklist', {
    x: 0.5, y: 4.2, w: 12, h: 0.4,
    fontSize: 14,
    fontFace: FONTS.heading,
    color: COLOURS.csfBlue,
    bold: true,
  })

  const checklistText = APPLICATION_CHECKLIST.map(item => `\u2610  ${item}`).join('\n')
  s5.addText(checklistText, {
    x: 0.5, y: 4.7, w: 12, h: 2.2,
    fontSize: 11,
    fontFace: FONTS.body,
    color: COLOURS.black,
    wrap: true,
    valign: 'top',
    lineSpacingMultiple: 1.4,
  })

  // ── Write file ──────────────────────────────────────────────────

  await pres.writeFile({ fileName: generateFileName(opp.title, 'pptx') })
}
