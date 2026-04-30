import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyReviews,
  getWatchlist,
  removeFromWatchlist,
  getRecommendations,
  getMyCategories,
  incrementRewatch,
  decrementRewatch,
  getBulkFriendRatings,
  getFriendActivity,
  getMovieReviews,
  getMyFriends,
} from '../services/apiClient'
import MovieCard from '../components/MovieCard'
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
function FilterPanel({
  open, onClose, categories, filterCategoryIds, setFilterCategoryIds,
  filterYearFrom, setFilterYearFrom, filterYearTo, setFilterYearTo,
  filterActor, setFilterActor, filterDirector, setFilterDirector,
}: {
  open: boolean; onClose: () => void
  categories: { id: string; name: string; outline_color: string | null; fill_color: string | null }[]
  filterCategoryIds: string[]; setFilterCategoryIds: (ids: string[]) => void
  filterYearFrom: string; setFilterYearFrom: (y: string) => void
  filterYearTo: string; setFilterYearTo: (y: string) => void
  filterActor: string; setFilterActor: (a: string) => void
  filterDirector: string; setFilterDirector: (d: string) => void
}) {
  const [myCatsOpen, setMyCatsOpen] = useState(true)
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const hasFilters = filterCategoryIds.length > 0 || filterYearFrom || filterYearTo || filterActor || filterDirector

  const toggleCategory = (id: string) => {
    setFilterCategoryIds(
      filterCategoryIds.includes(id) ? filterCategoryIds.filter((c) => c !== id) : [...filterCategoryIds, id]
    )
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
              <button onClick={() => { setFilterCategoryIds([]); setFilterYearFrom(''); setFilterYearTo(''); setFilterActor(''); setFilterDirector('') }}
                className="text-xs text-gray-muted hover:text-pink-brand transition-colors">Clear all</button>
            )}
            <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none">×</button>
          </div>
        </div>

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
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{ border: `2px solid ${border}`, backgroundColor: bg, color: '#e9e9e9', opacity: isSelected ? 1 : 0.7 }}>
                    {cat.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

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

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Actor</p>
          <input type="text" placeholder="Search actor…" value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)} className="input-base text-sm" />
          <p className="text-xs text-gray-muted/60 italic">Actor filtering coming soon</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Director</p>
          <input type="text" placeholder="Search director…" value={filterDirector}
            onChange={(e) => setFilterDirector(e.target.value)} className="input-base text-sm" />
          <p className="text-xs text-gray-muted/60 italic">Director filtering coming soon</p>
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
function WatchedMovieModal({ movie, review, onClose, onEdit, onShare, onRewatch, onDecrementRewatch, onGoToReviews }: {
  movie: Movie; review: Review; onClose: () => void; onEdit: () => void; onShare: () => void
  onRewatch: () => void; onDecrementRewatch: () => void; onGoToReviews: () => void
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
function WatchlistMovieModal({ movie, onClose, onRemove, onWriteReview }: {
  movie: Movie; onClose: () => void; onRemove: () => void; onWriteReview: () => void
}) {
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Poster'

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
          {movie.overview && <p className="text-sm text-gray-light/80 leading-relaxed line-clamp-5">{movie.overview}</p>}
          <p className="text-sm text-gray-muted italic">You haven't watched this yet.</p>
          <div className="mt-auto flex flex-wrap gap-2">
            <button onClick={onWriteReview} className="flex items-center gap-1.5 rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Write a Review
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
  friendActivity, myFriendsCount, onNavigateToProfile,
}: {
  friendActivity: FriendActivityItem[]
  myFriendsCount: number
  onNavigateToProfile: () => void
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
        />
      )}
    </>
  )
}

// ─── Friend Review Detail Modal ────────────────────────────────────────────────
function FriendReviewModal({ friendName, review, onClose }: {
  friendName: string
  review: FriendActivityItem['reviews'][number]
  onClose: () => void
}) {
  const movie = review.movies
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Poster'
  const totalWatched = (review.rewatch_count ?? 0) + 1

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['movie-reviews', movie.id],
    queryFn: () => getMovieReviews(movie.id),
    staleTime: 1000 * 60 * 2,
  })

  const otherFriendReviews = (reviewData?.friend_reviews ?? []).filter((r) => r.user_id !== review.user_id)

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

          {/* Other friend reviews */}
          {isLoading ? (
            <p className="text-xs text-gray-muted">Loading other reviews…</p>
          ) : otherFriendReviews.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Other Friends</p>
              <ul className="flex flex-col gap-2">
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
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyMoviesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeSection, setActiveSection] = useState<SidebarSection>('watched')
  const [searchQ, setSearchQ] = useState('')

  const [showSortPanel, setShowSortPanel] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey | null>(null)
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([])
  const [filterYearFrom, setFilterYearFrom] = useState('')
  const [filterYearTo, setFilterYearTo] = useState('')
  const [filterActor, setFilterActor] = useState('')
  const [filterDirector, setFilterDirector] = useState('')
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
    enabled: activeSection === 'Friends',
    refetchInterval: 60_000,
  })

  const { data: myFriends = [] } = useQuery({
    queryKey: ['my-friends'],
    queryFn: getMyFriends,
    enabled: activeSection === 'Friends',
  })

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
    const yr = w.movies.release_date ? parseInt(w.movies.release_date.slice(0, 4)) : null
    if (filterYearFrom && yr && yr < parseInt(filterYearFrom)) return false
    if (filterYearTo && yr && yr > parseInt(filterYearTo)) return false
    return true
  })

  const showSortFilter = activeSection !== 'Recommendations' && activeSection !== 'favourite-actors' && activeSection !== 'favourite-directors' && activeSection !== 'Friends'
  const activeFiltersCount = [filterCategoryIds.length > 0 ? 'x' : null, filterYearFrom, filterYearTo, filterActor, filterDirector].filter(Boolean).length

  const resetSectionState = () => {
    setWatchedDetail(null); setWatchlistDetail(null)
    setSortBy(null); setFilterCategoryIds([])
    setFilterYearFrom(''); setFilterYearTo(''); setFilterActor(''); setFilterDirector(''); setSearchQ('')
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
                onClick={() => { setActiveSection(link.id); resetSectionState() }}
                className={`sidebar-link w-full text-left flex items-center gap-2${activeSection === link.id ? ' active' : ''}`}
              >
                {link.label}
                {link.id === 'Recommendations' && unreadRecCount > 0 && (
                  <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{unreadRecCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Refactored for mobile: horizontal scroll nav replaces sidebar on small screens */}
      <nav className="md:hidden flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {SIDEBAR_LINKS.map((link) => (
          <button
            key={link.id}
            onClick={() => { setActiveSection(link.id); resetSectionState() }}
            className={['flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
              activeSection === link.id
                ? 'border-teal/60 bg-teal/10 text-teal-light'
                : 'border-white/15 bg-navy-card/40 text-gray-muted'].join(' ')}
          >
            {link.label}
            {link.id === 'Recommendations' && unreadRecCount > 0 && (
              <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{unreadRecCount}</span>
            )}
          </button>
        ))}
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
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-gray-300">No favourite actors saved yet.</p>
            <p className="text-xs text-gray-400">This feature is coming soon.</p>
          </div>
        )}

        {activeSection === 'favourite-directors' && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-gray-300">No favourite directors saved yet.</p>
            <p className="text-xs text-gray-400">This feature is coming soon.</p>
          </div>
        )}

        {activeSection === 'Recommendations' && <RecommendationsSection />}

        {activeSection === 'Friends' && (
          <FriendsActivitySection
            friendActivity={friendActivity}
            myFriendsCount={myFriends.length}
            onNavigateToProfile={() => navigate('/profile')}
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
        filterDirector={filterDirector} setFilterDirector={setFilterDirector}
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
    </div>
  )
}
