import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMovieDetails } from '../services/apiClient'
import type { MovieDetails } from '../types'

const TMDB_PROFILE = 'https://image.tmdb.org/t/p/w185'

interface Props {
  movieId: number
  /** Pre-loaded overview to display immediately while full details are fetching */
  overview?: string
  /** Called when a cast member or director name is clicked */
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}

export default function MovieDescriptionPanel({ movieId, overview, onPersonClick }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const { data: details, isLoading } = useQuery<MovieDetails>({
    queryKey: ['movie-details', movieId],
    queryFn: () => getMovieDetails(movieId),
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const displayOverview = details?.overview ?? overview
  const directors = details?.credits?.crew?.filter((c) => c.job === 'Director') ?? []
  const topCast = details?.credits?.cast?.slice(0, 8) ?? []
  const genres = details?.genres ?? []
  const runtime = details?.runtime

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-xs font-medium text-gray-muted hover:text-gray-lighter hover:bg-white/5 transition-all"
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3 transition-transform duration-300 shrink-0"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Description
      </button>

      {/* Animated dropdown */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? '800px' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="flex flex-col gap-4 pt-3 pb-1">
          {isLoading && !displayOverview ? (
            <p className="text-xs text-gray-muted italic px-1">Loading description…</p>
          ) : (
            <>
              {/* Synopsis */}
              {displayOverview && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wider px-1">
                    Synopsis
                  </p>
                  <p className="text-sm text-gray-light/80 leading-relaxed px-1">
                    {displayOverview}
                  </p>
                </div>
              )}

              {/* Runtime + genres */}
              {(runtime || genres.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 px-1">
                  {runtime != null && runtime > 0 && (
                    <span className="text-xs text-gray-muted">
                      {Math.floor(runtime / 60)}h {runtime % 60}m
                    </span>
                  )}
                  {genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-gray-muted"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Directors */}
              {directors.length > 0 && (
                <div className="flex flex-col gap-1.5 px-1">
                  <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wider">
                    {directors.length === 1 ? 'Director' : 'Directors'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {directors.map((d) => (
                      onPersonClick ? (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => onPersonClick(d.id, d.name, 'director')}
                          className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-gray-lighter hover:border-magenta/50 hover:bg-magenta/10 hover:text-magenta transition-colors"
                        >
                          {d.name}
                        </button>
                      ) : (
                        <span
                          key={d.id}
                          className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-gray-lighter"
                        >
                          {d.name}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Cast */}
              {topCast.length > 0 && (
                <div className="flex flex-col gap-2 px-1">
                  <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wider">
                    Cast
                  </p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {topCast.map((actor) => (
                      <div
                        key={actor.id}
                        className={['flex flex-col items-center gap-1 text-center', onPersonClick ? 'cursor-pointer group' : ''].join(' ')}
                        onClick={onPersonClick ? () => onPersonClick(actor.id, actor.name, 'actor') : undefined}
                        role={onPersonClick ? 'button' : undefined}
                        tabIndex={onPersonClick ? 0 : undefined}
                        onKeyDown={onPersonClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onPersonClick(actor.id, actor.name, 'actor') } : undefined}
                      >
                        <div className={['h-12 w-12 rounded-full overflow-hidden bg-navy-card/60 border shrink-0 transition-colors', onPersonClick ? 'border-white/10 group-hover:border-magenta/50' : 'border-white/10'].join(' ')}>
                          {actor.profile_path ? (
                            <img
                              src={`${TMDB_PROFILE}${actor.profile_path}`}
                              alt={actor.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-muted text-xs">
                              ?
                            </div>
                          )}
                        </div>
                        <p className={['text-[10px] leading-tight line-clamp-2 w-full transition-colors', onPersonClick ? 'text-gray-lighter group-hover:text-magenta' : 'text-gray-lighter'].join(' ')}>
                          {actor.name}
                        </p>
                        <p className="text-[10px] text-gray-muted leading-tight line-clamp-1 w-full italic">
                          {actor.character}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback: still loading credits but overview available */}
              {isLoading && displayOverview && directors.length === 0 && topCast.length === 0 && (
                <p className="text-xs text-gray-muted italic px-1">Loading cast & crew…</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
