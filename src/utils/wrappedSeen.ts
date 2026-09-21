/** Remembers which Wrapped years this browser has already played, per user,
 * so the "it's ready" nudges go quiet after the first viewing. Storage
 * access is wrapped in try/catch — private mode / blocked storage just means
 * the nudge shows again, which is harmless. */
function key(userId: string, year: number): string {
  return `wrapped_seen:${userId}:${year}`
}

export function isWrappedSeen(userId: string, year: number): boolean {
  try {
    return localStorage.getItem(key(userId, year)) === '1'
  } catch {
    return false
  }
}

export function markWrappedSeen(userId: string, year: number): void {
  try {
    localStorage.setItem(key(userId, year), '1')
    window.dispatchEvent(new Event('wrapped-seen'))
  } catch {
    // ignore
  }
}
