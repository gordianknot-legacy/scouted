import type { Opportunity } from '../../types'
import { COLOURS, FONTS, scoreColour } from './brand'
import {
  generateAlignment,
  calculateTimeline,
  APPLICATION_CHECKLIST,
  generateFileName,
  getDecayedScore,
} from './content'

export async function generateDocx(opp: Opportunity): Promise<void> {
  const docx = await import('docx')
  const { saveAs } = await import('file-saver')

  const {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, Packer, BorderStyle, AlignmentType,
    WidthType, HeadingLevel, ShadingType,
  } = docx

  const score = getDecayedScore(opp)
  const alignment = generateAlignment(opp)
  const timeline = calculateTimeline(opp.deadline)

  const deadlineText = opp.deadline
    ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Rolling / Open'

  // ── Reusable builders ───────────────────────────────────────────

  function heading(text: string, level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2) {
    return new Paragraph({
      heading: level,
      spacing: { before: 300, after: 120 },
      children: [
        new TextRun({
          text,
          font: FONTS.heading,
          bold: true,
          color: COLOURS.csfBlue,
          size: level === HeadingLevel.HEADING_1 ? 32 : 26,
        }),
      ],
    })
  }

  function bodyText(text: string, opts?: { italic?: boolean; color?: string }) {
    return new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text,
          font: FONTS.body,
          size: 22,
          color: opts?.color || COLOURS.black,
          italics: opts?.italic,
        }),
      ],
    })
  }

  function yellowRule() {
    return new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOURS.csfYellow },
      },
      children: [],
    })
  }

  function labelCell(text: string) {
    return new TableCell({
      width: { size: 2500, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: COLOURS.csfBlue, fill: COLOURS.csfBlue },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, font: FONTS.heading, bold: true, color: COLOURS.white, size: 22 }),
          ],
        }),
      ],
    })
  }

  function valueCell(text: string) {
    return new TableCell({
      width: { size: 7000, type: WidthType.DXA },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, font: FONTS.body, size: 22 }),
          ],
        }),
      ],
    })
  }

  // ── Overview table ──────────────────────────────────────────────

  const overviewData: [string, string][] = [
    ['Deadline', deadlineText],
    ['Location', opp.location || 'India'],
    ['Funding', opp.amount || 'Not specified'],
    ['Sectors', opp.tags.join(', ') || 'General Education'],
    ['Score', `${score} / 100`],
    ['Organisation', opp.organisation || 'Not specified'],
  ]

  const overviewTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: overviewData.map(([label, value]) =>
      new TableRow({
        children: [labelCell(label), valueCell(value)],
      })
    ),
  })

  // ── Alignment section ───────────────────────────────────────────

  const alignmentParas: InstanceType<typeof Paragraph>[] = []
  const autoPoints = alignment.filter(p => p.auto)
  const teamPoints = alignment.filter(p => !p.auto)

  for (const point of autoPoints) {
    alignmentParas.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: '\u2713  ', font: FONTS.body, size: 22, color: '16A34A', bold: true }),
        new TextRun({ text: point.text, font: FONTS.body, size: 22, color: '16A34A' }),
      ],
    }))
  }

  if (teamPoints.length > 0) {
    alignmentParas.push(new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: 'Team Input Required', font: FONTS.heading, size: 24, bold: true, color: COLOURS.gray }),
      ],
    }))
    for (const point of teamPoints) {
      alignmentParas.push(new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: point.text, font: FONTS.body, size: 22, color: COLOURS.gray, italics: true }),
        ],
      }))
    }
  }

  // ── Timeline table ──────────────────────────────────────────────

  const tlHeaderRow = new TableRow({
    children: ['Milestone', 'Date', 'Status'].map(h =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: COLOURS.csfBlue, fill: COLOURS.csfBlue },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: h, font: FONTS.heading, bold: true, color: COLOURS.white, size: 20 }),
            ],
          }),
        ],
      })
    ),
  })

  const tlDataRows = timeline.map(item =>
    new TableRow({
      children: [item.milestone, item.date, item.status].map(val =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: val, font: FONTS.body, size: 20 }),
              ],
            }),
          ],
        })
      ),
    })
  )

  const timelineTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tlHeaderRow, ...tlDataRows],
  })

  // ── Checklist ───────────────────────────────────────────────────

  const checklistParas = APPLICATION_CHECKLIST.map(item =>
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: '\u2610  ', font: FONTS.body, size: 22 }),
        new TextRun({ text: item, font: FONTS.body, size: 22 }),
      ],
    })
  )

  // ── POC section ─────────────────────────────────────────────────

  const pocParas: InstanceType<typeof Paragraph>[] = []
  if (opp.poc_email) {
    pocParas.push(
      heading('Point of Contact', HeadingLevel.HEADING_2),
      new Paragraph({
        children: [
          new TextRun({ text: opp.poc_email, font: FONTS.body, size: 22, color: COLOURS.csfBlue }),
        ],
      })
    )
  }

  // ── Build document ──────────────────────────────────────────────

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONTS.body, size: 22 },
        },
      },
    },
    sections: [{
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'ScoutEd  |  Central Square Foundation',
                  font: FONTS.heading,
                  size: 16,
                  color: COLOURS.gray,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                  font: FONTS.heading,
                  size: 16,
                  color: COLOURS.gray,
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // Title
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: opp.title,
              font: FONTS.heading,
              bold: true,
              size: 40,
              color: COLOURS.csfBlue,
            }),
          ],
        }),

        // Organisation subtitle
        ...(opp.organisation ? [new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: opp.organisation,
              font: FONTS.heading,
              size: 26,
              color: COLOURS.gray,
            }),
          ],
        })] : []),

        // Score line
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `Relevance Score: ${score} / 100`,
              font: FONTS.heading,
              bold: true,
              size: 24,
              color: scoreColour(score),
            }),
          ],
        }),

        yellowRule(),

        // Overview
        heading('Opportunity Overview', HeadingLevel.HEADING_1),
        overviewTable,
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Description
        heading('About This Opportunity', HeadingLevel.HEADING_1),
        bodyText(opp.description),
        ...(opp.source_url ? [new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [
            new TextRun({ text: 'Source: ', font: FONTS.body, size: 20, color: COLOURS.gray }),
            new TextRun({ text: opp.source_url, font: FONTS.body, size: 20, color: COLOURS.csfBlue }),
          ],
        })] : []),

        // CSF Alignment
        heading('CSF Alignment Analysis', HeadingLevel.HEADING_1),
        ...alignmentParas,
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Timeline
        heading('Proposed Timeline', HeadingLevel.HEADING_1),
        timelineTable,
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Checklist
        heading('Application Checklist', HeadingLevel.HEADING_1),
        ...checklistParas,
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // POC
        ...pocParas,
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, generateFileName(opp.title, 'docx'))
}
