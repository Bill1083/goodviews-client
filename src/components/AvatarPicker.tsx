import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTrendingMovies, searchMovies, getMovieImages } from '../services/apiClient'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import MovieSearchBar from '../features/movies/MovieSearchBar'
import Avatar from './Avatar'
import type { Movie, MoviePosterImage } from '../types'

const TMDB_POSTER_SMALL = 'https://image.tmdb.org/t/p/w154'
const TMDB_POSTER_AVATAR = 'https://image.tmdb.org/t/p/w185'

const DEFAULT_FOCAL_Y = 22
const DEFAULT_ZOOM = 1

interface Props {
  onSelect: (avatarUrl: string, focalY: number, zoom: number) => void
  onClose: () => void
}

/** TMDB has no illustrated "character" art the way Disney+/Netflix profile icons do — no
 *  API returns "an image of just Spider-Man" separate from either an actor's real headshot
 *  or a full poster. Poster art is the closest fit: search a movie, pick from its poster
 *  variants (ensembles like the Avengers films often have separate hero-specific posters,
 *  which is exactly the "pick a character" case this is standing in for), then adjust the
 *  circular crop since the interesting part of a poster isn't always centered. */
export default function AvatarPicker({ onSelect, onClose }: Props) {
  // Two states, same split DiscoverPage uses: `rawQuery` tracks every keystroke so the UI can
  // switch away from "trending" the instant something is typed, while `searchQuery` only
  // updates on MovieSearchBar's debounced onSearch so the API isn't hit on every keystroke.
  const [rawQuery, setRawQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [movie, setMovie] = useState<Movie | null>(null)
  const [pickedPoster, setPickedPoster] = useState<MoviePosterImage | null>(null)
  const [focalY, setFocalY] = useState(DEFAULT_FOCAL_Y)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)

  useBodyScrollLock(true)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (pickedPoster) setPickedPoster(null)
      else if (movie) setMovie(null)
      else onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, movie, pickedPoster])

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

  const { data: images, isLoading: postersLoading } = useQuery({
    queryKey: ['movie-images', movie?.id],
    queryFn: () => getMovieImages(movie!.id),
    enabled: !!movie,
    staleTime: 1000 * 60 * 60,
  })

  const isSearchMode = rawQuery.trim().length >= 2
  const movies = isSearchMode ? searchResults?.results ?? [] : trending?.results ?? []
  const moviesLoading = isSearchMode ? searchLoading : trendingLoading
  const posters = [...(images?.posters ?? [])].sort((a, b) => b.vote_average - a.vote_average)

  function pickPoster(p: MoviePosterImage) {
    setPickedPoster(p)
    setFocalY(DEFAULT_FOCAL_Y)
    setZoom(DEFAULT_ZOOM)
  }

  const headerTitle = pickedPoster ? 'Adjust Photo' : movie ? movie.title : 'Choose a Character'
  const headerSubtitle = !movie
    ? 'Search a movie, then pick from its poster art'
    : !pickedPoster
      ? undefined
      : 'Drag the sliders to frame the crop'

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
            <h2 className="text-base font-bold text-gray-lighter truncate">{headerTitle}</h2>
            {headerSubtitle && <p className="text-xs text-gray-muted">{headerSubtitle}</p>}
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
          {pickedPoster ? (
            <div className="flex flex-col items-center gap-6">
              <button
                type="button"
                onClick={() => setPickedPoster(null)}
                className="self-start flex items-center gap-1 text-xs text-gray-muted hover:text-gray-lighter transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to poster art
              </button>

              <Avatar
                username=""
                avatarUrl={`${TMDB_POSTER_AVATAR}${pickedPoster.file_path}`}
                focalY={focalY}
                zoom={zoom}
                size="2xl"
                className="border-2 border-white/15 shadow-xl"
              />

              <div className="flex w-full max-w-xs flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-muted">Position (top ↔ bottom)</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={focalY}
                    onChange={(e) => setFocalY(Number(e.target.value))}
                    className="w-full accent-magenta"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-muted">Zoom</span>
                  <input
                    type="range"
                    min={100}
                    max={250}
                    value={zoom * 100}
                    onChange={(e) => setZoom(Number(e.target.value) / 100)}
                    className="w-full accent-magenta"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => onSelect(`${TMDB_POSTER_AVATAR}${pickedPoster.file_path}`, focalY, zoom)}
                className="px-6 py-2.5 rounded-full bg-magenta text-white text-sm font-semibold hover:bg-magenta/90 transition-colors"
              >
                Use This Photo
              </button>
            </div>
          ) : !movie ? (
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
                            src={`${TMDB_POSTER_SMALL}${m.poster_path}`}
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

              {postersLoading ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] w-full animate-pulse rounded-lg bg-navy-card/60" />
                  ))}
                </div>
              ) : posters.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-muted italic">No poster art available for this movie.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {posters.slice(0, 24).map((p) => (
                    <PosterPickButton key={p.file_path} poster={p} onPick={() => pickPoster(p)} />
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

function PosterPickButton({ poster, onPick }: { poster: MoviePosterImage; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group aspect-[2/3] w-full overflow-hidden rounded-lg border-2 border-white/10 bg-navy-card/60 hover:border-magenta/50 transition-colors"
    >
      <img
        src={`${TMDB_POSTER_SMALL}${poster.file_path}`}
        alt=""
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
        loading="lazy"
      />
    </button>
  )
}
