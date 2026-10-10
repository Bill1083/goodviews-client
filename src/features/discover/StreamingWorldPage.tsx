import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStreamingProviders, getStreamingWorld, type StreamingWorld } from '../../services/apiClient'
import { useWatchlistMutations } from '../../hooks/useWatchlistMutations'
import MovieCard from '../../components/MovieCard'
import MovieDetailModal from '../../components/MovieDetailModal'
import PaginationControls from '../../components/PaginationControls'
import SendToFriendsPanel from '../../components/SendToFriendsPanel'
import PersonModal from '../../components/PersonModal'
import ReviewModal from '../reviews/ReviewModal'
import { themeFor } from './streamingServiceThemes'
import type { Movie, StreamingProvider } from '../../types'

const TMDB_LOGO = 'https://image.tmdb.org/t/p/w185'
const PAGE_SIZE = 10

type Tab = keyof StreamingWorld

const TABS: Array<{ key: Tab; label: string; subtitle: string }> = [
  { key: 'popular', label: 'Popular', subtitle: 'What everyone is watching on this service right now' },
  { key: 'for_you', label: 'For You', subtitle: 'Matches your taste, only on this service' },
  { key: 'different', label: 'Different', subtitle: 'A bit of a stretch from your usual — still worth a look' },
]

function MovieGridSkeleton() {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-navy-card/60" />
          <div className="mx-auto mt-2 h-3 w-2/3 animate-pulse rounded bg-navy-card/60" />
        </div>
      ))}
    </div>
  )
}

export default function StreamingWorldPage() {
  const navigate = useNavigate()
  const { providerId: providerIdParam } = useParams()
  const providerId = Number(providerIdParam)

  const [activeTab, setActiveTab] = useState<Tab>('popular')
  const [page, setPage] = useState(1)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [personModalId, setPersonModalId] = useState<number | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showSendPanel, setShowSendPanel] = useState(false)

  // The catalog itself barely changes — same cache SettingsPanel's provider
  // picker already warms, so arriving here via a Discover tile is usually
  // an instant lookup rather than a fresh fetch.
  const { data: providers } = useQuery({
    queryKey: ['streaming-providers'],
    queryFn: () => getStreamingProviders(),
    staleTime: 1000 * 60 * 60 * 24,
  })
  const provider: StreamingProvider | undefined = useMemo(
    () => providers?.find((p) => p.provider_id === providerId),
    [providers, providerId],
  )
  const theme = themeFor(provider?.provider_name ?? '')

  const { data: world, isLoading, isError } = useQuery({
    queryKey: ['movies', 'streaming-world', providerId],
    queryFn: ({ signal }) => getStreamingWorld(providerId, signal),
    enabled: Number.isFinite(providerId) && providerId > 0,
    staleTime: 1000 * 60 * 15,
  })

  const { watchlistIds, addMutation: watchlistAddMutation, removeMutation: watchlistRemoveMutation } = useWatchlistMutations()

  // Same as DiscoverListPage's own pagination — otherwise "Next" leaves the
  // reader scrolled wherever they were on the previous page, looking at the
  // middle of a grid that just changed under them.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [page])

  const activeMovies = world?.[activeTab] ?? []
  const totalPages = Math.max(1, Math.ceil(activeMovies.length / PAGE_SIZE))
  const pageMovies = activeMovies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectTab = (tab: Tab) => {
    setActiveTab(tab)
    setPage(1)
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 2xl:max-w-[1600px]">
        {/* Hero — themed to the service, same shape as the Popular/For You banner */}
        <div
          className="relative h-48 w-full overflow-hidden rounded-card border border-white/10 sm:h-56"
          style={{ background: `radial-gradient(circle at 15% 30%, ${theme.color} 0%, ${theme.shade} 70%)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/25 to-transparent" />

          <button
            onClick={() => navigate('/')}
            className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white sm:left-6 sm:top-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Discover
          </button>

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/95 shadow-xl sm:h-16 sm:w-16">
              {provider?.logo_path ? (
                <img src={`${TMDB_LOGO}${provider.logo_path}`} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-navy">{provider?.provider_name?.[0] ?? '?'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70 sm:text-sm">Streaming World</p>
              <h1
                style={{ fontFamily: '"Source Sans 3", sans-serif' }}
                className="mt-1 truncate text-2xl font-bold text-white drop-shadow-md sm:text-4xl"
              >
                {provider?.provider_name ?? 'Loading…'}
              </h1>
            </div>
          </div>
        </div>

        {isError && <p className="text-sm text-red-400">Something went wrong loading this service's films. Please try again.</p>}

        {/* Tab switcher — same segmented-control style as Discover's Movies/People tabs */}
        <div className="flex rounded-xl border border-white/10 bg-navy-card/30 p-1 gap-1 self-center">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => selectTab(key)}
              className={['px-5 py-2 rounded-lg text-sm font-medium transition-all', activeTab === key ? 'bg-navy-card text-gray-lighter shadow' : 'text-gray-muted hover:text-gray-lighter'].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="flex w-full flex-col gap-6">
          <p className="text-center text-sm text-gray-muted">{TABS.find((t) => t.key === activeTab)?.subtitle}</p>

          {isLoading ? (
            <MovieGridSkeleton />
          ) : activeMovies.length === 0 ? (
            <p className="text-center text-sm text-gray-muted">Nothing here yet — check back soon.</p>
          ) : (
            <>
              {totalPages > 1 && <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />}

              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {pageMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={setSelectedMovie}
                    isInWatchlist={watchlistIds.has(movie.id)}
                    onWatchlistAdd={(m) => watchlistAddMutation.mutate(m)}
                    onWatchlistRemove={(m) => watchlistRemoveMutation.mutate(m)}
                  />
                ))}
              </div>

              {totalPages > 1 && <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />}
            </>
          )}
        </section>
      </main>

      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => { setSelectedMovie(null); setShowReviewModal(false); setShowSendPanel(false) }}
          onPersonClick={(pid) => setPersonModalId(pid)}
          onSelectMovie={setSelectedMovie}
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
