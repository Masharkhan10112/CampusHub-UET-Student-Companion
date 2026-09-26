/**
 * Grade scale and GPA maths. Kept dependency-free so it is unit testable and so
 * the same helpers back both the GPA calculator and the progress charts.
 */
export type GradeLetter = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'

export const DEFAULT_GRADE_POINTS: Record<GradeLetter, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  D: 1.0,
  F: 0,
}

export const GRADE_LETTERS = Object.keys(DEFAULT_GRADE_POINTS) as GradeLetter[]

export type GpaEntry = {
  creditHours: number
  gradePoints: number
}

export type GpaResult = {
  totalCreditHours: number
  totalQualityPoints: number
  gpa: number
}

/** GPA = SUM(credit hours x grade points) / SUM(credit hours) */
export function calculateGpa(entries: GpaEntry[]): GpaResult {
  const valid = entries.filter(
    (entry) => entry.creditHours > 0 && Number.isFinite(entry.gradePoints),
  )

  const totalCreditHours = valid.reduce((sum, entry) => sum + entry.creditHours, 0)
  const totalQualityPoints = valid.reduce(
    (sum, entry) => sum + entry.creditHours * entry.gradePoints,
    0,
  )

  return {
    totalCreditHours,
    totalQualityPoints,
    gpa: totalCreditHours === 0 ? 0 : totalQualityPoints / totalCreditHours,
  }
}

export function formatGpa(gpa: number) {
  return gpa.toFixed(2)
}

export function gradePointsFor(
  letter: string,
  scale: Record<string, number> = DEFAULT_GRADE_POINTS,
) {
  return scale[letter] ?? 0
}
