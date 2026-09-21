/** Formatting helpers for the taste dashboard and Wrapped. No date library
 * in this project — everything is Intl / Date arithmetic. */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** 27650 → { days: 19, hours: 4, minutes: 50 } */
export function splitMinutes(total: number): { days: number; hours: number; minutes: number } {
  const safe = Math.max(0, Math.round(total))
  return { days: Math.floor(safe / 1440), hours: Math.floor((safe % 1440) / 60), minutes: safe % 60 }
}

/** "3 days 4 hrs", "2 hrs 10 min", "45 min" — the biggest two units only. */
export function formatMinutesLong(total: number): string {
  const { days, hours, minutes } = splitMinutes(total)
  if (days > 0) return `${days} ${plural(days, 'day')}${hours ? ` ${hours} ${plural(hours, 'hr')}` : ''}`
  if (hours > 0) return `${hours} ${plural(hours, 'hr')}${minutes ? ` ${minutes} min` : ''}`
  return `${minutes} min`
}

/** "1h 52m" for a single film's runtime. */
export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`
}

/** 'YYYY-MM' → 'Mar 26' (short=true) / 'March 2026'. */
export function formatMonthKey(key: string, short = true): string {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  return short ? `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}` : `${MONTHS_LONG[m - 1]} ${y}`
}

export function monthName(month: number, short = false): string {
  return (short ? MONTHS_SHORT : MONTHS_LONG)[month - 1] ?? ''
}

export function plural(n: number, word: string, pluralWord?: string): string {
  return n === 1 ? word : (pluralWord ?? `${word}s`)
}

export function formatPercent(share: number | null | undefined, digits = 0): string {
  if (share == null || Number.isNaN(share)) return '—'
  return `${(share * 100).toFixed(digits)}%`
}

export function formatCompact(n: number): string {
  try {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  } catch {
    return String(n)
  }
}

export function formatMoney(usd: number): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 0 }).format(usd)
  } catch {
    return `$${formatCompact(usd)}`
  }
}

/** "+0.4★" / "−0.6★" — a delta on the 5-star scale. */
export function formatStarDelta(delta: number | null | undefined): string {
  if (delta == null) return '—'
  const stars = delta / 2
  const sign = stars > 0 ? '+' : stars < 0 ? '−' : '±'
  return `${sign}${Math.abs(stars).toFixed(1)}★`
}

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Whole days from now until `iso` (never negative). */
export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

export function releaseYear(date: string | null | undefined): string {
  return date ? date.slice(0, 4) : ''
}

/** ISO 3166-1 / 639-1 codes → display names, falling back to the code. */
export function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

export function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}
