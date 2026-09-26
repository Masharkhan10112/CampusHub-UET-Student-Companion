/**
 * Converts anything thrown by supabase-js, the browser, or our own code into a
 * message that is safe and useful to show a student. Raw Postgres errors are
 * mapped to plain language so internal schema details never reach the UI.
 */
const FRIENDLY_BY_CODE: Record<string, string> = {
  '23505': 'That record already exists.',
  '23503': 'That item is linked to something that no longer exists.',
  '23514': 'Some of the values entered are outside the allowed range.',
  '42501': 'You do not have permission to do that.',
  PGRST301: 'Your session expired. Please sign in again.',
  invalid_credentials: 'Incorrect email or password.',
  email_not_confirmed: 'Please confirm your email address before signing in.',
  user_already_exists: 'An account with this email already exists.',
  over_email_send_rate_limit: 'Too many emails requested. Please wait a minute and try again.',
  weak_password: 'Please choose a stronger password (at least 8 characters).',
  unexpected_failure: 'The server could not complete that request. Please try again in a moment.',
}

const SERVER_ERROR = 'The server could not complete that request. Please try again in a moment.'

function isUninformative(message: string | undefined) {
  if (!message) return true
  const trimmed = message.trim()
  return trimmed === '' || trimmed === '{}' || trimmed === '[object Object]'
}

type MaybeSupabaseError = {
  code?: string
  message?: string
  error_description?: string
  status?: number
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (!error) return fallback

  if (typeof error === 'string') return error

  if (error instanceof Error) {
    const code = (error as Error & MaybeSupabaseError).code
    if (code && FRIENDLY_BY_CODE[code]) return FRIENDLY_BY_CODE[code]
    if (error.message === 'Failed to fetch') {
      return 'Cannot reach the server. Check your internet connection and try again.'
    }
    const status = (error as Error & MaybeSupabaseError).status
    if (status && status >= 500) return SERVER_ERROR
    if (isUninformative(error.message)) return fallback
    return error.message
  }

  if (typeof error === 'object') {
    const candidate = error as MaybeSupabaseError
    if (candidate.code && FRIENDLY_BY_CODE[candidate.code]) return FRIENDLY_BY_CODE[candidate.code]
    if (candidate.status && candidate.status >= 500) return SERVER_ERROR
    const message = candidate.message ?? candidate.error_description
    return isUninformative(message) ? fallback : (message as string)
  }

  return fallback
}
