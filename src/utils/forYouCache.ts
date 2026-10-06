import type { QueryClient } from '@tanstack/react-query'
import { getForYouMovies } from '../services/apiClient'
import type { ForYouMovie } from '../types'

export type ForYouFeed = {
  page: number
  results: ForYouMovie[]
  total_pages: number
  total_results: number
  /** Client-only: slots emptied by a removal that are waiting on a replacement from the server. */
  pendingSlots?: number
}

// DiscoverPage and DiscoverListPage cache the same feed under different keys.
const FOR_YOU_KEYS = [
  ['movies', 'for-you'],
  ['movies', 'for-you', 1],
]

function updateFeeds(qc: QueryClient, update: (old: ForYouFeed) => ForYouFeed) {
  for (const key of FOR_YOU_KEYS) {
    qc.setQueryData<ForYouFeed>(key, (old) => (old ? update(old) : old))
  }
}

/** Removes a movie so everything after it shifts up, leaving a pending slot at the end. */
export function dropFromForYouFeed(qc: QueryClient, movieId: number): boolean {
  // An in-flight refetch would otherwise land afterwards and put the movie back.
  qc.cancelQueries({ queryKey: ['movies', 'for-you'] })
  let dropped = false
  updateFeeds(qc, (old) => {
    if (!old.results.some((m) => m.id === movieId)) return old
    dropped = true
    const results = old.results.filter((m) => m.id !== movieId)
    return { ...old, results, total_results: results.length, pendingSlots: (old.pendingSlots ?? 0) + 1 }
  })
  return dropped
}

/** Fills the oldest pending slot with the server's replacement pick (or just clears it if there isn't one). */
export function fillForYouSlot(qc: QueryClient, movie: ForYouMovie | null | undefined) {
  updateFeeds(qc, (old) => {
    const results = movie && !old.results.some((m) => m.id === movie.id) ? [...old.results, movie] : old.results
    return { ...old, results, total_results: results.length, pendingSlots: Math.max(0, (old.pendingSlots ?? 0) - 1) }
  })
}

/** Refetches the feed and merges it in place: movies already on screen keep their position and
 *  newcomers are appended into the pending slots, so nothing reshuffles or flashes. */
export async function refreshForYouFeed(qc: QueryClient) {
  try {
    const fresh = await getForYouMovies()
    const freshIds = new Set(fresh.results.map((m) => m.id))
    updateFeeds(qc, (old) => {
      const kept = old.results.filter((m) => freshIds.has(m.id))
      const keptIds = new Set(kept.map((m) => m.id))
      const results = [...kept, ...fresh.results.filter((m) => !keptIds.has(m.id))]
      return { ...fresh, results, total_results: results.length, pendingSlots: 0 }
    })
  } catch {
    updateFeeds(qc, (old) => ({ ...old, pendingSlots: 0 }))
    qc.invalidateQueries({ queryKey: ['movies', 'for-you'] })
  }
}

// ─── Movies of the Day ──────────────────────────────────────────────────────

/** Prefix shared by every day's Movies of the Day query. */
const DAILY_PICKS_KEY = ['movies', 'movies-of-the-day']

/** The query key for today's picks. Today is the browser's local date — the
 *  same day the server picks for, since it's sent our timezone — so a page
 *  left open past midnight asks for the new day's three rather than serving
 *  yesterday's from cache. */
export function dailyPicksKey(now: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return [...DAILY_PICKS_KEY, `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`]
}

/** Removes a pick on tap (dismissed or just rated) so the rest shift up — the
 *  second pick becomes the hero — leaving a pending slot for the refill.
 *  Returns whether the movie was one of today's picks. */
export function dropFromDailyPicks(qc: QueryClient, movieId: number): boolean {
  // An in-flight refetch would otherwise land afterwards and put it back.
  qc.cancelQueries({ queryKey: DAILY_PICKS_KEY })
  let dropped = false
  qc.setQueriesData<ForYouFeed>({ queryKey: DAILY_PICKS_KEY }, (old) => {
    if (!old || !old.results.some((m) => m.id === movieId)) return old
    dropped = true
    const results = old.results.filter((m) => m.id !== movieId)
    return { ...old, results, total_results: results.length, pendingSlots: (old.pendingSlots ?? 0) + 1 }
  })
  return dropped
}

/** The server takes the film out of today's picks and refills just that slot
 *  on the next fetch, leaving the other two in place — so a plain refetch
 *  fills the gap. */
export function refreshDailyPicks(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: DAILY_PICKS_KEY })
}
