import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/apiClient'
import { invalidateTasteStats } from '../utils/tasteStatsCache'
import type { Movie, WatchlistItem } from '../types'

/** The shared watchlist — every add/remove button in the app reads
 *  watchlistIds from here and mutates through the same two mutations, with
 *  optimistic updates: a tap shows its effect on the ['watchlist'] cache
 *  immediately (so every card reading watchlistIds re-renders right away)
 *  rather than waiting on the round trip, and rolls back if the request
 *  fails. onSettled always resyncs with the server's actual answer. */
export function useWatchlistMutations({ enabled = true }: { enabled?: boolean } = {}) {
  const qc = useQueryClient()
  const { data: watchlist = [], isLoading } = useQuery({ queryKey: ['watchlist'], queryFn: getWatchlist, enabled })
  const watchlistIds = new Set(watchlist.map((w) => w.movie_id))

  const addMutation = useMutation({
    mutationFn: (movie: Movie) =>
      addToWatchlist({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        genre_ids: movie.genre_ids,
        vote_average: movie.vote_average,
      }),
    onMutate: async (movie: Movie) => {
      await qc.cancelQueries({ queryKey: ['watchlist'] })
      const previous = qc.getQueryData<WatchlistItem[]>(['watchlist'])
      qc.setQueryData<WatchlistItem[]>(['watchlist'], (old) => {
        const list = old ?? []
        if (list.some((w) => w.movie_id === movie.id)) return list
        const optimistic: WatchlistItem = {
          movie_id: movie.id,
          added_at: new Date().toISOString(),
          movies: {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            genre_ids: movie.genre_ids,
          },
        }
        return [...list, optimistic]
      })
      return { previous }
    },
    onError: (_err, _movie, context) => {
      if (context?.previous) qc.setQueryData(['watchlist'], context.previous)
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['watchlist'] }); invalidateTasteStats(qc) },
  })

  const removeMutation = useMutation({
    mutationFn: (movie: Movie) => removeFromWatchlist(movie.id),
    onMutate: async (movie: Movie) => {
      await qc.cancelQueries({ queryKey: ['watchlist'] })
      const previous = qc.getQueryData<WatchlistItem[]>(['watchlist'])
      qc.setQueryData<WatchlistItem[]>(['watchlist'], (old) => (old ?? []).filter((w) => w.movie_id !== movie.id))
      return { previous }
    },
    onError: (_err, _movie, context) => {
      if (context?.previous) qc.setQueryData(['watchlist'], context.previous)
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['watchlist'] }); invalidateTasteStats(qc) },
  })

  return { watchlist, watchlistIds, isLoading, addMutation, removeMutation }
}
