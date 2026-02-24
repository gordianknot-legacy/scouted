/**
 * Format a number in Indian numbering system (Crore/Lakh).
 * Per CSF brand guidelines: use Indian numbering format unless international.
 */
export function formatINR(amount: number): string {
  if (amount < 0) return `-${formatINR(-amount)}`

  if (amount >= 1_00_00_000) {
    const crore = amount / 1_00_00_000
    const formatted = crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(1)
    return `\u20B9${formatted} Crore`
  }

  if (amount >= 1_00_000) {
    const lakh = amount / 1_00_000
    const formatted = lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)
    return `\u20B9${formatted} Lakh`
  }

  return `\u20B9${amount.toLocaleString('en-IN')}`
}
