// CSF brand constants for document generation (PPTX / DOCX)

// Hex colours WITHOUT # prefix (pptxgenjs requires this format)
export const COLOURS = {
  csfBlue: '00316B',
  csfYellow: 'FFD400',
  white: 'FFFFFF',
  black: '000000',
  gray: '6B7280',
  lightGray: 'F3F4F6',
  green: '22C55E',
  yellow: 'EAB308',
  red: 'EF4444',
} as const

// Same colours WITH # prefix (docx library uses this format)
export const HEX = {
  csfBlue: '#00316B',
  csfYellow: '#FFD400',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#22C55E',
  yellow: '#EAB308',
  red: '#EF4444',
} as const

export const FONTS = {
  heading: 'Gill Sans MT',
  body: 'Cambria',
} as const

// Widescreen 16:9 slide dimensions in inches
export const SLIDE = {
  width: 13.33,
  height: 7.5,
} as const

/** Return colour hex (no #) based on relevance score */
export function scoreColour(score: number): string {
  if (score >= 75) return COLOURS.green
  if (score >= 50) return COLOURS.yellow
  return COLOURS.red
}

/** Return colour hex (with #) based on relevance score */
export function scoreHex(score: number): string {
  if (score >= 75) return HEX.green
  if (score >= 50) return HEX.yellow
  return HEX.red
}
