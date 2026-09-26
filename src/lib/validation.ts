export type FieldErrors<T> = Partial<Record<keyof T, string>>

export function isBlank(value: string | null | undefined) {
  return !value || value.trim().length === 0
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function passwordProblem(value: string) {
  if (value.length < 8) return 'Password must be at least 8 characters.'
  if (!/[a-zA-Z]/.test(value)) return 'Password must contain at least one letter.'
  if (!/\d/.test(value)) return 'Password must contain at least one number.'
  return undefined
}

export function creditHoursProblem(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return 'Credit hours must be a number.'
  if (parsed <= 0) return 'Credit hours must be greater than 0.'
  if (parsed > 30) return 'Credit hours must be 30 or less.'
  return undefined
}

export function hasErrors<T>(errors: FieldErrors<T>) {
  return Object.values(errors).some(Boolean)
}
