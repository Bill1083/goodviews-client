import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  searchMovies,
  searchPeople,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../../services/apiClient'
import MovieSearchBar from './MovieSearchBar'
import MovieCard from '../../components/MovieCard'
import MovieDetailModal from '../../components/MovieDetailModal'
import SendToFriendsPanel from '../../components/SendToFriendsPanel'
import PersonModal from '../../components/PersonModal'
import ReviewModal from '../reviews/ReviewModal'
import type { Movie, PersonSearchResult } from '../../types'

type SearchTab = 'movies' | 'people'

const TMDB_PROFILE_IMG = 'https://image.tmdb.org/t/p/w185'

// ─── People search result card ────────────────────────────────────────────────
function PersonCard({ person, onClick }: { person: PersonSearchResult; onClick: () => void }) {
  const profileUrl = person.profile_path ? `${TMDB_PROFILE_IMG}${person.profile_path}` : null
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-navy-card/40 p-3 hover:border-magenta/40 hover:bg-navy-card/70 transition-all text-center"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-white/10 bg-navy-card/60 group-hover:border-magenta/40 transition-colors">
        {profileUrl ? (
          <img src={profileUrl} alt={person.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-muted text-lg font-semibold">
            {person.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 w-full">
        <p className="text-xs font-semibold text-gray-lighter leading-tight line-clamp-2 group-hover:text-magenta transition-colors">
          {person.name}
        </p>
        {person.known_for_department && (
          <p className="text-[10px] text-gray-muted">{person.known_for_department}</p>
        )}
      </div>
    </button>
  )
}

// ─── Selected movie overlay (search result opened) ────────────────────────────
function SearchMovieModal({
  movie,
  onClose,
  inWatchlist,
  onAddWatchlist,
  onRemoveWatchlist,
  onPersonClick,
}: {
  movie: Movie
  onClose: () => void
  inWatchlist: boolean
  onAddWatchlist: () => void
  onRemoveWatchlist: () => void
  onPersonClick: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showSendPanel, setShowSendPanel] = useState(false)

  return (
    <>
      <MovieDetailModal
        movie={movie}
        onClose={onClose}
        onPersonClick={onPersonClick}
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
      />

      {showReviewModal && (
        <ReviewModal movie={movie} mode="create" onClose={() => setShowReviewModal(false)} />
      )}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SearchPage() {
  const qc = useQueryClient()

  const [searchTab, setSearchTab] = useState<SearchTab>('movies')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [personQuery, setPersonQuery] = useState('')
  const [personPage, setPersonPage] = useState(1)
  const [personModalId, setPersonModalId] = useState<number | null>(null)

  // ── Queries ───────────────────────────────────────────────────────────────
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

  // ── Watchlist mutations ───────────────────────────────────────────────────
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

  const watchlistIds = new Set(watchlist.map((w) => w.movie_id))

  // ── Navigation helpers ────────────────────────────────────────────────────
  const pendingQueryRef = useRef<string | null>(null)

  const handleSearch = (q: string) => {
    if (isFetching) { pendingQueryRef.current = q; return }
    pendingQueryRef.current = null
    setQuery(q); setPage(1)
  }

  // Fire the pending search once the current fetch finishes
  useEffect(() => {
    if (!isFetching && pendingQueryRef.current) {
      const q = pendingQueryRef.current
      pendingQueryRef.current = null
      setQuery(q); setPage(1)
    }
  }, [isFetching])

  const activeIsFetching = searchTab === 'movies' ? isFetching : peopleFetching

  return (
    <>
      <main
        style={{ opacity: activeIsFetching ? 0.7 : 1, pointerEvents: activeIsFetching ? 'none' : 'auto' }}
        className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12"
      >
        {/* Icon + title row */}
        <div className="flex items-center gap-5">
          <svg width="64" height="65" viewBox="1305 2944 64 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1334.3333740234375,2960.25C1341.697265625,2960.25,1347.6666259765625,2966.312744140625,1347.6666259765625,2973.791748046875M1349.4232177734375,2989.106689453125L1361,3000.875M1355.6666259765625,2973.791748046875C1355.6666259765625,2985.757568359375,1346.115234375,2995.458251953125,1334.3333740234375,2995.458251953125C1322.5513916015625,2995.458251953125,1313,2985.757568359375,1313,2973.791748046875C1313,2961.82568359375,1322.5513916015625,2952.125,1334.3333740234375,2952.125C1346.115234375,2952.125,1355.6666259765625,2961.82568359375,1355.6666259765625,2973.791748046875Z"
              strokeLinecap="round" strokeLinejoin="round" stroke="white" strokeWidth="2"
            />
          </svg>
          <span style={{ fontFamily: '"Source Sans 3", sans-serif', fontSize: 30, color: 'white', fontWeight: 400 }}>
            Search
          </span>
        </div>

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

        {/* Search bar */}
        <div className="w-full">
          {searchTab === 'movies' ? (
            <MovieSearchBar onSearch={handleSearch} isLoading={isFetching} />
          ) : (
            <MovieSearchBar
              onSearch={(q) => { setPersonQuery(q); setPersonPage(1) }}
              isLoading={peopleFetching}
              placeholder="Search actors, directors…"
            />
          )}
        </div>

        {/* Movie results */}
        {searchTab === 'movies' && (
          <>
            {isError && <p className="text-sm text-red-400">Something went wrong. Please try again.</p>}

            {data && data.results.length > 0 && (
              <>
                <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
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

            {!query && !isFetching && (
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
                <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
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

            {!personQuery && !peopleFetching && (
              <p className="text-sm text-gray-muted">Type at least 2 characters to search for actors and directors.</p>
            )}
          </>
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
