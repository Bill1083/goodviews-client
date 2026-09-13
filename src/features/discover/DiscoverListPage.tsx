import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTrendingMovies,
  getForYouMovies,
  markNotInterested,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../../services/apiClient'
import MovieCard from '../../components/MovieCard'
import MovieDetailModal from '../../components/MovieDetailModal'
import SendToFriendsPanel from '../../components/SendToFriendsPanel'
import PersonModal from '../../components/PersonModal'
import RetryImage from '../../components/RetryImage'
import ReviewModal from '../reviews/ReviewModal'
import type { Movie, ForYouMovie } from '../../types'

type Kind = 'popular' | 'for-you'

const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280'
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w342'

const KIND_CONFIG: Record<Kind, { title: string; subtitle: string; accent: string; eyebrowColor: string }> = {
  popular: {
    title: 'Most Popular This Week',
    subtitle: "The films everyone's watching, rating, and talking about right now.",
    accent: 'from-teal/20 via-navy-purple/5 to-transparent',
    eyebrowColor: 'text-teal',
  },
  'for-you': {
    title: 'For You',
    subtitle: 'Picks based on what you’ve rated, your favourite actors and directors, and what your friends love.',
    accent: 'from-magenta/20 via-navy-purple/5 to-transparent',
    eyebrowColor: 'text-magenta',
  },
}

function PaginationControls({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">← Prev</button>
      <span className="text-sm text-gray-muted">Page {page} of {Math.min(totalPages, 500)}</span>
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">Next →</button>
    </div>
  )
}

export default function DiscoverListPage({ kind }: { kind: Kind }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [personModalId, setPersonModalId] = useState<number | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showSendPanel, setShowSendPanel] = useState(false)

  const config = KIND_CONFIG[kind]

  const { data, isFetching, isError } = useQuery({
    queryKey: ['movies', kind === 'popular' ? 'trending' : 'for-you', page],
    queryFn: ({ signal }) => (kind === 'popular' ? getTrendingMovies(page, signal) : getForYouMovies(signal)),
    staleTime: 1000 * 60 * 30,
  })
  const reasonById = useMemo(() => {
    const map: Record<number, string> = {}
    if (kind === 'for-you') {
      for (const m of data?.results ?? []) {
        if ('reason' in m) map[m.id] = m.reason as string
      }
    }
    return map
  }, [data, kind])

  // Always feature the current page's top result, not just page 1 — a
  // banner permanently missing its movie on page 2+ read as broken.
  const topMovie = data?.results?.[0]
  const backdropUrl = topMovie?.backdrop_path ? `${TMDB_BACKDROP}${topMovie.backdrop_path}` : null
  const heroPosterUrl = topMovie?.poster_path ? `${TMDB_POSTER}${topMovie.poster_path}` : null
  // Stop showing the loading pulse once the fetch has settled either way —
  // otherwise a genuine error left the banner pulsing forever instead of
  // falling back to the generic title.
  const bannerLoading = !data && !isError

  // Reset scroll on arriving at this page and on every page change —
  // otherwise it opens wherever the Discover home page (or the previous
  // page of results) happened to be scrolled to.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [page, kind])

  // Prefetch the next page's data — and its poster images, which is the
  // slower part in practice — while the user is still browsing the current
  // page, so clicking "Next" feels instant instead of waiting on TMDB.
  // For You is always a single page, so this only applies to Popular.
  useEffect(() => {
    if (kind !== 'popular' || !data || page >= data.total_pages) return
    const nextPage = page + 1
    const key = ['movies', 'trending', nextPage]
    qc.prefetchQuery({
      queryKey: key,
      queryFn: () => getTrendingMovies(nextPage),
      staleTime: 1000 * 60 * 30,
    }).then(() => {
      const prefetched = qc.getQueryData<typeof data>(key)
      for (const m of prefetched?.results ?? []) {
        if (m.poster_path) new Image().src = `${TMDB_POSTER}${m.poster_path}`
      }
    })
  }, [kind, data, page, qc])

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
  })
  const watchlistIds = new Set(watchlist.map((w) => w.movie_id))

  const watchlistAddMutation = useMutation({
    mutationFn: (movie: Movie) =>
      addToWatchlist({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        genre_ids: movie.genre_ids,
        vote_average: movie.vote_average,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const notInterestedMutation = useMutation({
    mutationFn: (movieId: number) => markNotInterested(movieId),
    onSuccess: (result, movieId) => {
      const splice = (old?: { results: ForYouMovie[] } & Record<string, unknown>) => {
        if (!old) return old
        const idx = old.results.findIndex((m) => m.id === movieId)
        if (idx === -1) return old
        const results = [...old.results]
        if (result.replacement) results.splice(idx, 1, result.replacement)
        else results.splice(idx, 1)
        return { ...old, results, total_results: results.length }
      }
      qc.setQueryData(['movies', 'for-you'], splice)
      qc.setQueryData(['movies', 'for-you', 1], splice)
      setSelectedMovie(null)
    },
  })

  const watchlistRemoveMutation = useMutation({
    mutationFn: (movie: Movie) => removeFromWatchlist(movie.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero — features the #1 movie in this list as a big banner */}
        <div
          onClick={() => topMovie && setSelectedMovie(topMovie)}
          className={`group relative h-64 w-full overflow-hidden rounded-card border border-white/10 bg-navy-card sm:h-80 md:h-[26rem]${topMovie ? ' cursor-pointer' : ''}${bannerLoading ? ' animate-pulse' : ''}`}
        >
          {backdropUrl && (
            <RetryImage
              src={backdropUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              fallback={<></>}
            />
          )}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.accent}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-transparent" />

          <button
            onClick={(e) => { e.stopPropagation(); navigate('/') }}
            className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white sm:left-6 sm:top-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Discover
          </button>

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-8">
            {bannerLoading ? (
              <>
                <div className="hidden aspect-[2/3] w-20 shrink-0 rounded-lg border-2 border-white/10 bg-navy-card/80 sm:block md:w-24" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="h-3 w-28 rounded bg-navy-card/80" />
                  <div className="h-8 w-1/2 rounded bg-navy-card/80 sm:h-10" />
                  <div className="h-3 w-2/3 rounded bg-navy-card/80" />
                </div>
              </>
            ) : (
              <>
                {heroPosterUrl && (
                  <div className="hidden w-20 shrink-0 overflow-hidden rounded-lg border-2 border-white/10 bg-navy-card shadow-xl sm:block md:w-24">
                    <div className="aspect-[2/3] w-full">
                      <RetryImage
                        src={heroPosterUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        fallback={<div className="h-full w-full bg-navy-card" />}
                      />
                    </div>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold uppercase tracking-wider sm:text-sm ${config.eyebrowColor}`}>
                    {config.title}
                  </p>
                  <h1
                    style={{ fontFamily: '"Source Sans 3", sans-serif' }}
                    className="mt-1 truncate text-2xl font-bold text-white drop-shadow-md sm:text-4xl md:text-5xl"
                  >
                    {topMovie?.title ?? config.title}
                  </h1>
                  <p className="mt-2 max-w-xl text-xs text-gray-light/90 sm:text-sm line-clamp-2">{config.subtitle}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Grid */}
        <div style={{ opacity: isFetching ? 0.6 : 1 }} className="flex flex-col gap-6 transition-opacity">
          {isError && <p className="text-sm text-red-400">Something went wrong. Please try again.</p>}

          {kind === 'for-you' && bannerLoading && (
            <p className="text-center text-sm text-gray-muted">
              Hold tight while we find movies that fit your preferences!
            </p>
          )}

          {data && data.total_pages > 1 && (
            <PaginationControls page={page} totalPages={data.total_pages} onChange={setPage} />
          )}

          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
            {(data?.results ?? []).map((movie, i) => (
              <div
                key={movie.id}
                className="animate-[fadeInUp_0.4s_ease-out_both]"
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <MovieCard
                  movie={movie}
                  onSelect={setSelectedMovie}
                  isInWatchlist={watchlistIds.has(movie.id)}
                  onWatchlistAdd={(m) => watchlistAddMutation.mutate(m)}
                  onWatchlistRemove={(m) => watchlistRemoveMutation.mutate(m)}
                />
              </div>
            ))}
          </div>

          {data && data.total_pages > 1 && (
            <div className="pt-2">
              <PaginationControls page={page} totalPages={data.total_pages} onChange={setPage} />
            </div>
          )}
        </div>
      </main>

      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => { setSelectedMovie(null); setShowReviewModal(false); setShowSendPanel(false) }}
          onPersonClick={(pid) => setPersonModalId(pid)}
          forYouReason={reasonById[selectedMovie.id]}
          extraContent={
            showSendPanel ? (
              <SendToFriendsPanel movie={selectedMovie} onCancel={() => setShowSendPanel(false)} onSent={() => setShowSendPanel(false)} />
            ) : undefined
          }
          actions={[
            {
              key: 'watchlist',
              label: watchlistIds.has(selectedMovie.id) ? 'Remove from Watchlist' : 'Add to Watchlist',
              variant: watchlistIds.has(selectedMovie.id) ? 'teal' : 'outline',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {watchlistIds.has(selectedMovie.id) ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  )}
                </svg>
              ),
              onClick: () =>
                watchlistIds.has(selectedMovie.id)
                  ? watchlistRemoveMutation.mutate(selectedMovie)
                  : watchlistAddMutation.mutate(selectedMovie),
            },
            {
              key: 'review',
              label: 'Write a Review',
              variant: 'primary',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ),
              onClick: () => setShowReviewModal(true),
            },
            {
              key: 'send',
              label: 'Send to Friends',
              variant: 'magenta',
              active: showSendPanel,
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h15" />
                </svg>
              ),
              onClick: () => setShowSendPanel((v) => !v),
            },
            ...(kind === 'for-you'
              ? [
                  {
                    key: 'not-interested',
                    label: 'Not Interested',
                    variant: 'danger' as const,
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 105.636 5.636a9 9 0 0012.728 12.728zM6 6l12 12" />
                      </svg>
                    ),
                    onClick: () => notInterestedMutation.mutate(selectedMovie.id),
                  },
                ]
              : []),
          ]}
        />
      )}

      {showReviewModal && selectedMovie && (
        <ReviewModal movie={selectedMovie} mode="create" onClose={() => setShowReviewModal(false)} />
      )}

      {personModalId !== null && (
        <PersonModal
          personId={personModalId}
          onClose={() => setPersonModalId(null)}
          onMovieSelect={(movie) => {
            setPersonModalId(null)
            setSelectedMovie(movie)
          }}
        />
      )}
    </>
  )
}
