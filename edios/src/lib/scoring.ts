export const FACTOR_WEIGHTS: Record<string, number> = {
  financialStrength:       0.25,
  genuineTemporaryEntrant: 0.22,
  academicFit:             0.18,
  englishProficiency:      0.15,
  immigrationHistory:      0.12,
  tiesHomeCountry:         0.08,
}

export const FACTOR_LABELS: Record<string, string> = {
  financialStrength:       'Financial Strength',
  genuineTemporaryEntrant: 'Genuine Temp. Entrant',
  academicFit:             'Academic Fit',
  englishProficiency:      'English Proficiency',
  immigrationHistory:      'Immigration History',
  tiesHomeCountry:         'Ties to Home Country',
}

export function calculateApprovalProbability(
  factors: Record<string, number>,
  signalModifier: number = 0
): number {
  const base = Object.entries(FACTOR_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (factors[key] ?? 50) * weight
  }, 0)
  return Math.min(97, Math.max(5, Math.round(base + signalModifier)))
}

export function scoreToColor(score: number): string {
  if (score >= 86) return '#2ea595'
  if (score >= 66) return '#3fb950'
  if (score >= 41) return '#d29922'
  return '#f85149'
}

export function scoreToLabel(score: number): string {
  if (score >= 86) return 'Excellent'
  if (score >= 66) return 'Good'
  if (score >= 41) return 'Moderate'
  return 'High Risk'
}

export function statusToColor(status: string): string {
  switch (status) {
    case 'Approved': return '#3fb950'
    case 'Ready to Submit': return '#2ea595'
    case 'Submitted': return '#388bfd'
    case 'In Progress': return '#8b949e'
    case 'At Risk': return '#d29922'
    case 'High Risk': return '#f85149'
    case 'Refused': return '#f85149'
    default: return '#8b949e'
  }
}
