import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow, parseISO } from 'date-fns'

export function toDate(value: string | Date) {
  return typeof value === 'string' ? parseISO(value) : value
}

export function formatDate(value: string | Date, pattern = 'dd MMM yyyy') {
  return format(toDate(value), pattern)
}

export function formatDateTime(value: string | Date) {
  return format(toDate(value), 'dd MMM yyyy, HH:mm')
}

/** "Due today", "Due tomorrow", "Overdue by 2 days", "in 5 days". */
export function describeDueDate(value: string | Date) {
  const date = toDate(value)
  if (isToday(date)) return `Due today, ${format(date, 'HH:mm')}`
  if (isTomorrow(date)) return `Due tomorrow, ${format(date, 'HH:mm')}`
  if (isPast(date)) return `Overdue by ${formatDistanceToNowStrict(date)}`
  return `Due in ${formatDistanceToNowStrict(date)}`
}

export function formatFileSize(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / Math.pow(1024, exponent)
  return `${size.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

/** "08:30:00" -> "08:30" */
export function formatTime(value: string) {
  return value.slice(0, 5)
}

export function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
