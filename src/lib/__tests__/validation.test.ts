import { describe, expect, it } from 'vitest'

import { creditHoursProblem, isBlank, isValidEmail, passwordProblem } from '@/lib/validation'

describe('validation helpers', () => {
  it('detects blank values', () => {
    expect(isBlank('   ')).toBe(true)
    expect(isBlank('a')).toBe(false)
  })

  it('validates emails', () => {
    expect(isValidEmail('student@uet.edu.pk')).toBe(true)
    expect(isValidEmail('not-an-email')).toBe(false)
  })

  it('requires a strong enough password', () => {
    expect(passwordProblem('short1')).toMatch(/8 characters/)
    expect(passwordProblem('alllettersonly')).toMatch(/number/)
    expect(passwordProblem('12345678')).toMatch(/letter/)
    expect(passwordProblem('campus2026')).toBeUndefined()
  })

  it('bounds credit hours', () => {
    expect(creditHoursProblem('0')).toBeDefined()
    expect(creditHoursProblem('31')).toBeDefined()
    expect(creditHoursProblem('3')).toBeUndefined()
  })
})
