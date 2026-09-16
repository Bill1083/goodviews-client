import type { QueryClient } from '@tanstack/react-query'
import type { ForYouMovie } from '../types'

type ForYouFeed = { page: number; results: ForYouMovie[]; total_pages: number; total_results: number }

// DiscoverPage and DiscoverListPage cache the same feed under different keys.
const FOR_YOU_KEYS = [
  ['movies', 'for-you'],
  ['movies', 'for-you', 1],
]

/** Drops a movie from the cached For You feed and reports the slot it occupied (-1 if absent). */
export function dropFromForYouFeed(qc: QueryClient, movieId: number): number {
  let index = -1
  for (const key of FOR_YOU_KEYS) {
    qc.setQueryData<ForYouFeed>(key, (old) => {
      if (!old) return old
      const idx = old.results.findIndex((m) => m.id === movieId)
      if (idx === -1) return old
      if (index === -1) index = idx
      const results = old.results.filter((m) => m.id !== movieId)
      return { ...old, results, total_results: results.length }
    })
  }
  return index
}

/** Slots a replacement pick into the gap a dropped movie left behind. */
export function insertIntoForYouFeed(qc: QueryClient, movie: ForYouMovie, index: number) {
  for (const key of FOR_YOU_KEYS) {
    qc.setQueryData<ForYouFeed>(key, (old) => {
      if (!old || old.results.some((m) => m.id === movie.id)) return old
      const results = [...old.results]
      results.splice(index < 0 ? results.length : Math.min(index, results.length), 0, movie)
      return { ...old, results, total_results: results.length }
    })
  }
}
