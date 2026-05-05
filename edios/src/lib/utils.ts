import { formatDistanceToNow, parseISO } from 'date-fns'

export function relativeTime(timestamp: string): string {
  try {
    return formatDistanceToNow(parseISO(timestamp), { addSuffix: true })
  } catch {
    return timestamp
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-AU').format(n)
}
