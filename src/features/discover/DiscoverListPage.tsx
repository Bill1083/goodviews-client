import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTrendingMovies, getTopRatedMovies, getWatchlist, addToWatchlist, removeFromWatchlist } from '../../services/apiClient'
import MovieCard from '../../components/MovieCard'
import MovieDetailModal from '../../components/MovieDetailModal'
import SendToFriendsPanel from '../../components/SendToFriendsPanel'
import PersonModal from '../../components/PersonModal'
import ReviewModal from '../reviews/ReviewModal'
import type { Movie } from '../../types'

type Kind = 'popular' | 'for-you'

const KIND_CONFIG: Record<Kind, { title: string; subtitle: string; emoji: string; accent: string }> = {
  popular: {
    title: 'Most Popular This Week',
    subtitle: "The films everyone's watching, rating, and talking about right now.",
    emoji: '🔥',
    accent: 'from-teal/25 via-navy-purple/10 to-transparent',
  },
  'for-you': {
    title: 'For You',
    subtitle: 'Top-rated picks to get you started — personalized recommendations coming soon.',
    emoji: '✨',
    accent: 'from-magenta/25 via-navy-purple/10 to-transparent',
  },
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
    queryKey: ['movies', kind === 'popular' ? 'trending' : 'top-rated', page],
    queryFn: () => (kind === 'popular' ? getTrendingMovies(page) : getTopRatedMovies(page)),
    staleTime: 1000 * 60 * 30,
  })

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

  const watchlistRemoveMutation = useMutation({
    mutationFn: (movie: Movie) => removeFromWatchlist(movie.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <div className={`relative overflow-hidden rounded-card border border-white/10 bg-gradient-to-br ${config.accent} bg-navy-card/30 px-6 py-10 sm:px-10 sm:py-14`}>
          <button
            onClick={() => navigate('/discover')}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-muted transition-colors hover:text-gray-lighter"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Discover
          </button>
          <span className="text-4xl sm:text-5xl">{config.emoji}</span>
          <h1
            style={{ fontFamily: '"Source Sans 3", sans-serif' }}
            className="mt-3 text-3xl font-semibold text-white sm:text-4xl"
          >
            {config.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-gray-muted sm:text-base">{config.subtitle}</p>
        </div>

        {/* Grid */}
        <div style={{ opacity: isFetching ? 0.6 : 1 }} className="flex flex-col gap-6 transition-opacity">
          {isError && <p className="text-sm text-red-400">Something went wrong. Please try again.</p>}

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
            <div className="flex items-center justify-center gap-4 pt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">← Prev</button>
              <span className="text-sm text-gray-muted">Page {page} of {Math.min(data.total_pages, 500)}</span>
              <button onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">Next →</button>
            </div>
          )}
        </div>
      </main>

      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => { setSelectedMovie(null); setShowReviewModal(false); setShowSendPanel(false) }}
          onPersonClick={(pid) => setPersonModalId(pid)}
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
