import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyReviews,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getRecommendations,
  getMyCategories,
  incrementRewatch,
  decrementRewatch,
  getBulkFriendRatings,
  getFriendActivity,
  getMovieReviews,
  getMyFriends,
  getMyFriendGroups,
  recommendMovie,
  getPersonDetails,
  searchPeople,
  getFavouriteActors,
  getFavouriteDirectors,
  removeFavouriteActor,
  removeFavouriteDirector,
} from '../services/apiClient'
import MovieCard from '../components/MovieCard'
import MovieDescriptionPanel from '../components/MovieDescriptionPanel'
import PersonModal from '../components/PersonModal'
import RecommendationsSection from '../features/movies/RecommendationsSection'
import ReviewModal from '../features/reviews/ReviewModal'
import StarRating from '../components/StarRating'
import type { Movie, Review, FriendReview, FriendActivityItem } from '../types'

type SidebarSection = 'watched' | 'want-to-watch' | 'favourite-actors' | 'favourite-directors' | 'Recommendations' | 'Friends'
type SortKey = 'date-desc' | 'date-asc' | 'release-asc' | 'release-desc' | 'rating-high' | 'rating-low' | 'rating-friends-high' | 'rating-friends-low' | 'rating-public-high' | 'rating-public-low' | 'alpha-az' | 'alpha-za'

interface ReviewModalConfig {
  mode: 'create' | 'edit' | 'share'
  movie: Movie
  reviewId?: string
  initialRating?: number
  initialReviewText?: string
  initialCategoryIds?: string[]
  onSaved?: () => void
}

const SIDEBAR_LINKS: { id: SidebarSection; label: string }[] = [
  { id: 'watched', label: "Movies I've Watched" },
  { id: 'want-to-watch', label: 'Movies I want to Watch' },
  { id: 'favourite-actors', label: 'My Favourite Actors' },
  { id: 'favourite-directors', label: 'My Favourite Directors' },
  { id: 'Recommendations', label: 'Recommendations for Me' },
  { id: 'Friends', label: 'Friends' },
]

// ─── Sort Panel ───────────────────────────────────────────────────────────────
function SortPanel({
  open, onClose, sortBy, setSortBy, showRating,
}: {
  open: boolean; onClose: () => void; sortBy: SortKey | null; setSortBy: (k: SortKey | null) => void; showRating: boolean
}) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const btn = (label: string, key: SortKey) => (
    <button
      key={key}
      onClick={() => setSortBy(sortBy === key ? null : key)}
      className={['px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
        sortBy === key ? 'bg-teal/20 border-teal/60 text-teal-light' : 'bg-navy-card/40 border-white/15 text-gray-lighter hover:border-white/30'].join(' ')}
    >{label}</button>
  )

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />}
      <div className={['fixed top-0 right-0 z-40 h-full w-72 bg-navy-card border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'].join(' ')}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-lighter">Sort By:</h3>
          <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none">×</button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Date Added</p>
          <div className="flex gap-2 flex-wrap">{btn('Oldest First', 'date-asc')}{btn('Newest First', 'date-desc')}</div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Release Date</p>
          <div className="flex gap-2 flex-wrap">{btn('Oldest Release', 'release-asc')}{btn('Newest Release', 'release-desc')}</div>
        </div>
        {showRating && (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Rating by Friends</p>
              <p className="text-[11px] text-gray-muted/70 -mt-1">Your rating + friends' avg</p>
              <div className="flex gap-2 flex-wrap">{btn('Highest', 'rating-friends-high')}{btn('Lowest', 'rating-friends-low')}</div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Rating by Public</p>
              <p className="text-[11px] text-gray-muted/70 -mt-1">TMDB score</p>
              <div className="flex gap-2 flex-wrap">{btn('Highest', 'rating-public-high')}{btn('Lowest', 'rating-public-low')}</div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Your Rating</p>
              <div className="flex gap-2 flex-wrap">{btn('Highest Rated', 'rating-high')}{btn('Lowest Rated', 'rating-low')}</div>
            </div>
          </>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Alphabetical</p>
          <div className="flex gap-2 flex-wrap">{btn('A – Z', 'alpha-az')}{btn('Z – A', 'alpha-za')}</div>
        </div>
      </div>
    </>
  )
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
const TMDB_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
]

function FilterPanel({
  open, onClose, categories, filterCategoryIds, setFilterCategoryIds,
  filterYearFrom, setFilterYearFrom, filterYearTo, setFilterYearTo,
  filterActor, setFilterActor, filterActorId, setFilterActorId,
  filterDirector, setFilterDirector, filterDirectorId, setFilterDirectorId,
  filterGenreIds, setFilterGenreIds,
}: {
  open: boolean; onClose: () => void
  categories: { id: string; name: string; outline_color: string | null; fill_color: string | null }[]
  filterCategoryIds: string[]; setFilterCategoryIds: (ids: string[]) => void
  filterYearFrom: string; setFilterYearFrom: (y: string) => void
  filterYearTo: string; setFilterYearTo: (y: string) => void
  filterActor: string; setFilterActor: (a: string) => void
  filterActorId: number | null; setFilterActorId: (id: number | null) => void
  filterDirector: string; setFilterDirector: (d: string) => void
  filterDirectorId: number | null; setFilterDirectorId: (id: number | null) => void
  filterGenreIds: number[]; setFilterGenreIds: (ids: number[]) => void
}) {
  const [myCatsOpen, setMyCatsOpen] = useState(true)
  const [genresOpen, setGenresOpen] = useState(true)
  const [actorQuery, setActorQuery] = useState(filterActor)
  const [directorQuery, setDirectorQuery] = useState(filterDirector)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Sync local text when external value is cleared
  useEffect(() => { if (!filterActorId) setActorQuery(filterActor) }, [filterActor, filterActorId])
  useEffect(() => { if (!filterDirectorId) setDirectorQuery(filterDirector) }, [filterDirector, filterDirectorId])

  const { data: actorSearchData } = useQuery({
    queryKey: ['people-search-filter-actor', actorQuery],
    queryFn: () => searchPeople(actorQuery),
    enabled: actorQuery.length >= 2 && !filterActorId,
    staleTime: 1000 * 60 * 5,
  })
  const { data: directorSearchData } = useQuery({
    queryKey: ['people-search-filter-director', directorQuery],
    queryFn: () => searchPeople(directorQuery),
    enabled: directorQuery.length >= 2 && !filterDirectorId,
    staleTime: 1000 * 60 * 5,
  })

  const actorSuggestions = (actorSearchData?.results ?? []).filter(p => p.known_for_department === 'Acting').slice(0, 5)
  const directorSuggestions = (directorSearchData?.results ?? []).filter(p => p.known_for_department === 'Directing').slice(0, 5)

  const hasFilters = filterCategoryIds.length > 0 || filterGenreIds.length > 0 || filterYearFrom || filterYearTo || filterActorId || filterDirectorId

  const toggleCategory = (id: string) =>
    setFilterCategoryIds(filterCategoryIds.includes(id) ? filterCategoryIds.filter((c) => c !== id) : [...filterCategoryIds, id])

  const toggleGenre = (id: number) =>
    setFilterGenreIds(filterGenreIds.includes(id) ? filterGenreIds.filter((g) => g !== id) : [...filterGenreIds, id])

  const clearActor = () => { setFilterActor(''); setFilterActorId(null); setActorQuery('') }
  const clearDirector = () => { setFilterDirector(''); setFilterDirectorId(null); setDirectorQuery('') }

  const clearAll = () => {
    setFilterCategoryIds([]); setFilterGenreIds([])
    setFilterYearFrom(''); setFilterYearTo('')
    clearActor(); clearDirector()
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />}
      <div className={['fixed top-0 right-0 z-40 h-full w-80 bg-navy-card border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'].join(' ')}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-lighter">Filter By:</h3>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={clearAll} className="text-xs text-gray-muted hover:text-pink-brand transition-colors">Clear all</button>
            )}
            <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none">×</button>
          </div>
        </div>

        {/* My Movie Categories */}
        <div className="flex flex-col gap-2">
          <button onClick={() => setMyCatsOpen(v => !v)}
            className="flex items-center justify-between w-full rounded-lg border border-white/15 bg-navy/50 px-4 py-2.5 text-sm font-medium text-gray-lighter hover:border-white/30 transition-colors">
            <span>My Movie Categories {filterCategoryIds.length > 0 && <span className="ml-1 text-teal-light text-xs">({filterCategoryIds.length} selected)</span>}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${myCatsOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {myCatsOpen && (
            <div className="flex flex-wrap gap-2 pl-1">
              {categories.length === 0 ? (
                <p className="text-xs text-gray-muted italic">No categories yet</p>
              ) : categories.map((cat) => {
                const isSelected = filterCategoryIds.includes(cat.id)
                const border = cat.outline_color ?? '#ffffff40'
                const bg = isSelected ? (cat.fill_color ?? cat.outline_color ?? '#ffffff20') : 'transparent'
                return (
                  <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                    className="w-fit px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{ border: `2px solid ${border}`, backgroundColor: bg, color: '#e9e9e9', opacity: isSelected ? 1 : 0.7 }}>
                    {cat.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-col gap-2">
          <button onClick={() => setGenresOpen(v => !v)}
            className="flex items-center justify-between w-full rounded-lg border border-white/15 bg-navy/50 px-4 py-2.5 text-sm font-medium text-gray-lighter hover:border-white/30 transition-colors">
            <span>Genres {filterGenreIds.length > 0 && <span className="ml-1 text-magenta text-xs">({filterGenreIds.length} selected)</span>}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${genresOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {genresOpen && (
            <div className="flex flex-wrap gap-2 pl-1">
              {TMDB_GENRES.map((genre) => {
                const isSelected = filterGenreIds.includes(genre.id)
                return (
                  <button key={genre.id} onClick={() => toggleGenre(genre.id)}
                    className={['w-fit px-3 py-1 rounded-full text-xs font-medium border-2 transition-all',
                      isSelected ? 'border-magenta bg-magenta/20 text-white' : 'border-white/20 text-gray-muted hover:border-white/40'].join(' ')}>
                    {genre.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Release Year */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Release Year</p>
          <div className="flex gap-2 items-center">
            <input type="number" placeholder="From" value={filterYearFrom} min={1900} max={2100}
              onChange={(e) => setFilterYearFrom(e.target.value)} className="input-base w-full text-sm" />
            <span className="text-gray-muted text-xs">–</span>
            <input type="number" placeholder="To" value={filterYearTo} min={1900} max={2100}
              onChange={(e) => setFilterYearTo(e.target.value)} className="input-base w-full text-sm" />
          </div>
        </div>

        {/* Actor filter */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Actor</p>
          {filterActorId ? (
            <div className="flex items-center justify-between rounded-lg border border-teal/40 bg-teal/10 px-3 py-2">
              <span className="text-sm text-teal-light">{filterActor}</span>
              <button onClick={clearActor} className="text-gray-muted hover:text-pink-brand text-lg leading-none ml-2">×</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" placeholder="Search actor…" value={actorQuery}
                onChange={(e) => setActorQuery(e.target.value)} className="input-base text-sm" />
              {actorSuggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-navy-card shadow-xl overflow-hidden">
                  {actorSuggestions.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={() => { setFilterActor(p.name); setFilterActorId(p.id); setActorQuery(p.name) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-lighter hover:bg-white/5 transition-colors text-left"
                      >
                        {p.profile_path && <img src={`https://image.tmdb.org/t/p/w45${p.profile_path}`} className="h-7 w-7 rounded-full object-cover shrink-0" alt="" />}
                        <span>{p.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Director filter */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Director</p>
          {filterDirectorId ? (
            <div className="flex items-center justify-between rounded-lg border border-teal/40 bg-teal/10 px-3 py-2">
              <span className="text-sm text-teal-light">{filterDirector}</span>
              <button onClick={clearDirector} className="text-gray-muted hover:text-pink-brand text-lg leading-none ml-2">×</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" placeholder="Search director…" value={directorQuery}
                onChange={(e) => setDirectorQuery(e.target.value)} className="input-base text-sm" />
              {directorSuggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-navy-card shadow-xl overflow-hidden">
                  {directorSuggestions.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={() => { setFilterDirector(p.name); setFilterDirectorId(p.id); setDirectorQuery(p.name) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-lighter hover:bg-white/5 transition-colors text-left"
                      >
                        {p.profile_path && <img src={`https://image.tmdb.org/t/p/w45${p.profile_path}`} className="h-7 w-7 rounded-full object-cover shrink-0" alt="" />}
                        <span>{p.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Reviews List Modal (Go to Reviews) ──────────────────────────────────────
function ReviewsListModal({ movie, myReview, onClose }: {
  movie: Movie; myReview: Review; onClose: () => void
}) {
  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['movie-reviews', movie.id],
    queryFn: () => getMovieReviews(movie.id),
    staleTime: 1000 * 60 * 2,
  })

  const friendReviews: FriendReview[] = reviewData?.friend_reviews ?? []

  const formatRewatch = (count: number) => {
    const total = count + 1
    return `Watched ${total} time${total !== 1 ? 's' : ''}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="panel-card flex max-w-xl w-full flex-col gap-5 p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-lighter">{movie.title} — Reviews</h2>
          <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none">×</button>
        </div>

        {/* Your review pinned at top */}
        <div className="flex flex-col gap-2 rounded-lg border border-teal/30 bg-teal/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-teal-light uppercase tracking-wide">Your Review</p>
            <span className="text-xs text-gray-muted">{formatRewatch(myReview.rewatch_count ?? 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <StarRating value={myReview.rating} readOnly size="sm" />
            <span className="text-xs text-gray-muted">{myReview.rating}/5</span>
          </div>
          {myReview.review_text && <p className="text-sm text-gray-light/80 leading-relaxed">{myReview.review_text}</p>}
        </div>

        {/* Friends' reviews */}
        {isLoading ? (
          <p className="text-sm text-gray-muted text-center py-4">Loading…</p>
        ) : friendReviews.length === 0 ? (
          <p className="text-sm text-gray-muted italic text-center py-4">No friends have reviewed this movie yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {friendReviews.map((fr) => (
              <li key={fr.id} className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-navy-card/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-lighter">{fr.profiles?.username ?? 'Unknown'}</p>
                  <span className="text-xs text-gray-muted">{formatRewatch(fr.rewatch_count ?? 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={fr.rating} readOnly size="sm" />
                  <span className="text-xs text-gray-muted">{fr.rating}/5</span>
                </div>
                {fr.review_text && <p className="text-sm text-gray-light/80 leading-relaxed">{fr.review_text}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Watched Movie Detail Modal ───────────────────────────────────────────────
function WatchedMovieModal({ movie, review, onClose, onEdit, onShare, onRewatch, onDecrementRewatch, onGoToReviews, onPersonClick }: {
  movie: Movie; review: Review; onClose: () => void; onEdit: () => void; onShare: () => void
  onRewatch: () => void; onDecrementRewatch: () => void; onGoToReviews: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Poster'
  const rewatchCount = review.rewatch_count ?? 0

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      {/* Refactored for mobile: stack poster and details vertically on mobile, row on sm+ */}
      <div className="panel-card flex max-w-2xl w-full flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Refactored for mobile: center poster on mobile, align start on sm+ */}
        <div className="w-28 shrink-0 self-center sm:w-40 sm:self-start">
          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
            <img src={posterUrl} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-lighter">{movie.title}</h2>
              {movie.release_date && <p className="text-sm text-gray-muted">{movie.release_date.slice(0, 4)}</p>}
            </div>
            <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none shrink-0">×</button>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Your Rating</p>
            <div className="flex items-center gap-2">
              <StarRating value={review.rating} readOnly size="md" />
              <span className="text-sm text-gray-muted">{review.rating}/5</span>
            </div>
          </div>
          {review.review_text && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Your Review</p>
              <p className="text-sm text-gray-light/80 leading-relaxed line-clamp-4">{review.review_text}</p>
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-gray-muted">
              Watched <span className="text-gray-lighter font-semibold">{rewatchCount + 1}</span> time{rewatchCount + 1 !== 1 ? 's' : ''}
            </p>
            {rewatchCount > 0 && (
              <button onClick={onDecrementRewatch} className="flex items-center gap-1 rounded-lg border border-white/15 bg-navy-card/40 px-2 py-1.5 text-xs font-medium text-gray-muted hover:border-white/30 hover:text-gray-lighter transition-colors" title="Remove a rewatch">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
              </button>
            )}
            <button onClick={onRewatch} className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-navy-card/40 px-3 py-1.5 text-xs font-medium text-gray-lighter hover:border-white/30 hover:bg-white/5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-watched
            </button>
          </div>
          <MovieDescriptionPanel movieId={movie.id} onPersonClick={onPersonClick} />
          <div className="mt-auto flex flex-wrap gap-2">
            <button onClick={onEdit} className="flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal/10 px-4 py-2 text-sm font-medium text-teal-light hover:bg-teal/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Rating &amp; Review
            </button>
            <button onClick={onShare} className="flex items-center gap-1.5 rounded-lg border border-magenta/40 bg-magenta/10 px-4 py-2 text-sm font-medium text-magenta hover:bg-magenta/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share / Add to Category
            </button>
            <button onClick={onGoToReviews} className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-navy-card/40 px-4 py-2 text-sm font-medium text-gray-lighter hover:border-white/30 hover:bg-white/5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Go to Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Watchlist Movie Detail Modal ─────────────────────────────────────────────
function WatchlistMovieModal({ movie, onClose, onRemove, onWriteReview, onPersonClick }: {
  movie: Movie; onClose: () => void; onRemove: () => void; onWriteReview: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Poster'
  const queryClient = useQueryClient()

  const [showRecommendPanel, setShowRecommendPanel] = useState(false)
  const [recFriendIds, setRecFriendIds] = useState<string[]>([])
  const [recGroupIds, setRecGroupIds] = useState<string[]>([])

  const { data: recFriends = [] } = useQuery({ queryKey: ['friends'], queryFn: getMyFriends, staleTime: 1000 * 60 * 5 })
  const { data: recGroups = [] } = useQuery({ queryKey: ['friend-groups'], queryFn: getMyFriendGroups, staleTime: 1000 * 60 * 5 })

  const recommendMutation = useMutation({
    mutationFn: () => recommendMovie({
      movie_id: movie.id, title: movie.title,
      poster_path: movie.poster_path ?? null,
      release_date: movie.release_date ?? null,
      friend_ids: recFriendIds,
      group_ids: recGroupIds,
    }),
    onSuccess: () => {
      setShowRecommendPanel(false)
      setRecFriendIds([])
      setRecGroupIds([])
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const toggleRecFriend = (id: string) =>
    setRecFriendIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleRecGroup = (id: string) =>
    setRecGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="panel-card flex max-w-2xl w-full flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="w-28 shrink-0 self-center sm:w-40 sm:self-start">
          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
            <img src={posterUrl} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-lighter">{movie.title}</h2>
              {movie.release_date && <p className="text-sm text-gray-muted">{movie.release_date.slice(0, 4)}</p>}
            </div>
            <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none shrink-0">×</button>
          </div>
          <p className="text-sm text-gray-muted italic">You haven't watched this yet.</p>
          <MovieDescriptionPanel movieId={movie.id} overview={movie.overview} onPersonClick={onPersonClick} />

          {/* Send to Friends inline panel */}
          {showRecommendPanel && (
            <div className="flex flex-col gap-3 rounded-xl border border-teal/30 bg-navy/50 p-3">
              <p className="text-xs font-semibold text-teal-light uppercase tracking-wide">Send to Friends</p>
              {recFriends.length > 0 && (
                <div>
                  <p className="text-xs text-gray-muted mb-1.5">Friends</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recFriends.map(f => (
                      <button key={f.id} onClick={() => toggleRecFriend(f.id)}
                        className={['w-fit rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
                          recFriendIds.includes(f.id) ? 'border-teal bg-teal/20 text-teal-light' : 'border-white/20 text-gray-muted hover:border-white/40'].join(' ')}>
                        {f.username}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recGroups.length > 0 && (
                <div>
                  <p className="text-xs text-gray-muted mb-1.5">Groups</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recGroups.map(g => (
                      <button key={g.id} onClick={() => toggleRecGroup(g.id)}
                        className={['w-fit rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
                          recGroupIds.includes(g.id) ? 'border-magenta bg-magenta/20 text-white' : 'border-white/20 text-gray-muted hover:border-white/40'].join(' ')}>
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => recommendMutation.mutate()}
                  disabled={(recFriendIds.length === 0 && recGroupIds.length === 0) || recommendMutation.isPending}
                  className="flex-1 rounded-lg bg-teal/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50 transition-colors">
                  {recommendMutation.isPending ? 'Sending…' : 'Send'}
                </button>
                <button onClick={() => { setShowRecommendPanel(false); setRecFriendIds([]); setRecGroupIds([]) }}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-muted hover:text-gray-lighter transition-colors">
                  Cancel
                </button>
              </div>
              {recommendMutation.isSuccess && (
                <p className="text-xs text-teal-light">Sent!</p>
              )}
            </div>
          )}

          <div className="mt-auto flex flex-wrap gap-2">
            <button onClick={onWriteReview} className="flex items-center gap-1.5 rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Write a Review
            </button>
            <button onClick={() => setShowRecommendPanel(v => !v)}
              className={['flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                showRecommendPanel ? 'border-teal bg-teal/20 text-teal-light' : 'border-teal/40 bg-teal/10 text-teal-light hover:bg-teal/20'].join(' ')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Send to Friends
            </button>
            <button onClick={onRemove} className="flex items-center gap-1.5 rounded-lg border border-pink-brand/40 bg-pink-brand/10 px-4 py-2 text-sm font-medium text-pink-brand hover:bg-pink-brand/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove from Watchlist
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Friends Activity Section ─────────────────────────────────────────────────
function FriendsActivitySection({
  friendActivity, myFriendsCount, onNavigateToProfile, onPersonClick,
}: {
  friendActivity: FriendActivityItem[]
  myFriendsCount: number
  onNavigateToProfile: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  const [selectedReview, setSelectedReview] = useState<{
    friendName: string
    review: FriendActivityItem['reviews'][number]
  } | null>(null)

  const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'

  if (myFriendsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-gray-300 font-medium">You haven't added any friends yet.</p>
        <button onClick={onNavigateToProfile} className="mt-1 flex items-center gap-2 rounded-full bg-magenta px-5 py-2 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors">
          Go to Profile to Add Friends
        </button>
      </div>
    )
  }

  if (friendActivity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-gray-300">None of your friends have watched anything in the last 7 days.</p>
        <p className="text-xs text-gray-400">Check back soon!</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {friendActivity.map((friend) => (
          <div key={friend.friend_id} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-lighter">
              <span className="text-teal-light">{friend.username}</span> recently watched
            </h3>
              {/* Refactored for mobile: 2 cols on mobile for friends activity grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {friend.reviews.map((review) => {
                const m = review.movies
                const posterUrl = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Poster'
                return (
                  <button
                    key={review.id}
                    onClick={() => setSelectedReview({ friendName: friend.username, review })}
                    className="group flex flex-col gap-1 text-left"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-card relative">
                      <img src={posterUrl} alt={m.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <p className="text-xs text-gray-lighter leading-snug line-clamp-2">{m.title}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedReview && (
        <FriendReviewModal
          friendName={selectedReview.friendName}
          review={selectedReview.review}
          onClose={() => setSelectedReview(null)}
          onPersonClick={onPersonClick}
        />
      )}
    </>
  )
}

// ─── Friend Review Detail Modal ────────────────────────────────────────────────
function FriendReviewModal({ friendName, review, onClose, onPersonClick }: {
  friendName: string
  review: FriendActivityItem['reviews'][number]
  onClose: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  const queryClient = useQueryClient()
  const movie = review.movies as Movie
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Poster'
  const totalWatched = (review.rewatch_count ?? 0) + 1
  const [showReviewModal, setShowReviewModal] = useState(false)

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['movie-reviews', movie.id],
    queryFn: () => getMovieReviews(movie.id),
    staleTime: 1000 * 60 * 2,
  })

  const myReview = reviewData?.my_review ?? null
  const otherFriendReviews = (reviewData?.friend_reviews ?? []).filter((r) => r.user_id !== review.user_id)

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
    staleTime: 1000 * 60 * 2,
  })
  const inWatchlist = watchlist.some((w) => w.movie_id === movie.id)

  const addWatchlistMutation = useMutation({
    mutationFn: () => addToWatchlist({ movie_id: movie.id, title: movie.title, poster_path: movie.poster_path ?? null, release_date: movie.release_date ?? null, genre_ids: movie.genre_ids, vote_average: movie.vote_average }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })
  const removeWatchlistMutation = useMutation({
    mutationFn: () => removeFromWatchlist(movie.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      {/* Refactored for mobile: stack poster and friend review vertically on mobile, row on sm+ */}
      <div className="panel-card flex max-w-2xl w-full flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Refactored for mobile: center poster on mobile, align start on sm+ */}
        <div className="w-28 shrink-0 self-center sm:w-36 sm:self-start">
          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
            <img src={posterUrl} alt={movie.title} className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-lighter">{movie.title}</h2>
              {movie.release_date && <p className="text-sm text-gray-muted">{movie.release_date.slice(0, 4)}</p>}
            </div>
            <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none shrink-0">×</button>
          </div>

          {/* Featured friend's review */}
          <div className="flex flex-col gap-2 rounded-lg border border-teal/30 bg-teal/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-teal-light">{friendName}</p>
              <span className="text-xs text-gray-muted">Watched {totalWatched} time{totalWatched !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <StarRating value={review.rating} readOnly size="sm" />
              <span className="text-xs text-gray-muted">{review.rating}/5</span>
            </div>
            {review.review_text && <p className="text-sm text-gray-light/80 leading-relaxed">{review.review_text}</p>}
          </div>

          {/* My review (if exists) */}
          {myReview && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Your Rating</p>
              <div className="flex items-center gap-2">
                <StarRating value={myReview.rating} readOnly size="sm" />
                <span className="text-xs text-gray-muted">{myReview.rating}/5</span>
              </div>
              {myReview.review_text && <p className="text-sm text-gray-light/80 leading-relaxed line-clamp-3">{myReview.review_text}</p>}
            </div>
          )}

          <MovieDescriptionPanel movieId={movie.id} onPersonClick={onPersonClick} />

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {myReview ? 'Edit Review' : 'Write a Review'}
            </button>
            {!myReview && (
              inWatchlist ? (
                <button
                  onClick={() => removeWatchlistMutation.mutate()}
                  disabled={removeWatchlistMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-pink-brand/40 bg-pink-brand/10 px-4 py-2 text-sm font-medium text-pink-brand hover:bg-pink-brand/20 transition-colors disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  On Watchlist
                </button>
              ) : (
                <button
                  onClick={() => addWatchlistMutation.mutate()}
                  disabled={addWatchlistMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal/10 px-4 py-2 text-sm font-medium text-teal-light hover:bg-teal/20 transition-colors disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Watchlist
                </button>
              )
            )}
          </div>

          {/* Other friend reviews */}
          {isLoading ? (
            <p className="text-xs text-gray-muted">Loading other reviews…</p>
          ) : otherFriendReviews.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Other Friends</p>              <ul className="flex flex-col gap-2">
                {otherFriendReviews.map((fr) => (
                  <li key={fr.id} className="flex flex-col gap-1 rounded-lg border border-white/10 bg-navy-card/40 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-lighter">{fr.profiles?.username ?? 'Unknown'}</p>
                      <span className="text-xs text-gray-muted">Watched {(fr.rewatch_count ?? 0) + 1}×</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating value={fr.rating} readOnly size="sm" />
                      <span className="text-xs text-gray-muted">{fr.rating}/5</span>
                    </div>
                    {fr.review_text && <p className="text-sm text-gray-light/80 leading-relaxed line-clamp-3">{fr.review_text}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {showReviewModal && (
        <ReviewModal
          movie={movie}
          mode={myReview ? 'edit' : 'create'}
          reviewId={myReview?.id}
          initialRating={myReview?.rating}
          initialReviewText={myReview?.review_text ?? undefined}
          initialCategoryIds={myReview?.category_ids ?? []}
          onClose={() => setShowReviewModal(false)}
          onSaved={() => { setShowReviewModal(false); queryClient.invalidateQueries({ queryKey: ['movie-reviews', movie.id] }) }}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyMoviesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeSection, setActiveSection] = useState<SidebarSection>('watched')
  const [searchQ, setSearchQ] = useState('')
  const [lastFriendsViewedAt, setLastFriendsViewedAt] = useState<number>(
    () => parseInt(localStorage.getItem('lastFriendsViewedAt') ?? '0', 10)
  )
  const [personModalId, setPersonModalId] = useState<number | null>(null)

  const [showSortPanel, setShowSortPanel] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey | null>(null)
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([])
  const [filterGenreIds, setFilterGenreIds] = useState<number[]>([])
  const [filterYearFrom, setFilterYearFrom] = useState('')
  const [filterYearTo, setFilterYearTo] = useState('')
  const [filterActor, setFilterActor] = useState('')
  const [filterActorId, setFilterActorId] = useState<number | null>(null)
  const [filterDirector, setFilterDirector] = useState('')
  const [filterDirectorId, setFilterDirectorId] = useState<number | null>(null)
  const [favActorQ, setFavActorQ] = useState('')
  const [favDirectorQ, setFavDirectorQ] = useState('')
  const [showReviewsModal, setShowReviewsModal] = useState(false)

  const [watchedDetail, setWatchedDetail] = useState<{ movie: Movie; review: Review } | null>(null)
  const [watchlistDetail, setWatchlistDetail] = useState<Movie | null>(null)
  const [reviewModal, setReviewModal] = useState<ReviewModalConfig | null>(null)

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => getMyReviews(1, 500),
    enabled: activeSection === 'watched',
  })

  const { data: watchlistData = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
    enabled: activeSection === 'want-to-watch',
  })

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations'],
    queryFn: getRecommendations,
    refetchInterval: 30_000,
  })
  const unreadRecCount = recommendations.filter((r) => !r.is_read).length

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getMyCategories,
  })

  const removeFromWatchlistMutation = useMutation({
    mutationFn: (movieId: number) => removeFromWatchlist(movieId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
      setWatchlistDetail(null)
    },
  })

  const incrementRewatchMutation = useMutation({
    mutationFn: (reviewId: string) => incrementRewatch(reviewId),
    onSuccess: (data, reviewId) => {
      qc.setQueryData<typeof reviewsData>(['my-reviews'], (old) => {
        if (!old) return old
        return { ...old, reviews: old.reviews.map((r) => r.id === reviewId ? { ...r, rewatch_count: data.rewatch_count } : r) }
      })
      setWatchedDetail((prev) => {
        if (!prev || prev.review.id !== reviewId) return prev
        return { ...prev, review: { ...prev.review, rewatch_count: data.rewatch_count } }
      })
    },
  })

  const decrementRewatchMutation = useMutation({
    mutationFn: (reviewId: string) => decrementRewatch(reviewId),
    onSuccess: (data, reviewId) => {
      qc.setQueryData<typeof reviewsData>(['my-reviews'], (old) => {
        if (!old) return old
        return { ...old, reviews: old.reviews.map((r) => r.id === reviewId ? { ...r, rewatch_count: data.rewatch_count } : r) }
      })
      setWatchedDetail((prev) => {
        if (!prev || prev.review.id !== reviewId) return prev
        return { ...prev, review: { ...prev.review, rewatch_count: data.rewatch_count } }
      })
    },
  })

  const { data: friendRatings = {} } = useQuery({
    queryKey: ['bulk-friend-ratings'],
    queryFn: getBulkFriendRatings,
    enabled: activeSection === 'watched' && (sortBy === 'rating-friends-high' || sortBy === 'rating-friends-low'),
    staleTime: 1000 * 60 * 5,
  })

  const { data: friendActivity = [] } = useQuery({
    queryKey: ['friend-activity'],
    queryFn: getFriendActivity,
    refetchInterval: 60_000,
  })

  const { data: myFriends = [] } = useQuery({
    queryKey: ['my-friends'],
    queryFn: getMyFriends,
    enabled: activeSection === 'Friends',
  })

  const { data: favActors = [] } = useQuery({
    queryKey: ['favourite-actors'],
    queryFn: getFavouriteActors,
    staleTime: 1000 * 60 * 5,
  })

  const { data: favDirectors = [] } = useQuery({
    queryKey: ['favourite-directors'],
    queryFn: getFavouriteDirectors,
    staleTime: 1000 * 60 * 5,
  })

  const removeActorMutation = useMutation({
    mutationFn: (actorId: number) => removeFavouriteActor(actorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-actors'] }),
  })

  const removeDirectorMutation = useMutation({
    mutationFn: (directorId: number) => removeFavouriteDirector(directorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-directors'] }),
  })

  const { data: filterActorDetails } = useQuery({
    queryKey: ['person-details', filterActorId],
    queryFn: () => getPersonDetails(filterActorId!),
    enabled: filterActorId !== null,
    staleTime: 1000 * 60 * 30,
  })
  const filterActorMovieIds = new Set(filterActorDetails?.movie_credits?.cast?.map((m: { id: number }) => m.id) ?? [])

  const { data: filterDirectorDetails } = useQuery({
    queryKey: ['person-details', filterDirectorId],
    queryFn: () => getPersonDetails(filterDirectorId!),
    enabled: filterDirectorId !== null,
    staleTime: 1000 * 60 * 30,
  })
  const filterDirectorMovieIds = new Set(
    filterDirectorDetails?.movie_credits?.crew?.filter((m) => m.job === 'Director').map((m) => m.id) ?? []
  )

  const movieReviewPairs: { movie: Movie; review: Review }[] = []
  const seenIds = new Set<number>()
  for (const review of reviewsData?.reviews ?? []) {
    if (review.movies && !seenIds.has(review.movies.id)) {
      seenIds.add(review.movies.id)
      movieReviewPairs.push({ movie: review.movies as Movie, review })
    }
  }

  const sortedWatched = [...movieReviewPairs].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':    return new Date(a.review.created_at).getTime() - new Date(b.review.created_at).getTime()
      case 'date-desc':   return new Date(b.review.created_at).getTime() - new Date(a.review.created_at).getTime()
      case 'release-asc': {
        const da = a.movie.release_date ? new Date(a.movie.release_date).getTime() : 0
        const db = b.movie.release_date ? new Date(b.movie.release_date).getTime() : 0
        return da - db
      }
      case 'release-desc': {
        const da = a.movie.release_date ? new Date(a.movie.release_date).getTime() : 0
        const db = b.movie.release_date ? new Date(b.movie.release_date).getTime() : 0
        return db - da
      }
      case 'rating-high': return b.review.rating - a.review.rating
      case 'rating-low':  return a.review.rating - b.review.rating
      case 'rating-friends-high': {
        const ra = friendRatings[String(a.movie.id)] ?? a.review.rating
        const rb = friendRatings[String(b.movie.id)] ?? b.review.rating
        return rb - ra
      }
      case 'rating-friends-low': {
        const ra = friendRatings[String(a.movie.id)] ?? a.review.rating
        const rb = friendRatings[String(b.movie.id)] ?? b.review.rating
        return ra - rb
      }
      case 'rating-public-high': return (b.movie.vote_average ?? 0) - (a.movie.vote_average ?? 0)
      case 'rating-public-low':  return (a.movie.vote_average ?? 0) - (b.movie.vote_average ?? 0)
      case 'alpha-az':    return a.movie.title.localeCompare(b.movie.title)
      case 'alpha-za':    return b.movie.title.localeCompare(a.movie.title)
      default: return 0
    }
  })

  const filteredWatched = sortedWatched.filter(({ movie, review }) => {
    if (searchQ.trim() && !movie.title.toLowerCase().includes(searchQ.toLowerCase())) return false
    if (filterCategoryIds.length > 0) {
      const reviewCats = review.category_ids?.length ? review.category_ids : (review.category_id ? [review.category_id] : [])
      if (!filterCategoryIds.some((id) => reviewCats.includes(id))) return false
    }
    if (filterGenreIds.length > 0 && !(movie.genre_ids ?? []).some(id => filterGenreIds.includes(id))) return false
    if (filterActorId && filterActorMovieIds.size > 0 && !filterActorMovieIds.has(movie.id)) return false
    if (filterDirectorId && filterDirectorMovieIds.size > 0 && !filterDirectorMovieIds.has(movie.id)) return false
    const yr = movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null
    if (filterYearFrom && yr && yr < parseInt(filterYearFrom)) return false
    if (filterYearTo && yr && yr > parseInt(filterYearTo)) return false
    return true
  })

  const sortedWatchlist = [...watchlistData].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':    return new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
      case 'date-desc':   return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      case 'release-asc': {
        const da = a.movies.release_date ? new Date(a.movies.release_date).getTime() : 0
        const db = b.movies.release_date ? new Date(b.movies.release_date).getTime() : 0
        return da - db
      }
      case 'release-desc': {
        const da = a.movies.release_date ? new Date(a.movies.release_date).getTime() : 0
        const db = b.movies.release_date ? new Date(b.movies.release_date).getTime() : 0
        return db - da
      }
      case 'alpha-az':  return a.movies.title.localeCompare(b.movies.title)
      case 'alpha-za':  return b.movies.title.localeCompare(a.movies.title)
      default: return 0
    }
  })

  const filteredWatchlist = sortedWatchlist.filter((w) => {
    if (searchQ.trim() && !w.movies.title.toLowerCase().includes(searchQ.toLowerCase())) return false
    if (filterGenreIds.length > 0 && !(w.movies.genre_ids ?? []).some(id => filterGenreIds.includes(id))) return false
    const movieId = w.movies.id
    if (filterActorId && filterActorMovieIds.size > 0 && !filterActorMovieIds.has(movieId)) return false
    if (filterDirectorId && filterDirectorMovieIds.size > 0 && !filterDirectorMovieIds.has(movieId)) return false
    const yr = w.movies.release_date ? parseInt(w.movies.release_date.slice(0, 4)) : null
    if (filterYearFrom && yr && yr < parseInt(filterYearFrom)) return false
    if (filterYearTo && yr && yr > parseInt(filterYearTo)) return false
    return true
  })

  const showSortFilter = activeSection !== 'Recommendations' && activeSection !== 'favourite-actors' && activeSection !== 'favourite-directors' && activeSection !== 'Friends'
  const activeFiltersCount = [filterCategoryIds.length > 0 ? 'x' : null, filterGenreIds.length > 0 ? 'x' : null, filterYearFrom, filterYearTo, filterActorId ? 'x' : null, filterDirectorId ? 'x' : null].filter(Boolean).length

  const hasUnreadRecs = unreadRecCount > 0
  const newFriendActivityCount = friendActivity.filter((f) =>
    f.reviews.some((r) => new Date(r.created_at).getTime() > lastFriendsViewedAt)
  ).length
  const hasNewFriendActivity = newFriendActivityCount > 0

  // Reorder mobile tabs so priority tabs sit directly after the active tab
  function getMobileTabOrder() {
    const priorityIds: SidebarSection[] = []
    if (hasUnreadRecs && activeSection !== 'Recommendations') priorityIds.push('Recommendations')
    if (hasNewFriendActivity && activeSection !== 'Friends') priorityIds.push('Friends')
    if (priorityIds.length === 0) return SIDEBAR_LINKS
    const base = SIDEBAR_LINKS.filter((l) => !priorityIds.includes(l.id))
    const activeIdx = base.findIndex((l) => l.id === activeSection)
    const result = [...base]
    result.splice(activeIdx + 1, 0, ...priorityIds.map((id) => SIDEBAR_LINKS.find((l) => l.id === id)!))
    return result
  }
  const mobileTabs = getMobileTabOrder()

  const resetSectionState = () => {
    setWatchedDetail(null); setWatchlistDetail(null)
    setSortBy(null); setFilterCategoryIds([]); setFilterGenreIds([])
    setFilterYearFrom(''); setFilterYearTo('')
    setFilterActor(''); setFilterActorId(null); setFilterDirector(''); setFilterDirectorId(null)
    setFavActorQ(''); setFavDirectorQ('')
    setSearchQ('')
    setShowReviewsModal(false)
  }

  return (
    // Refactored for mobile: flex-col on mobile stacks sidebar below content; switches to row on md+
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:gap-8 md:px-6 md:py-8">
      {/* Refactored for mobile: sidebar hidden on small screens, shown md+ */}
      <aside className="hidden w-60 shrink-0 md:block">
        <ul className="flex flex-col gap-8">
          {SIDEBAR_LINKS.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => { setActiveSection(link.id); resetSectionState(); if (link.id === 'Friends') { const now = Date.now(); setLastFriendsViewedAt(now); localStorage.setItem('lastFriendsViewedAt', String(now)) } }}
                className={`sidebar-link w-full text-left flex items-center gap-2${activeSection === link.id ? ' active' : ''}`}
              >
                {link.label}
                {link.id === 'Recommendations' && unreadRecCount > 0 && (
                  <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{unreadRecCount}</span>
                )}
                {link.id === 'Friends' && hasNewFriendActivity && (
                  <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{newFriendActivityCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Refactored for mobile: horizontal scroll nav replaces sidebar on small screens */}
      <nav className="md:hidden flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {mobileTabs.map((link) => {
          const isActive = activeSection === link.id
          const isPriority = !isActive && (
            (link.id === 'Recommendations' && hasUnreadRecs) ||
            (link.id === 'Friends' && hasNewFriendActivity)
          )
          return (
            <button
              key={link.id}
              onClick={() => {
                setActiveSection(link.id)
                resetSectionState()
                if (link.id === 'Friends') { const now = Date.now(); setLastFriendsViewedAt(now); localStorage.setItem('lastFriendsViewedAt', String(now)) }
              }}
              className={[
                'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'border-teal/60 bg-teal/10 text-teal-light'
                  : isPriority
                  ? 'border-magenta/60 bg-magenta/10 text-magenta'
                  : 'border-white/15 bg-navy-card/40 text-gray-muted',
              ].join(' ')}
            >
              {link.label}
              {link.id === 'Recommendations' && unreadRecCount > 0 && (
                <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{unreadRecCount}</span>
              )}
              {link.id === 'Friends' && hasNewFriendActivity && (
                <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{newFriendActivityCount}</span>
              )}
            </button>
          )
        })}
      </nav>

      <main className="min-w-0 flex-1">
        {activeSection !== 'Recommendations' && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-lighter">
              {SIDEBAR_LINKS.find((l) => l.id === activeSection)?.label}
            </h2>
          </div>
        )}

        {showSortFilter && (
          <div className="mb-5 flex items-center gap-3">
            <button
              onClick={() => { setShowSortPanel(true); setShowFilterPanel(false) }}
              className={['flex items-center justify-center rounded-lg border p-2 transition-colors',
                sortBy ? 'border-teal/60 bg-teal/10 text-teal-light' : 'border-white/15 bg-navy-card/40 text-gray-muted hover:text-gray-lighter'].join(' ')}
              title="Sort"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M17 3v14l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => { setShowFilterPanel(true); setShowSortPanel(false) }}
              className={['relative flex items-center justify-center rounded-lg border p-2 transition-colors',
                activeFiltersCount > 0 ? 'border-magenta/60 bg-magenta/10 text-magenta' : 'border-white/15 bg-navy-card/40 text-gray-muted hover:text-gray-lighter'].join(' ')}
              title="Filter"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-magenta text-white text-[10px] font-bold flex items-center justify-center leading-none">{activeFiltersCount}</span>
              )}
            </button>
            <input type="text" placeholder="Search" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              className="flex-1 rounded-full border border-white/15 bg-navy-card/40 px-4 py-2 text-sm text-gray-lighter placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-teal/40" />
          </div>
        )}

        {activeSection === 'watched' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-24"><span className="text-sm text-gray-muted">Loading…</span></div>
            ) : movieReviewPairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <p className="text-gray-300">No movies reviewed yet.</p>
                <p className="text-xs text-gray-400">Head to <strong className="text-teal-500">Make Review</strong> to add your first one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5"> {/* Refactored for mobile: 2 cols on mobile */}
                {filteredWatched.map(({ movie, review }) => (
                  <MovieCard key={movie.id} movie={movie} onSelect={() => setWatchedDetail({ movie, review })} />
                ))}
                {!searchQ.trim() && filterCategoryIds.length === 0 && !filterYearFrom && !filterYearTo && (
                  <button onClick={() => navigate('/search')} className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-card border-2 border-dashed border-white/20 bg-navy-card/30 text-gray-muted hover:border-white/40 hover:text-gray-lighter transition-colors" title="Add a movie">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {activeSection === 'want-to-watch' && (
          <>
            {watchlistLoading ? (
              <div className="flex items-center justify-center py-24"><span className="text-sm text-gray-muted">Loading…</span></div>
            ) : watchlistData.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <p className="text-gray-300">Your watchlist is empty.</p>
                <p className="text-xs text-gray-400">Search for movies and click the <strong>+</strong> icon to add them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5"> {/* Refactored for mobile: 2 cols on mobile */}
                {filteredWatchlist.map((w) => (
                  <MovieCard key={w.movie_id} movie={w.movies as Movie} onSelect={(m) => setWatchlistDetail(m)} />
                ))}
                {!searchQ.trim() && !filterYearFrom && !filterYearTo && (
                  <button onClick={() => navigate('/search')} className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-card border-2 border-dashed border-white/20 bg-navy-card/30 text-gray-muted hover:border-white/40 hover:text-gray-lighter transition-colors" title="Add a movie">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {activeSection === 'favourite-actors' && (
          <div className="flex flex-col gap-4">
            {favActors.length > 0 && (
              <input
                type="text"
                placeholder="Search actors…"
                value={favActorQ}
                onChange={(e) => setFavActorQ(e.target.value)}
                className="input-base text-sm"
              />
            )}
            {favActors.filter(a => !favActorQ.trim() || (a.actor_name ?? '').toLowerCase().includes(favActorQ.toLowerCase())).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                {favActors.length === 0 ? (
                  <>
                    <p className="text-gray-300">No favourite actors saved yet.</p>
                    <p className="text-xs text-gray-400">Find an actor in the Search tab and add them to your favourites.</p>
                  </>
                ) : (
                  <p className="text-gray-300">No actors match your search.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {favActors.filter(a => !favActorQ.trim() || (a.actor_name ?? '').toLowerCase().includes(favActorQ.toLowerCase())).map((actor) => {
                  const profileUrl = actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
                  return (
                    <div key={actor.actor_id} className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-navy-card/40 p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setPersonModalId(actor.actor_id)}
                        className="w-full flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-navy-card/60">
                          {profileUrl ? (
                            <img src={profileUrl} alt={actor.actor_name ?? ''} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-muted text-lg font-semibold">
                              {(actor.actor_name ?? '?').charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-lighter leading-tight line-clamp-2">{actor.actor_name}</p>
                      </button>
                      <button
                        onClick={() => removeActorMutation.mutate(actor.actor_id)}
                        disabled={removeActorMutation.isPending}
                        className="text-[10px] text-gray-muted hover:text-pink-brand transition-colors disabled:opacity-40"
                        title="Remove from favourites"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeSection === 'favourite-directors' && (
          <div className="flex flex-col gap-4">
            {favDirectors.length > 0 && (
              <input
                type="text"
                placeholder="Search directors…"
                value={favDirectorQ}
                onChange={(e) => setFavDirectorQ(e.target.value)}
                className="input-base text-sm"
              />
            )}
            {favDirectors.filter(d => !favDirectorQ.trim() || (d.director_name ?? '').toLowerCase().includes(favDirectorQ.toLowerCase())).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                {favDirectors.length === 0 ? (
                  <>
                    <p className="text-gray-300">No favourite directors saved yet.</p>
                    <p className="text-xs text-gray-400">Find a director in the Search tab and add them to your favourites.</p>
                  </>
                ) : (
                  <p className="text-gray-300">No directors match your search.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {favDirectors.filter(d => !favDirectorQ.trim() || (d.director_name ?? '').toLowerCase().includes(favDirectorQ.toLowerCase())).map((director) => {
                  const profileUrl = director.profile_path ? `https://image.tmdb.org/t/p/w185${director.profile_path}` : null
                  return (
                    <div key={director.director_id} className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-navy-card/40 p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setPersonModalId(director.director_id)}
                        className="w-full flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-navy-card/60">
                          {profileUrl ? (
                            <img src={profileUrl} alt={director.director_name ?? ''} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-muted text-lg font-semibold">
                              {(director.director_name ?? '?').charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-lighter leading-tight line-clamp-2">{director.director_name}</p>
                      </button>
                      <button
                        onClick={() => removeDirectorMutation.mutate(director.director_id)}
                        disabled={removeDirectorMutation.isPending}
                        className="text-[10px] text-gray-muted hover:text-pink-brand transition-colors disabled:opacity-40"
                        title="Remove from favourites"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeSection === 'Recommendations' && <RecommendationsSection />}

        {activeSection === 'Friends' && (
          <FriendsActivitySection
            friendActivity={friendActivity}
            myFriendsCount={myFriends.length}
            onNavigateToProfile={() => navigate('/profile')}
            onPersonClick={(pid) => setPersonModalId(pid)}
          />
        )}
      </main>

      <SortPanel open={showSortPanel} onClose={() => setShowSortPanel(false)} sortBy={sortBy} setSortBy={setSortBy} showRating={activeSection === 'watched'} />

      <FilterPanel
        open={showFilterPanel} onClose={() => setShowFilterPanel(false)}
        categories={categories}
        filterCategoryIds={filterCategoryIds} setFilterCategoryIds={setFilterCategoryIds}
        filterYearFrom={filterYearFrom} setFilterYearFrom={setFilterYearFrom}
        filterYearTo={filterYearTo} setFilterYearTo={setFilterYearTo}
        filterActor={filterActor} setFilterActor={setFilterActor}
        filterActorId={filterActorId} setFilterActorId={setFilterActorId}
        filterDirector={filterDirector} setFilterDirector={setFilterDirector}
        filterDirectorId={filterDirectorId} setFilterDirectorId={setFilterDirectorId}
        filterGenreIds={filterGenreIds} setFilterGenreIds={setFilterGenreIds}
      />

      {watchedDetail && !reviewModal && !showReviewsModal && (
        <WatchedMovieModal
          movie={watchedDetail.movie}
          review={watchedDetail.review}
          onClose={() => setWatchedDetail(null)}
          onEdit={() => setReviewModal({ mode: 'edit', movie: watchedDetail.movie, reviewId: watchedDetail.review.id, initialRating: watchedDetail.review.rating, initialReviewText: watchedDetail.review.review_text ?? undefined, initialCategoryIds: watchedDetail.review.category_ids ?? [] })}
          onShare={() => setReviewModal({ mode: 'share', movie: watchedDetail.movie, reviewId: watchedDetail.review.id, initialCategoryIds: watchedDetail.review.category_ids ?? [] })}
          onRewatch={() => incrementRewatchMutation.mutate(watchedDetail.review.id)}
          onDecrementRewatch={() => decrementRewatchMutation.mutate(watchedDetail.review.id)}
          onGoToReviews={() => setShowReviewsModal(true)}
          onPersonClick={(pid) => setPersonModalId(pid)}
        />
      )}

      {watchedDetail && showReviewsModal && (
        <ReviewsListModal
          movie={watchedDetail.movie}
          myReview={watchedDetail.review}
          onClose={() => setShowReviewsModal(false)}
        />
      )}

      {watchlistDetail && !reviewModal && (
        <WatchlistMovieModal
          movie={watchlistDetail}
          onClose={() => setWatchlistDetail(null)}
          onRemove={() => removeFromWatchlistMutation.mutate(watchlistDetail.id)}
          onWriteReview={() => setReviewModal({
            mode: 'create', movie: watchlistDetail,
            onSaved: () => { removeFromWatchlistMutation.mutate(watchlistDetail.id); setWatchlistDetail(null) },
          })}
          onPersonClick={(pid) => setPersonModalId(pid)}
        />
      )}

      {reviewModal && (
        <ReviewModal
          movie={reviewModal.movie}
          mode={reviewModal.mode}
          reviewId={reviewModal.reviewId}
          initialRating={reviewModal.initialRating}
          initialReviewText={reviewModal.initialReviewText}
          initialCategoryIds={reviewModal.initialCategoryIds}
          onSaved={reviewModal.onSaved}
          onClose={() => setReviewModal(null)}
        />
      )}

      {personModalId !== null && (
        <PersonModal
          personId={personModalId}
          onClose={() => setPersonModalId(null)}
        />
      )}
    </div>
  )
}
