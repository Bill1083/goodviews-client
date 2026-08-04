import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTrendingMovies, searchMovies, getMovieDetails } from '../services/apiClient'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import MovieSearchBar from '../features/movies/MovieSearchBar'
import type { Movie, CastMember } from '../types'

const TMDB_POSTER = 'https://image.tmdb.org/t/p/w154'
const TMDB_PROFILE = 'https://image.tmdb.org/t/p/w185'

interface Props {
  onSelect: (avatarUrl: string) => void
  onClose: () => void
}

/** TMDB has no illustrated "character" art like Disney+/Netflix profile icons — this picks
 *  from real cast photos instead: search a movie, then choose a character from its cast. */
export default function AvatarPicker({ onSelect, onClose }: Props) {
  // Two states, same split DiscoverPage uses: `rawQuery` tracks every keystroke so the UI can
  // switch away from "trending" the instant something is typed, while `searchQuery` only
  // updates on MovieSearchBar's debounced onSearch so the API isn't hit on every keystroke.
  const [rawQuery, setRawQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [movie, setMovie] = useState<Movie | null>(null)

  useBodyScrollLock(true)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (movie) setMovie(null)
      else onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, movie])

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => getTrendingMovies(1),
    staleTime: 1000 * 60 * 30,
  })

  const { data: searchResults, isFetching: searchLoading } = useQuery({
    queryKey: ['movies', 'search', searchQuery, 1],
    queryFn: ({ signal }) => searchMovies(searchQuery, 1, signal),
    enabled: searchQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  })

  const { data: details, isLoading: castLoading } = useQuery({
    queryKey: ['movie-details', movie?.id],
    queryFn: () => getMovieDetails(movie!.id),
    enabled: !!movie,
    staleTime: 1000 * 60 * 60,
  })

  const isSearchMode = rawQuery.trim().length >= 2
  const movies = isSearchMode ? searchResults?.results ?? [] : trending?.results ?? []
  const moviesLoading = isSearchMode ? searchLoading : trendingLoading
  const cast = details?.credits?.cast ?? []

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="panel-card dialog-scale-in flex w-full max-w-2xl flex-col gap-0 overflow-hidden max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-lighter truncate">
              {movie ? movie.title : 'Choose a Character'}
            </h2>
            {!movie && (
              <p className="text-xs text-gray-muted">Pick a movie, then a character from its cast</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-muted hover:text-gray-lighter text-xl leading-none shrink-0 ml-3"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {!movie ? (
            <div className="flex flex-col gap-4">
              <MovieSearchBar onSearch={setSearchQuery} onTyping={setRawQuery} isLoading={searchLoading} placeholder="Search for a movie…" />

              {moviesLoading ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] w-full animate-pulse rounded-lg bg-navy-card/60" />
                  ))}
                </div>
              ) : movies.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-muted italic">
                  {isSearchMode ? 'No movies found.' : 'Loading suggestions…'}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {movies.slice(0, 20).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMovie(m)}
                      className="group flex flex-col gap-1 rounded-lg overflow-hidden border border-white/5 bg-navy-card/30 text-left hover:border-magenta/30 hover:bg-navy-card/60 transition-all"
                    >
                      <div className="aspect-[2/3] w-full overflow-hidden bg-navy-card/60">
                        {m.poster_path ? (
                          <img
                            src={`${TMDB_POSTER}${m.poster_path}`}
                            alt={m.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-muted text-[10px] px-1 text-center leading-tight">
                            {m.title}
                          </div>
                        )}
                      </div>
                      <p className="px-1.5 pb-1.5 text-[10px] font-medium text-gray-lighter leading-tight line-clamp-2">
                        {m.title}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setMovie(null)}
                className="self-start flex items-center gap-1 text-xs text-gray-muted hover:text-gray-lighter transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to movies
              </button>

              {castLoading ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div className="aspect-square w-full animate-pulse rounded-full bg-navy-card/60" />
                    </div>
                  ))}
                </div>
              ) : cast.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-muted italic">No cast photos available for this movie.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {cast.filter((c) => c.profile_path).slice(0, 24).map((c) => (
                    <CastPickButton key={c.id} actor={c} onPick={() => onSelect(`${TMDB_PROFILE}${c.profile_path}`)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CastPickButton({ actor, onPick }: { actor: CastMember; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex flex-col items-center gap-1.5 text-center"
    >
      <div className="aspect-square w-full overflow-hidden rounded-full border-2 border-white/10 bg-navy-card/60 group-hover:border-magenta/50 transition-colors">
        <img
          src={`${TMDB_PROFILE}${actor.profile_path}`}
          alt={actor.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <p className="w-full line-clamp-1 text-[10px] font-medium text-gray-lighter group-hover:text-magenta transition-colors">
        {actor.character || actor.name}
      </p>
      <p className="w-full line-clamp-1 text-[9px] text-gray-muted">{actor.name}</p>
    </button>
  )
}
