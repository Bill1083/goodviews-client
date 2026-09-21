import { useEffect, useMemo, useRef, useState } from 'react'
import { invalidateTasteStats } from '../../utils/tasteStatsCache'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTrendingMovies,
  getForYouMovies,
  getPicksOfTheWeek,
  markNotInterested,
  type NotInterestedScope,
  searchMovies,
  searchPeople,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../../services/apiClient'
import MovieSearchBar from '../movies/MovieSearchBar'
import MovieCarousel from './MovieCarousel'
import PicksOfTheWeek from './PicksOfTheWeek'
import MovieCard from '../../components/MovieCard'
import MovieDetailModal from '../../components/MovieDetailModal'
import SendToFriendsPanel from '../../components/SendToFriendsPanel'
import PersonModal from '../../components/PersonModal'
import PersonCard from '../../components/PersonCard'
import ReviewModal from '../reviews/ReviewModal'
import { dropFromForYouFeed, fillForYouSlot, refreshForYouFeed } from '../../utils/forYouCache'
import type { Movie } from '../../types'

type SearchTab = 'movies' | 'people'

// ─── Icons ──────────────────────────────────────────────────────────────────
function CompassIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.6" />
      <path
        d="M15.5 8.5l-2.2 5.2a1 1 0 01-.6.6l-4.2 1.7 2.2-5.2a1 1 0 01.6-.6l4.2-1.7z"
        fill="white" fillOpacity="0.9"
      />
    </svg>
  )
}

function SearchGlassIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="1.8" />
      <path d="M20 20l-4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6l12 12M18 6L6 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// ─── Section header ("View All" link) ──────────────────────────────────────
function SectionHeader({ title, subtitle, onViewAll }: { title: string; subtitle: string; onViewAll: () => void }) {
  return (
    <button
      onClick={onViewAll}
      className="group flex w-full items-start justify-between gap-2 text-left"
    >
      <div>
        <h2 style={{ fontFamily: '"Source Sans 3", sans-serif' }} className="text-lg font-bold text-gray-lighter sm:text-xl">
          {title}
        </h2>
        <p className="text-sm text-gray-muted">{subtitle}</p>
      </div>
      <span className="mt-1 flex shrink-0 items-center gap-1 text-xs font-medium text-teal opacity-80 transition-opacity group-hover:opacity-100">
        View All
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}

function CarouselSkeleton({ caption }: { caption?: string }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3">
      <div className="flex h-48 w-full items-center justify-center gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-[2/3] h-40 animate-pulse rounded-card bg-navy-card/60"
            style={{ opacity: i === 1 ? 1 : 0.5 }}
          />
        ))}
      </div>
      {caption && <p className="text-sm text-gray-muted">{caption}</p>}
    </div>
  )
}

// ─── Selected movie overlay (search result opened) ─────────────────────────
function SearchMovieModal({
  movie,
  onClose,
  inWatchlist,
  onAddWatchlist,
  onRemoveWatchlist,
  onPersonClick,
  forYouReason,
  onNotInterested,
}: {
  movie: Movie
  onClose: () => void
  inWatchlist: boolean
  onAddWatchlist: () => void
  onRemoveWatchlist: () => void
  onPersonClick: (personId: number, name: string, type: 'actor' | 'director') => void
  forYouReason?: string | null
  onNotInterested?: (scope: NotInterestedScope) => void
}) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showSendPanel, setShowSendPanel] = useState(false)

  return (
    <>
      <MovieDetailModal
        movie={movie}
        onClose={onClose}
        onPersonClick={onPersonClick}
        forYouReason={forYouReason}
        extraContent={
          showSendPanel ? (
            <SendToFriendsPanel movie={movie} onCancel={() => setShowSendPanel(false)} onSent={() => setShowSendPanel(false)} />
          ) : undefined
        }
        actions={[
          {
            key: 'watchlist',
            label: inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist',
            variant: inWatchlist ? 'teal' : 'outline',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {inWatchlist ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                )}
              </svg>
            ),
            onClick: () => (inWatchlist ? onRemoveWatchlist() : onAddWatchlist()),
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
        onNotInterested={onNotInterested}
      />

      {showReviewModal && (
        <ReviewModal movie={movie} mode="create" onClose={() => setShowReviewModal(false)} />
      )}
    </>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  // Browse data
  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => getTrendingMovies(1),
    staleTime: 1000 * 60 * 30,
  })
  const { data: forYou, isLoading: forYouLoading } = useQuery({
    queryKey: ['movies', 'for-you'],
    queryFn: ({ signal }) => getForYouMovies(signal),
    staleTime: 1000 * 60 * 30,
  })
  const forYouReasonById = useMemo(() => {
    const map: Record<number, string> = {}
    for (const m of forYou?.results ?? []) map[m.id] = m.reason
    return map
  }, [forYou])

  const { data: picks, isLoading: picksLoading } = useQuery({
    queryKey: ['movies', 'picks-of-the-week'],
    queryFn: ({ signal }) => getPicksOfTheWeek(signal),
    staleTime: 1000 * 60 * 60, // server-side TTL is 7 days; this is just the client cache
  })
  const picksReasonById = useMemo(() => {
    const map: Record<number, string> = {}
    for (const m of picks?.results ?? []) map[m.id] = m.reason
    return map
  }, [picks])

  const notInterestedMutation = useMutation({
    mutationFn: ({ movieId, scope }: { movieId: number; scope: NotInterestedScope }) => markNotInterested(movieId, scope),
    // Drop the card on tap rather than after the round-trip; the server's
    // replacement pick fills the freed slot once it arrives.
    onMutate: ({ movieId }) => {
      setSelectedMovie(null)
      return { dropped: dropFromForYouFeed(qc, movieId) }
    },
    onSuccess: (data, _vars, context) => {
      if (context?.dropped) fillForYouSlot(qc, data.replacement)
    },
    onError: () => refreshForYouFeed(qc),
  })

  // Search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchKey, setSearchKey] = useState(0)
  const [hasTyped, setHasTyped] = useState(false)
  const [searchTab, setSearchTab] = useState<SearchTab>('movies')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [personQuery, setPersonQuery] = useState('')
  const [personPage, setPersonPage] = useState(1)

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [personModalId, setPersonModalId] = useState<number | null>(null)

  const { data, isFetching, isError } = useQuery({
    queryKey: ['movies', 'search', query, page],
    queryFn: ({ signal }) => searchMovies(query, page, signal),
    enabled: query.length >= 2 && searchTab === 'movies',
    staleTime: 1000 * 60 * 5,
  })

  const { data: peopleData, isFetching: peopleFetching, isError: peopleError } = useQuery({
    queryKey: ['people', 'search', personQuery, personPage],
    queryFn: ({ signal }) => searchPeople(personQuery, personPage, signal),
    enabled: personQuery.length >= 2 && searchTab === 'people',
    staleTime: 1000 * 60 * 5,
  })

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
  })

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlist'] }); invalidateTasteStats(qc) },
  })

  const watchlistRemoveMutation = useMutation({
    mutationFn: (movie: Movie) => removeFromWatchlist(movie.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlist'] }); invalidateTasteStats(qc) },
  })

  const watchlistIds = new Set(watchlist.map((w) => w.movie_id))

  const pendingQueryRef = useRef<string | null>(null)

  const handleSearch = (q: string) => {
    if (searchTab === 'people') {
      setPersonQuery(q)
      setPersonPage(1)
      return
    }
    if (isFetching) { pendingQueryRef.current = q; return }
    pendingQueryRef.current = null
    setQuery(q); setPage(1)
  }

  useEffect(() => {
    if (!isFetching && pendingQueryRef.current) {
      const q = pendingQueryRef.current
      pendingQueryRef.current = null
      setQuery(q); setPage(1)
    }
  }, [isFetching])

  const openSearch = () => {
    setSearchOpen(true)
    setSearchTab('movies')
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setHasTyped(false)
    setQuery(''); setPage(1)
    setPersonQuery(''); setPersonPage(1)
    setSearchKey((k) => k + 1)
  }

  const activeIsFetching = searchTab === 'movies' ? isFetching : peopleFetching

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 xl:max-w-6xl xl:gap-3 xl:pt-6 xl:pb-4 2xl:max-w-[1600px]">
        {/* Top bar: title / search toggle */}
        <div className="flex w-full items-center gap-4">
          {!searchOpen ? (
            <>
              <div className="flex flex-1 items-center gap-3">
                <CompassIcon />
                <span style={{ fontFamily: '"Source Sans 3", sans-serif', fontSize: 30 }} className="font-normal text-white">
                  Discover
                </span>
              </div>
              <button
                onClick={openSearch}
                aria-label="Search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-navy-card/50 transition-colors hover:border-teal/50 hover:bg-navy-card/80"
              >
                <SearchGlassIcon />
              </button>
            </>
          ) : (
            <div className="search-ease-in flex w-full items-center gap-4">
              <div
                className={[
                  'transition-all duration-500 ease-out',
                  hasTyped ? 'flex-1 max-w-full' : 'flex-1 max-w-[220px] sm:max-w-xs',
                ].join(' ')}
              >
                <MovieSearchBar
                  key={searchKey}
                  onSearch={handleSearch}
                  onTyping={(raw) => setHasTyped(raw.length > 0)}
                  isLoading={activeIsFetching}
                  placeholder={searchTab === 'movies' ? 'Search movies…' : 'Search actors, directors…'}
                />
              </div>
              <button
                onClick={closeSearch}
                aria-label="Close search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-navy-card/50 transition-colors hover:border-magenta/50 hover:bg-navy-card/80"
              >
                <CloseIcon />
              </button>
            </div>
          )}
        </div>

        {/* Browsing view — one full-width column below xl:. From xl: up,
            Picks and the carousels split the page evenly, with the row
            given a *minimum* height matching the viewport (Picks fills its
            half exactly via flex fractions — see PicksOfTheWeek). Carousels
            still size their own posters off width alone (capped at a
            handful visible, not a skinny strip of many), so on a generous
            screen everything just fits the floor exactly, while a shorter
            one lets their natural height grow the row past it — a small
            scroll rather than squeezing the posters down to fit. */}
        {!hasTyped && (
          <div className="grid w-full grid-cols-1 gap-10 xl:min-h-[calc(100dvh-164px)] xl:grid-cols-2 xl:items-start xl:gap-8">
            <PicksOfTheWeek movies={picks?.results ?? []} isLoading={picksLoading} onSelect={setSelectedMovie} />

            <div className="flex w-full flex-col gap-10 xl:h-full xl:min-h-0">
              <section className="flex w-full flex-col gap-3 xl:min-h-0 xl:flex-1">
                <SectionHeader title="Most Popular This Week" subtitle="What everyone's watching right now" onViewAll={() => navigate('/discover/popular')} />
                {trendingLoading ? (
                  <CarouselSkeleton />
                ) : (
                  <MovieCarousel
                    movies={trending?.results ?? []}
                    onOpenAll={() => navigate('/discover/popular')}
                    onSelectMovie={setSelectedMovie}
                  />
                )}
              </section>

              <section className="flex w-full flex-col gap-3 xl:min-h-0 xl:flex-1">
                <SectionHeader title="For You" subtitle="Picks based on your taste and friends" onViewAll={() => navigate('/discover/for-you')} />
                {forYouLoading ? (
                  <CarouselSkeleton caption="Hold tight while we find movies that fit your preferences!" />
                ) : (
                  <MovieCarousel
                    movies={forYou?.results ?? []}
                    onOpenAll={() => navigate('/discover/for-you')}
                    onSelectMovie={setSelectedMovie}
                  />
                )}
              </section>
            </div>
          </div>
        )}

        {/* Search view */}
        {hasTyped && (
          <div
            style={{ opacity: activeIsFetching ? 0.7 : 1, pointerEvents: activeIsFetching ? 'none' : 'auto' }}
            className="flex w-full flex-col items-center gap-6 sm:gap-8"
          >
            {/* Tab switcher */}
            <div className="flex rounded-xl border border-white/10 bg-navy-card/30 p-1 gap-1 self-center">
              <button
                onClick={() => setSearchTab('movies')}
                className={['px-5 py-2 rounded-lg text-sm font-medium transition-all', searchTab === 'movies' ? 'bg-navy-card text-gray-lighter shadow' : 'text-gray-muted hover:text-gray-lighter'].join(' ')}
              >
                Movies
              </button>
              <button
                onClick={() => setSearchTab('people')}
                className={['px-5 py-2 rounded-lg text-sm font-medium transition-all', searchTab === 'people' ? 'bg-navy-card text-gray-lighter shadow' : 'text-gray-muted hover:text-gray-lighter'].join(' ')}
              >
                People
              </button>
            </div>

            {/* Movie results */}
            {searchTab === 'movies' && (
              <>
                {isError && <p className="text-sm text-red-400">Something went wrong. Please try again.</p>}

                {data && data.results.length > 0 && (
                  <>
                    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                      {data.results.map((movie) => (
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

                    {data.total_pages > 1 && (
                      <div className="flex items-center gap-4">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">← Prev</button>
                        <span className="text-sm text-gray-muted">Page {page} of {data.total_pages}</span>
                        <button onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">Next →</button>
                      </div>
                    )}
                  </>
                )}

                {query.length < 2 && !isFetching && (
                  <p className="text-sm text-gray-muted">Type at least 2 characters to search for movies.</p>
                )}
              </>
            )}

            {/* People results */}
            {searchTab === 'people' && (
              <>
                {peopleError && <p className="text-sm text-red-400">Something went wrong. Please try again.</p>}

                {peopleData && peopleData.results.length > 0 && (
                  <>
                    <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-9">
                      {peopleData.results.map((person) => (
                        <PersonCard
                          key={person.id}
                          person={person}
                          onClick={() => setPersonModalId(person.id)}
                        />
                      ))}
                    </div>

                    {peopleData.total_pages > 1 && (
                      <div className="flex items-center gap-4">
                        <button onClick={() => setPersonPage((p) => Math.max(1, p - 1))} disabled={personPage === 1} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">← Prev</button>
                        <span className="text-sm text-gray-muted">Page {personPage} of {peopleData.total_pages}</span>
                        <button onClick={() => setPersonPage((p) => Math.min(peopleData.total_pages, p + 1))} disabled={personPage === peopleData.total_pages} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">Next →</button>
                      </div>
                    )}
                  </>
                )}

                {personQuery.length < 2 && !peopleFetching && (
                  <p className="text-sm text-gray-muted">Type at least 2 characters to search for actors and directors.</p>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {selectedMovie && (
        <SearchMovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          inWatchlist={watchlistIds.has(selectedMovie.id)}
          onAddWatchlist={() => watchlistAddMutation.mutate(selectedMovie)}
          onRemoveWatchlist={() => watchlistRemoveMutation.mutate(selectedMovie)}
          onPersonClick={(pid) => setPersonModalId(pid)}
          forYouReason={
            forYouReasonById[selectedMovie.id] ??
            (picksReasonById[selectedMovie.id] ? `Pick of the Week — ${picksReasonById[selectedMovie.id]}` : undefined)
          }
          onNotInterested={
            forYouReasonById[selectedMovie.id]
              ? (scope) => notInterestedMutation.mutate({ movieId: selectedMovie.id, scope })
              : undefined
          }
        />
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
