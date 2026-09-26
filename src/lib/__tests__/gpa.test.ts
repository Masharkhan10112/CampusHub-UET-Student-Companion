import { describe, expect, it } from 'vitest'

import { DEFAULT_GRADE_POINTS, calculateGpa, formatGpa, gradePointsFor } from '@/lib/gpa'

describe('calculateGpa', () => {
  it('returns zero for an empty list', () => {
    expect(calculateGpa([])).toEqual({ totalCreditHours: 0, totalQualityPoints: 0, gpa: 0 })
  })

  it('weights each grade by its credit hours', () => {
    const result = calculateGpa([
      { creditHours: 3, gradePoints: 4 },
      { creditHours: 3, gradePoints: 3 },
      { creditHours: 2, gradePoints: 2 },
    ])

    expect(result.totalCreditHours).toBe(8)
    expect(result.totalQualityPoints).toBe(25)
    expect(formatGpa(result.gpa)).toBe('3.13')
  })

  it('ignores rows without credit hours', () => {
    const result = calculateGpa([
      { creditHours: 0, gradePoints: 4 },
      { creditHours: 4, gradePoints: 3 },
    ])

    expect(result.totalCreditHours).toBe(4)
    expect(formatGpa(result.gpa)).toBe('3.00')
  })

  it('maps letters through the grade scale', () => {
    expect(gradePointsFor('A+')).toBe(DEFAULT_GRADE_POINTS['A+'])
    expect(gradePointsFor('B-')).toBe(2.7)
    expect(gradePointsFor('unknown')).toBe(0)
  })

  it('supports a custom scale', () => {
    expect(gradePointsFor('A', { A: 5 })).toBe(5)
  })
})
