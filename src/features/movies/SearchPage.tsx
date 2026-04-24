import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  searchMovies,
  createReview,
  getMovieReviews,
  getMyCategories,
  getMyFriends,
  getMyFriendGroups,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  recommendMovie,
} from '../../services/apiClient'
import MovieSearchBar from './MovieSearchBar'
import StarRating from '../../components/StarRating'
import MovieCard from '../../components/MovieCard'
import type { Movie, FriendProfile, FriendGroup } from '../../types'

type Step = 'search' | 'overview' | 'rate' | 'share' | 'send'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const FALLBACK_IMG = 'https://via.placeholder.com/342x513?text=No+Poster'

// ─── Friends/Groups picker (shared between share + send steps) ────────────────
function FriendGroupsPicker({
  friends,
  groups,
  selectedFriendIds,
  selectedGroupIds,
  friendSearch,
  onFriendSearchChange,
  onToggleFriend,
  onToggleGroup,
}: {
  friends: FriendProfile[]
  groups: FriendGroup[]
  selectedFriendIds: string[]
  selectedGroupIds: string[]
  friendSearch: string
  onFriendSearchChange: (v: string) => void
  onToggleFriend: (id: string) => void
  onToggleGroup: (id: string) => void
}) {
  const filtered = friends.filter((f) =>
    f.username.toLowerCase().includes(friendSearch.toLowerCase()),
  )
  const selectedFriends = friends.filter((f) => selectedFriendIds.includes(f.id))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-lighter">Send to a Friend to watch</p>
      <div className="flex gap-3">
        {/* Friends list */}
        <div className="flex flex-col gap-1.5 w-44 shrink-0">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Friends List</p>
          <input
            type="text"
            placeholder="Search…"
            className="input-base text-xs py-1.5"
            value={friendSearch}
            onChange={(e) => onFriendSearchChange(e.target.value)}
          />
          <ul className="flex flex-col divide-y divide-white/5 max-h-36 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="py-2 text-xs text-gray-muted italic">No friends yet.</li>
            ) : (
              filtered.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-light truncate max-w-[90px]">{f.username}</span>
                  <button
                    type="button"
                    disabled={selectedFriendIds.includes(f.id)}
                    onClick={() => onToggleFriend(f.id)}
                    className="text-gray-muted hover:text-teal transition-colors disabled:opacity-30 ml-1"
                    title="Add to send list"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Send to list */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Send to:</p>
          <ul className="flex flex-col divide-y divide-white/5 min-h-[3rem]">
            {selectedFriends.length === 0 ? (
              <li className="py-2 text-xs text-gray-muted italic">None selected.</li>
            ) : (
              selectedFriends.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-light truncate max-w-[90px]">{f.username}</span>
                  <button
                    type="button"
                    onClick={() => onToggleFriend(f.id)}
                    className="text-gray-muted hover:text-red-400 transition-colors ml-1"
                    title="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Friend Groups */}
        {groups.length > 0 && (
          <div className="flex flex-col gap-1.5 w-36 shrink-0">
            <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Friend Groups</p>
            <div className="flex flex-col gap-1.5">
              {groups.map((grp) => {
                const isSelected = selectedGroupIds.includes(grp.id)
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => onToggleGroup(grp.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all text-left"
                    style={{
                      border: `2px solid ${grp.outline_color ?? 'rgba(255,255,255,0.3)'}`,
                      backgroundColor: isSelected
                        ? (grp.fill_color ?? grp.outline_color ?? 'rgba(255,255,255,0.15)')
                        : 'transparent',
                      color: '#e9e9e9',
                      opacity: isSelected ? 1 : 0.7,
                    }}
                  >
                    {grp.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SearchPage() {
  const qc = useQueryClient()

  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  // Rate step state
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')

  // Share step state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [friendSearch, setFriendSearch] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Send step state (recommend without review)
  const [sendFriendIds, setSendFriendIds] = useState<string[]>([])
  const [sendGroupIds, setSendGroupIds] = useState<string[]>([])
  const [sendFriendSearch, setSendFriendSearch] = useState('')
  const [sendDone, setSendDone] = useState(false)

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data, isFetching, isError } = useQuery({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => searchMovies(query, page),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  })

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
  })

  const { data: movieReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['movie-reviews', selectedMovie?.id],
    queryFn: () => getMovieReviews(selectedMovie!.id),
    enabled: !!selectedMovie && step === 'overview',
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getMyCategories,
  })

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: getMyFriends,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['friend-groups'],
    queryFn: getMyFriendGroups,
  })

  // ── Watchlist mutations ───────────────────────────────────────────────────
  const watchlistAddMutation = useMutation({
    mutationFn: (movie: Movie) =>
      addToWatchlist({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const watchlistRemoveMutation = useMutation({
    mutationFn: (movie: Movie) => removeFromWatchlist(movie.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const watchlistIds = new Set(watchlist.map((w) => w.movie_id))

  // ── Review mutation ───────────────────────────────────────────────────────
  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () =>
      createReview({
        movie_id: selectedMovie!.id,
        title: selectedMovie!.title,
        poster_path: selectedMovie!.poster_path,
        release_date: selectedMovie!.release_date,
        rating,
        review_text: reviewText,
        category_id: selectedCategoryId || null,
        group_ids: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
        friend_ids: selectedFriendIds.length > 0 ? selectedFriendIds : undefined,
      }),
    onSuccess: () => {
      setSubmitted(true)
      qc.invalidateQueries({ queryKey: ['my-reviews'] })
      qc.invalidateQueries({ queryKey: ['movie-reviews', selectedMovie?.id] })
    },
    onError: () => setSubmitError('Failed to submit review. Please try again.'),
  })

  // ── Send recommendation mutation ──────────────────────────────────────────
  const { mutate: sendRecommendation, isPending: sendPending } = useMutation({
    mutationFn: () =>
      recommendMovie({
        movie_id: selectedMovie!.id,
        title: selectedMovie!.title,
        poster_path: selectedMovie!.poster_path,
        release_date: selectedMovie!.release_date,
        friend_ids: sendFriendIds,
        group_ids: sendGroupIds,
      }),
    onSuccess: () => setSendDone(true),
  })

  // ── Navigation helpers ────────────────────────────────────────────────────
  const handleSearch = (q: string) => { setQuery(q); setPage(1) }

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie)
    setStep('overview')
  }

  const handleWriteReview = () => {
    setRating(0)
    setReviewText('')
    setStep('rate')
  }

  const handleSendFromOverview = () => {
    setSendFriendIds([])
    setSendGroupIds([])
    setSendFriendSearch('')
    setSendDone(false)
    setStep('send')
  }

  const handleBack = () => {
    if (step === 'share') { setStep('rate'); return }
    if (step === 'rate') { setStep('overview'); return }
    if (step === 'send') { setStep('overview'); return }
    setStep('search')
    setSelectedMovie(null)
  }

  const handleReset = () => {
    setStep('search')
    setSelectedMovie(null)
    setQuery('')
    setRating(0)
    setReviewText('')
    setSelectedCategoryId('')
    setSelectedFriendIds([])
    setSelectedGroupIds([])
    setFriendSearch('')
    setSubmitted(false)
    setSubmitError(null)
    setSendDone(false)
  }

  const toggleFriend = (id: string) =>
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    )
  const toggleGroup = (id: string) =>
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  const toggleSendFriend = (id: string) =>
    setSendFriendIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    )
  const toggleSendGroup = (id: string) =>
    setSendGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )

  // ── Step: search ──────────────────────────────────────────────────────────
  if (step === 'search') {
    return (
      <main
        style={{ opacity: isFetching ? 0.5 : 1, pointerEvents: isFetching ? 'none' : 'auto' }}
        className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-12"
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
            Search for a movie
          </span>
        </div>

        <div className="w-full">
          <MovieSearchBar onSearch={handleSearch} isLoading={isFetching} />
        </div>

        {isError && (
          <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
        )}

        {data && data.results.length > 0 && (
          <>
            <div className="grid w-full grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-5">
              {data.results.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={handleSelectMovie}
                  isInWatchlist={watchlistIds.has(movie.id)}
                  onWatchlistAdd={(m) => watchlistAddMutation.mutate(m)}
                  onWatchlistRemove={(m) => watchlistRemoveMutation.mutate(m)}
                />
              ))}
            </div>

            {data.total_pages > 1 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-muted">
                  Page {page} of {data.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
                  className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {!query && !isFetching && (
          <p className="text-sm text-gray-muted">Type at least 2 characters to search for movies.</p>
        )}
      </main>
    )
  }

  // ── Shared left poster panel (overview / rate / share / send) ─────────────
  const posterUrl = selectedMovie?.poster_path
    ? `${TMDB_IMG}${selectedMovie.poster_path}`
    : FALLBACK_IMG

  // ── Step: overview ────────────────────────────────────────────────────────
  if (step === 'overview') {
    const myReview = movieReviews?.my_review
    const friendReviews = movieReviews?.friend_reviews ?? []
    const avgRating = movieReviews?.avg_friend_rating ?? null

    return (
      <main className="mx-auto flex max-w-5xl items-stretch gap-0 rounded-2xl overflow-hidden shadow-2xl my-8">
        {/* Left — poster */}
        <div className="w-64 shrink-0 bg-navy-card relative">
          <img src={posterUrl} alt={`${selectedMovie?.title} poster`} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3">
            <p className="text-sm font-bold text-white leading-tight">{selectedMovie?.title}</p>
          </div>
        </div>

        {/* Right — overview */}
        <div className="flex flex-1 flex-col gap-5 bg-navy-wine/90 p-8 overflow-y-auto max-h-[80vh]">
          <button onClick={handleBack} className="self-start text-xs text-gray-muted hover:text-gray-lighter transition-colors">
            ← Back
          </button>

          <h2 className="text-2xl font-bold text-gray-lighter text-center">{selectedMovie?.title}</h2>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-muted">Loading…</span>
            </div>
          ) : (
            <>
              {/* User rating row */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-lighter">Your Rating:</p>
                  {myReview ? (
                    <div className="flex items-center gap-2">
                      <StarRating value={myReview.rating} readOnly size="sm" />
                      <span className="text-xs text-gray-muted">{myReview.rating}/5 Stars</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-muted italic">No Review</span>
                      <span className="text-xs text-gray-muted">-- Stars</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleWriteReview}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-card/80 border border-white/15 text-sm text-gray-lighter hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  Write a Review
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>

              {/* Friends avg rating row */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-lighter">Avg Rating Between Friends:</p>
                  {avgRating !== null ? (
                    <div className="flex items-center gap-2">
                      <StarRating value={Math.round(avgRating)} readOnly size="sm" accentColor="text-yellow-400" />
                      <span className="text-xs text-gray-muted">{avgRating}/5 Stars</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-muted italic">No Reviews</span>
                      <span className="text-xs text-gray-muted">-- Stars</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSendFromOverview}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-magenta text-sm font-semibold text-white hover:bg-magenta/90 active:scale-95 transition-all whitespace-nowrap"
                >
                  Send To Friends
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h15" />
                  </svg>
                </button>
              </div>

              {/* Friend reviews */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-lighter">Reviews:</p>
                {friendReviews.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <p className="text-sm text-gray-muted">No Reviews For this Movie</p>
                    <p className="text-xs text-gray-muted/70">Leave your own and send to a friend!</p>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={handleWriteReview}
                        className="px-4 py-2 rounded-lg bg-navy-card/80 border border-white/15 text-sm text-gray-lighter hover:bg-white/10 transition-colors"
                      >
                        Write a Review
                      </button>
                      <button
                        onClick={handleSendFromOverview}
                        className="px-4 py-2 rounded-lg bg-magenta text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
                      >
                        Send To Friends
                      </button>
                    </div>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-4">
                    {friendReviews.map((rev) => (
                      <li
                        key={rev.id}
                        className="flex flex-col gap-1.5 border-b border-white/8 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="h-8 w-8 rounded-full bg-navy-card/60 border border-white/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-gray-lighter">
                              {rev.profiles?.username?.slice(0, 2).toUpperCase() ?? '??'}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-lighter">
                            {rev.profiles?.username ?? 'Unknown'}
                          </span>
                          <StarRating value={rev.rating} readOnly size="sm" accentColor="text-yellow-400" />
                          <span className="ml-auto text-xs text-gray-muted">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {rev.review_text && (
                          <p className="text-sm text-gray-light/70 leading-relaxed ml-10">
                            {rev.review_text}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    )
  }

  // ── Steps rate / share / send — shared poster layout ──────────────────────
  return (
    <main className="mx-auto flex max-w-4xl items-stretch gap-0 rounded-2xl overflow-hidden shadow-2xl my-8">
      {/* Left — poster */}
      <div className="w-72 shrink-0 bg-navy-card">
        <img src={posterUrl} alt={`${selectedMovie?.title} poster`} className="h-full w-full object-cover" />
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col gap-5 bg-navy-wine/90 p-8 overflow-y-auto max-h-[80vh]">
        <button onClick={handleBack} className="self-start text-xs text-gray-muted hover:text-gray-lighter transition-colors">
          ← Back
        </button>

        <div>
          <h2 className="text-xl font-bold text-gray-lighter">{selectedMovie?.title}</h2>
          {selectedMovie?.release_date && (
            <p className="text-sm text-gray-muted">{selectedMovie.release_date.slice(0, 4)}</p>
          )}
        </div>

        {/* ── Step: rate ── */}
        {step === 'rate' && (
          <>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-lighter">Rate This Movie</h3>
              <p className="text-xs text-gray-muted">Click a star to rate</p>
              <div className="mt-2">
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-light/70 uppercase tracking-wide">
                Write a Review{' '}
                <span className="normal-case text-gray-muted">(optional)</span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={5}
                placeholder="Share your thoughts…"
                className="input-base resize-none"
                maxLength={2000}
              />
            </div>

            <button
              onClick={() => { if (rating > 0) { setSelectedCategoryId(''); setSelectedFriendIds([]); setSelectedGroupIds([]); setFriendSearch(''); setSubmitError(null); setSubmitted(false); setStep('share') } }}
              disabled={rating === 0}
              className="mt-auto mx-2 w-full rounded-lg bg-magenta py-2.5 text-sm font-semibold text-white
                        hover:bg-magenta/90 active:scale-95 transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </>
        )}

        {/* ── Step: share ── */}
        {step === 'share' && !submitted && (
          <>
            {/* Review summary */}
            <div className="flex flex-col gap-1.5 rounded-lg bg-white/5 px-4 py-3 border border-white/10">
              <div className="flex items-center gap-2">
                <StarRating value={rating} readOnly size="sm" />
                <span className="text-xs text-gray-muted">{rating}/5 Stars</span>
              </div>
              {reviewText && (
                <p className="text-xs text-gray-light/60 italic line-clamp-2">"{reviewText}"</p>
              )}
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">
                  Add to a Category{' '}
                  <span className="normal-case text-gray-muted/60">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(isSelected ? '' : cat.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          border: `2px solid ${cat.outline_color ?? 'rgba(255,255,255,0.3)'}`,
                          backgroundColor: isSelected
                            ? (cat.fill_color ?? cat.outline_color ?? 'rgba(255,255,255,0.15)')
                            : 'transparent',
                          color: '#e9e9e9',
                          opacity: isSelected ? 1 : 0.7,
                        }}
                      >
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Friends + groups picker */}
            <FriendGroupsPicker
              friends={friends}
              groups={groups}
              selectedFriendIds={selectedFriendIds}
              selectedGroupIds={selectedGroupIds}
              friendSearch={friendSearch}
              onFriendSearchChange={setFriendSearch}
              onToggleFriend={toggleFriend}
              onToggleGroup={toggleGroup}
            />

            {submitError && (
              <p className="rounded-md bg-red-900/30 border border-red-500/30 px-3 py-2 text-xs text-red-400">
                {submitError}
              </p>
            )}

            <button
              onClick={() => submitReview()}
              disabled={isPending}
              className="mt-auto w-full rounded-lg bg-magenta py-2.5 text-sm font-semibold text-white
                         hover:bg-magenta/90 active:scale-95 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Submitting…' : 'Submit Review'}
            </button>
          </>
        )}

        {/* ── Step: share — submitted ── */}
        {step === 'share' && submitted && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="text-4xl">🎉</span>
            <p className="text-lg font-semibold text-gray-lighter">Review saved!</p>
            <button
              onClick={handleReset}
              className="rounded-lg border border-white/20 px-5 py-2 text-sm text-gray-lighter hover:bg-white/5 transition-colors"
            >
              Review another movie
            </button>
          </div>
        )}

        {/* ── Step: send (recommend without review) ── */}
        {step === 'send' && !sendDone && (
          <>
            <FriendGroupsPicker
              friends={friends}
              groups={groups}
              selectedFriendIds={sendFriendIds}
              selectedGroupIds={sendGroupIds}
              friendSearch={sendFriendSearch}
              onFriendSearchChange={setSendFriendSearch}
              onToggleFriend={toggleSendFriend}
              onToggleGroup={toggleSendGroup}
            />

            <button
              onClick={() => sendRecommendation()}
              disabled={sendPending || (sendFriendIds.length === 0 && sendGroupIds.length === 0)}
              className="mt-auto w-full rounded-lg bg-magenta py-2.5 text-sm font-semibold text-white
                         hover:bg-magenta/90 active:scale-95 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendPending ? 'Sending…' : 'Send'}
            </button>
          </>
        )}

        {/* ── Step: send — done ── */}
        {step === 'send' && sendDone && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-lg font-semibold text-gray-lighter">Recommendation sent!</p>
            <button
              onClick={() => setStep('overview')}
              className="rounded-lg border border-white/20 px-5 py-2 text-sm text-gray-lighter hover:bg-white/5 transition-colors"
            >
              Back to overview
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
