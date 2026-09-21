import type { QueryClient } from '@tanstack/react-query'

/** Everything under ['stats'] (dashboard, Wrapped availability, Wrapped
 * years) derives from the user's ratings / watchlist / favourites / friends.
 * The backend versions its own cache on every write; this is the client-side
 * counterpart so the profile page doesn't show numbers from before the write. */
export function invalidateTasteStats(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: ['stats'] })
}
