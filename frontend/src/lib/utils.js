import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatElapsed(startedAt) {
  if (!startedAt) return '0:00'
  const diffMs = new Date() - new Date(startedAt)
  const diffSecs = Math.floor(diffMs / 1000)
  const mins = Math.floor(diffSecs / 60)
  const secs = diffSecs % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(ms) {
  if (!ms) return ''
  const secs = Math.floor(ms / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`
}

export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(str, n = 60) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}

// Get next reset date (weekly)
export function getWeeklyResetDate() {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const daysUntilSunday = (7 - day) % 7 || 7
  const reset = new Date(now)
  reset.setDate(now.getDate() + daysUntilSunday)
  reset.setHours(0, 0, 0, 0)
  return reset.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
