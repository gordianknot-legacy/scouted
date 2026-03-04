import { COLOURS, FONTS } from './brand'
import { CSF_PITCH_CONTENT, generateCsrFileName } from './content'
import { formatINR } from '../formatters'
import type { AiDraftResult } from './ai-draft'

export interface CsrCompanyData {
  company: string
  cin: string
  eduSpend: number
  vocSpend: number
  totalSpend: number
  eduProjects: { field: string; spend: number }[]
  vocProjects: { field: string; spend: number }[]
  priorAssociation?: string
  notes?: string
}

// ── PPTX Generator ──────────────────────────────────────────────────

export async function generateCsrConceptPptx(data: CsrCompanyData, aiDraft?: AiDraftResult): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pres = new PptxGenJS()

  pres.layout = 'LAYOUT_WIDE'
  pres.author = 'ScoutEd | Central Square Foundation'
  pres.subject = `CSR Partnership — ${data.company}`

  function addFooter(slide: ReturnType<typeof pres.addSlide>) {
    slide.addShape('rect', {
      x: 0, y: 0, w: '100%', h: 0.08,
      fill: { color: COLOURS.csfYellow },
    })
    slide.addText('ScoutEd  |  Central Square Foundation', {
      x: 0.5, y: 6.9, w: 12, h: 0.4,
      fontSize: 9,
      fontFace: FONTS.heading,
      color: COLOURS.gray,
    })
  }

  function bulletSlide(
    title: string,
    bullets: string[],
    opts?: { teamInputs?: string[] }
  ) {
    const slide = pres.addSlide()
    addFooter(slide)
    slide.addText(title, {
      x: 0.5, y: 0.4, w: 12, h: 0.7,
      fontSize: 26,
      fontFace: FONTS.heading,
      color: COLOURS.csfBlue,
      bold: true,
    })
    const text = bullets.map(b => `\u2022  ${b}`).join('\n\n')
    slide.addText(text, {
      x: 0.5, y: 1.4, w: 12, h: 4.0,
      fontSize: 13,
      fontFace: FONTS.body,
      color: COLOURS.black,
      wrap: true,
      valign: 'top',
      lineSpacingMultiple: 1.3,
    })
    if (opts?.teamInputs && opts.teamInputs.length > 0) {
      const teamText = opts.teamInputs.map(t => `\u2022  ${t}`).join('\n')
      slide.addText(teamText, {
        x: 0.5, y: 5.5, w: 12, h: 1.2,
        fontSize: 12,
        fontFace: FONTS.body,
        color: COLOURS.gray,
        italic: true,
        wrap: true,
        valign: 'top',
        lineSpacingMultiple: 1.3,
      })
    }
    return slide
  }

  // ── Slide 1: Cover ────────────────────────────────────────────────

  const s1 = pres.addSlide()
  s1.background = { fill: COLOURS.csfBlue }
  s1.addShape('rect', {
    x: 0, y: 0, w: '100%', h: 0.12,
    fill: { color: COLOURS.csfYellow },
  })
  s1.addText('[CSF Logo]', {
    x: 0.8, y: 1.0, w: 3, h: 0.6,
    fontSize: 14,
    fontFace: FONTS.heading,
    color: COLOURS.csfYellow,
    bold: true,
  })
  s1.addText(`CSR Partnership Concept Note`, {
    x: 0.8, y: 2.2, w: 11, h: 1.0,
    fontSize: 20,
    fontFace: FONTS.heading,
    color: COLOURS.csfYellow,
  })
  s1.addText(data.company, {
    x: 0.8, y: 3.2, w: 11, h: 1.5,
    fontSize: 36,
    fontFace: FONTS.heading,
    color: COLOURS.white,
    bold: true,
    wrap: true,
  })
  s1.addText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), {
    x: 0.8, y: 5.2, w: 11, h: 0.5,
    fontSize: 14,
    fontFace: FONTS.body,
    color: COLOURS.white,
  })
  s1.addText('ScoutEd  |  Central Square Foundation', {
    x: 0.8, y: 6.9, w: 11, h: 0.4,
    fontSize: 9,
    fontFace: FONTS.heading,
    color: COLOURS.gray,
  })

  // ── Slide 2: The Education Challenge ──────────────────────────────

  bulletSlide(
    'The Education Challenge',
    aiDraft?.educationChallenge || [...CSF_PITCH_CONTENT.educationChallenge],
  )

  // ── Slide 3: CSF's Impact ─────────────────────────────────────────

  bulletSlide(
    'CSF\u2019s Impact',
    aiDraft?.csfImpact || [...CSF_PITCH_CONTENT.csfImpact],
  )

  // ── Slide 4: Company CSR Profile (Auto-populated) ─────────────────

  const s4 = pres.addSlide()
  addFooter(s4)
  s4.addText(`${data.company} \u2014 CSR Profile`, {
    x: 0.5, y: 0.4, w: 12, h: 0.7,
    fontSize: 26,
    fontFace: FONTS.heading,
    color: COLOURS.csfBlue,
    bold: true,
  })

  const csrRows: [string, string][] = [
    ['Total CSR Spending (FY 2023-24)', formatINR(data.totalSpend)],
    ['Education CSR', formatINR(data.eduSpend)],
    ['Vocational Skills CSR', formatINR(data.vocSpend)],
    ['Education as % of Total CSR', data.totalSpend > 0 ? `${Math.round((data.eduSpend / data.totalSpend) * 100)}%` : '0%'],
  ]

  const tableRows = csrRows.map(([label, value]) => [
    { text: label, options: { bold: true, fontFace: FONTS.heading, fontSize: 13, color: COLOURS.white, fill: { color: COLOURS.csfBlue } } },
    { text: value, options: { fontFace: FONTS.body, fontSize: 13, color: COLOURS.black } },
  ])

  s4.addTable(tableRows, {
    x: 0.5, y: 1.4, w: 12,
    border: { type: 'solid', pt: 0.5, color: COLOURS.lightGray },
    colW: [5, 7],
    rowH: 0.6,
    autoPage: false,
  })

  // Top projects
  const topProjects = [
    ...data.eduProjects.slice(0, 5).map(p => `${p.field}: ${formatINR(p.spend)}`),
    ...data.vocProjects.slice(0, 3).map(p => `${p.field}: ${formatINR(p.spend)}`),
  ]

  if (topProjects.length > 0) {
    s4.addText('Top CSR Projects in Education', {
      x: 0.5, y: 4.0, w: 12, h: 0.5,
      fontSize: 16,
      fontFace: FONTS.heading,
      color: COLOURS.csfBlue,
      bold: true,
    })
    const projText = topProjects.map(p => `\u2022  ${p}`).join('\n')
    s4.addText(projText, {
      x: 0.5, y: 4.5, w: 12, h: 2.2,
      fontSize: 12,
      fontFace: FONTS.body,
      color: COLOURS.black,
      wrap: true,
      valign: 'top',
      lineSpacingMultiple: 1.3,
    })
  }

  // ── Slide 5: Proposed Partnership ─────────────────────────────────

  bulletSlide(
    'Proposed Partnership',
    aiDraft?.proposedPartnership || [...CSF_PITCH_CONTENT.proposedPartnership],
  )

  // ── Slide 6: Investment Framework ─────────────────────────────────

  const s6 = pres.addSlide()
  addFooter(s6)
  s6.addText('Investment Framework', {
    x: 0.5, y: 0.4, w: 12, h: 0.7,
    fontSize: 26,
    fontFace: FONTS.heading,
    color: COLOURS.csfBlue,
    bold: true,
  })

  const budgetItems = aiDraft?.investmentFramework || CSF_PITCH_CONTENT.investmentFramework
  const budgetHeader = [
    { text: 'Budget Line Item', options: { bold: true, fontFace: FONTS.heading, fontSize: 12, color: COLOURS.white, fill: { color: COLOURS.csfBlue } } },
    { text: 'Amount', options: { bold: true, fontFace: FONTS.heading, fontSize: 12, color: COLOURS.white, fill: { color: COLOURS.csfBlue } } },
  ]
  const budgetRows = budgetItems.map(row => [
    { text: row.item, options: { fontFace: FONTS.body, fontSize: 12 } },
    { text: row.amount, options: { fontFace: FONTS.body, fontSize: 12, color: COLOURS.gray, italic: true } },
  ])

  s6.addTable([budgetHeader, ...budgetRows], {
    x: 0.5, y: 1.4, w: 12,
    border: { type: 'solid', pt: 0.5, color: COLOURS.lightGray },
    colW: [8, 4],
    rowH: 0.55,
    autoPage: false,
  })

  // ── Slide 7: Why Partner with CSF ─────────────────────────────────

  const whyBullets = aiDraft?.whyPartnerWithCsf || [...CSF_PITCH_CONTENT.whyPartnerWithCsf]
  // Add prior association if available
  if (data.priorAssociation && !aiDraft) {
    const idx = whyBullets.findIndex(b => b.includes('[TEAM INPUT]'))
    if (idx >= 0) {
      whyBullets[idx] = data.priorAssociation
    }
  }
  bulletSlide('Why Partner with CSF', whyBullets)

  // ── Write file ────────────────────────────────────────────────────

  await pres.writeFile({ fileName: generateCsrFileName(data.company, 'pptx') })
}

// ── DOCX Generator ──────────────────────────────────────────────────

export async function generateCsrConceptDocx(data: CsrCompanyData, aiDraft?: AiDraftResult): Promise<void> {
  const docx = await import('docx')
  const { saveAs } = await import('file-saver')

  const {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, Packer, BorderStyle, AlignmentType,
    WidthType, HeadingLevel, ShadingType,
  } = docx

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

  function bulletList(items: string[], opts?: { color?: string; italic?: boolean }): InstanceType<typeof Paragraph>[] {
    return items.map(item =>
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: '\u2022  ', font: FONTS.body, size: 22, bold: true, color: opts?.color }),
          new TextRun({ text: item, font: FONTS.body, size: 22, color: opts?.color || COLOURS.black, italics: opts?.italic }),
        ],
      })
    )
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
      width: { size: 3500, type: WidthType.DXA },
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
      width: { size: 6000, type: WidthType.DXA },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, font: FONTS.body, size: 22 }),
          ],
        }),
      ],
    })
  }

  // CSR profile table
  const csrRows: [string, string][] = [
    ['Total CSR (FY 2023-24)', formatINR(data.totalSpend)],
    ['Education CSR', formatINR(data.eduSpend)],
    ['Vocational Skills CSR', formatINR(data.vocSpend)],
    ['Education % of Total', data.totalSpend > 0 ? `${Math.round((data.eduSpend / data.totalSpend) * 100)}%` : '0%'],
  ]

  const csrTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: csrRows.map(([label, value]) =>
      new TableRow({ children: [labelCell(label), valueCell(value)] })
    ),
  })

  // Budget table
  const budgetItems = aiDraft?.investmentFramework || CSF_PITCH_CONTENT.investmentFramework
  const budgetHeaderRow = new TableRow({
    children: ['Budget Line Item', 'Amount'].map(h =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: COLOURS.csfBlue, fill: COLOURS.csfBlue },
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, font: FONTS.heading, bold: true, color: COLOURS.white, size: 20 })],
          }),
        ],
      })
    ),
  })
  const budgetDataRows = budgetItems.map(row =>
    new TableRow({
      children: [row.item, row.amount].map(val =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: val, font: FONTS.body, size: 20 })],
            }),
          ],
        })
      ),
    })
  )
  const budgetTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [budgetHeaderRow, ...budgetDataRows],
  })

  // Top projects
  const topProjects = [
    ...data.eduProjects.slice(0, 5).map(p => `${p.field}: ${formatINR(p.spend)}`),
    ...data.vocProjects.slice(0, 3).map(p => `${p.field}: ${formatINR(p.spend)}`),
  ]

  // Why partner bullets
  const whyBullets = aiDraft?.whyPartnerWithCsf || [...CSF_PITCH_CONTENT.whyPartnerWithCsf]
  if (data.priorAssociation && !aiDraft) {
    const idx = whyBullets.findIndex(b => b.includes('[TEAM INPUT]'))
    if (idx >= 0) whyBullets[idx] = data.priorAssociation
  }

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
                new TextRun({ text: 'ScoutEd  |  Central Square Foundation', font: FONTS.heading, size: 16, color: COLOURS.gray }),
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
                  font: FONTS.heading, size: 16, color: COLOURS.gray,
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
            new TextRun({ text: 'CSR Partnership Concept Note', font: FONTS.heading, size: 24, color: COLOURS.gray }),
          ],
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: data.company, font: FONTS.heading, bold: true, size: 40, color: COLOURS.csfBlue }),
          ],
        }),
        yellowRule(),

        // Section 1: Education Challenge
        heading('The Education Challenge', HeadingLevel.HEADING_1),
        ...bulletList(aiDraft?.educationChallenge || [...CSF_PITCH_CONTENT.educationChallenge]),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Section 2: CSF Impact
        heading('CSF\u2019s Impact', HeadingLevel.HEADING_1),
        ...bulletList(aiDraft?.csfImpact || [...CSF_PITCH_CONTENT.csfImpact]),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Section 3: CSR Profile
        heading(`${data.company} \u2014 CSR Profile`, HeadingLevel.HEADING_1),
        csrTable,
        new Paragraph({ spacing: { after: 200 }, children: [] }),
        ...(topProjects.length > 0 ? [
          heading('Top Education CSR Projects', HeadingLevel.HEADING_2),
          ...bulletList(topProjects),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
        ] : []),

        // Section 4: Proposed Partnership
        heading('Proposed Partnership', HeadingLevel.HEADING_1),
        ...bulletList(
          aiDraft?.proposedPartnership || [...CSF_PITCH_CONTENT.proposedPartnership],
          aiDraft ? undefined : { color: COLOURS.gray, italic: true }
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Section 5: Investment Framework
        heading('Investment Framework', HeadingLevel.HEADING_1),
        budgetTable,
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Section 6: Why Partner with CSF
        heading('Why Partner with CSF', HeadingLevel.HEADING_1),
        ...bulletList(whyBullets),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, generateCsrFileName(data.company, 'docx'))
}
