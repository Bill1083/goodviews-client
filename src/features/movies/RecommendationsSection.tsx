import { useEffect, useRef, useState } from 'react'
import ReviewModal from '../reviews/ReviewModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRecommendations,
  markRecommendationRead,
  dismissRecommendation,
  getMovieReviews,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
} from '../../services/apiClient'
import StarRating from '../../components/StarRating'
import type { Recommendation, Movie, MovieReviewsData } from '../../types'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const FALLBACK_IMG = 'https://via.placeholder.com/342x513?text=No+Poster'

// ─── Bell SVG ────────────────────────────────────────────────────────────────
function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        stroke={hasUnread ? '#dd3ee3' : '#6b6969'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {hasUnread && (
        <circle cx="18" cy="6" r="3.5" fill="#dd3ee3" />
      )}
    </svg>
  )
}

// ─── Movie overview modal (mirrors SearchPage overview step) ──────────────────
function MovieOverviewModal({
  recommendation,
  onClose,
  watchlistIds,
  onAddWatchlist,
  onRemoveWatchlist,
}: {
  recommendation: Recommendation
  onClose: () => void
  watchlistIds: Set<number>
  onAddWatchlist: (movie: Movie) => void
  onRemoveWatchlist: (movie: Movie) => void
}) {
  const movie = recommendation.movies as Movie
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : FALLBACK_IMG
  const inWatchlist = watchlistIds.has(movie.id)

  const { data: reviewData, isLoading: reviewsLoading } = useQuery<MovieReviewsData>({
    queryKey: ['movie-reviews', movie.id],
    queryFn: () => getMovieReviews(movie.id),
    staleTime: 1000 * 60 * 2,
  })

  const myReview = reviewData?.my_review ?? null
  const friendReviews = reviewData?.friend_reviews ?? []
  const avgRating = reviewData?.avg_friend_rating ?? null
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Separate sender review from others so we can pin it at top
  const senderReview = recommendation.sender_review
  const senderUserId = recommendation.sender_id
  const otherReviews = friendReviews.filter((r) => r.user_id !== senderUserId)
  const senderFromFriends = friendReviews.find((r) => r.user_id === senderUserId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="mx-auto flex max-w-4xl w-full items-stretch rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        {/* Left — poster */}
        <div className="w-56 shrink-0 relative bg-navy-card">
          <img
            src={posterUrl}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3">
            <p className="text-sm font-bold text-white leading-tight">{movie.title}</p>
          </div>
        </div>

        {/* Right — details */}
        <div className="flex flex-1 flex-col gap-5 bg-navy-wine/95 p-7 overflow-y-auto">
          <button
            onClick={onClose}
            className="self-start text-xs text-gray-muted hover:text-gray-lighter transition-colors"
          >
            ← Back
          </button>

          <h2 className="text-2xl font-bold text-gray-lighter text-center">{movie.title}</h2>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-muted">Loading…</span>
            </div>
          ) : (
            <>
              {/* Your rating */}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-gray-lighter">Your Rating:</p>
                {myReview ? (
                  <div className="flex items-center gap-2">
                    <StarRating value={myReview.rating} readOnly size="sm" />
                    <span className="text-xs text-gray-muted">{myReview.rating}/5 Stars</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-muted italic">No Review yet</span>
                )}
              </div>

              {/* Avg rating */}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-gray-lighter">Avg Rating (You &amp; Friends):</p>
                {avgRating !== null ? (
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(avgRating)} readOnly size="sm" accentColor="text-yellow-400" />
                    <span className="text-xs text-gray-muted">{avgRating}/5 Stars</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-muted italic">No reviews yet</span>
                )}
              </div>

              {/* Watchlist + Review buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    inWatchlist ? onRemoveWatchlist(movie) : onAddWatchlist(movie)
                  }
                  className={[
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                    inWatchlist
                      ? 'bg-navy-card/80 border border-white/15 text-gray-lighter hover:bg-white/10'
                      : 'bg-magenta text-white hover:bg-magenta/90 active:scale-95',
                  ].join(' ')}
                >
                  {inWatchlist ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add to Watchlist
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-teal/10 border border-teal/40 text-teal-light hover:bg-teal/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {myReview ? 'Edit Review' : 'Write a Review'}
                </button>
              </div>

              {/* Reviews */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-lighter">Reviews:</p>

                <ul className="flex flex-col gap-4">
                  {/* Sender's review pinned at top with pink outline */}
                  {(senderFromFriends ?? senderReview) && (
                    <li
                      className="flex flex-col gap-1.5 rounded-lg p-3"
                      style={{
                        border: '2px solid #dd3ee3',
                        background: 'rgba(221,62,227,0.06)',
                      }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="h-8 w-8 rounded-full bg-magenta/20 border border-magenta/50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-magenta">
                            {recommendation.sender?.username?.slice(0, 2).toUpperCase() ?? '??'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-lighter">
                          {recommendation.sender?.username ?? 'Unknown'}
                        </span>
                        <span className="text-xs text-magenta font-medium">recommended this</span>
                        <StarRating
                          value={(senderFromFriends ?? senderReview)!.rating}
                          readOnly
                          size="sm"
                          accentColor="text-yellow-400"
                        />
                        <span className="ml-auto text-xs text-gray-muted">
                          {new Date((senderFromFriends ?? senderReview)!.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {(senderFromFriends ?? senderReview)!.review_text && (
                        <p className="text-sm text-gray-light/70 leading-relaxed ml-10">
                          {(senderFromFriends ?? senderReview)!.review_text}
                        </p>
                      )}
                    </li>
                  )}

                  {/* Other friend reviews */}
                  {otherReviews.map((rev) => (
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

                  {!senderFromFriends && !senderReview && otherReviews.length === 0 && (
                    <p className="text-sm text-gray-muted italic">No reviews yet for this movie.</p>
                  )}
                </ul>
              </div>
            </>
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
          initialCategoryId={myReview?.category_id ?? ''}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  )
}

// ─── Single recommendation movie card ────────────────────────────────────────
function RecMovieCard({
  rec,
  isNew,
  inWatchlist,
  onOpen,
  onAddWatchlist,
  onDismiss,
}: {
  rec: Recommendation
  isNew: boolean
  inWatchlist: boolean
  onOpen: () => void
  onAddWatchlist: () => void
  onDismiss: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const movie = rec.movies as Movie
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : FALLBACK_IMG

  return (
    <article
      className={[
        'poster-card relative select-none',
        isNew ? 'rec-card-new' : '',
      ].join(' ')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      style={{ cursor: 'pointer' }}
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-lg relative">
        <img
          src={posterUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {/* Hover overlay */}
        {hovered && (
          <div
            className="absolute inset-0 flex flex-col justify-end pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)',
            }}
          >
            {/* Dismiss button — top right */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDismiss()
              }}
              title="Dismiss recommendation"
              className="pointer-events-auto absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-gray-muted hover:text-white hover:bg-black/80 transition-colors"
              aria-label="Dismiss"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Watchlist bar — bottom */}
            <div className="pointer-events-auto flex items-center gap-1.5 px-2 py-2.5">
              <span className="flex-1 text-xs text-white/90 leading-snug">
                {inWatchlist ? 'In watchlist' : 'Add to watchlist'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!inWatchlist) onAddWatchlist()
                }}
                title={inWatchlist ? 'Already in watchlist' : 'Add to watchlist'}
                disabled={inWatchlist}
                className="shrink-0 transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-default"
                aria-label={inWatchlist ? 'Already in watchlist' : 'Add to watchlist'}
              >
                {inWatchlist ? (
                  <svg width="19" height="18" viewBox="3274 7722 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3290.921875,7731.84375C3290.328125,7734.65625,3288.089599609375,7737.3037109375,3284.94775390625,7737.896484375C3281.805908203125,7738.48828125,3278.61767578125,7737.103515625,3277.040283203125,7734.46240234375C3275.462890625,7731.8212890625,3275.852294921875,7728.51904296875,3278.006103515625,7726.2724609375C3280.16015625,7724.0263671875,3283.796875,7723.40625,3286.765625,7724.53125"
                      fill="none" strokeLinejoin="round" strokeLinecap="round"
                      style={{ stroke: '#e1e1e1', strokeWidth: 1.5 }} />
                    <path d="M3280.828125,7730.71875L3283.796875,7733.53125L3290.921875,7726.21875"
                      fill="none" strokeLinejoin="round" strokeLinecap="round"
                      style={{ stroke: '#e1e1e1', strokeWidth: 1.5 }} />
                  </svg>
                ) : (
                  <svg width="19" height="18" viewBox="2956 4056 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="2965.5" cy="4065" rx="7.917" ry="7.5"
                      style={{ fill: 'none', stroke: '#fff', strokeOpacity: 0.9, strokeWidth: 1.5 }} />
                    <path d="M2967.875,4065L2965.5,4065M2965.5,4065L2963.125,4065M2965.5,4065L2965.5,4062.75M2965.5,4065L2965.5,4067.25"
                      fill="none" strokeLinecap="round"
                      style={{ stroke: '#fff', strokeOpacity: 0.9, strokeWidth: 1.5 }} />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs font-medium text-gray-lighter line-clamp-2 leading-snug">
        {movie.title}
      </p>
    </article>
  )
}

// ─── Main section component ───────────────────────────────────────────────────
export default function RecommendationsSection() {
  const qc = useQueryClient()
  const [openRec, setOpenRec] = useState<Recommendation | null>(null)
  const bellRef = useRef<HTMLSpanElement>(null)
  const wiggleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: recommendations = [], isLoading } = useQuery<Recommendation[]>({
    queryKey: ['recommendations'],
    queryFn: getRecommendations,
    refetchInterval: 30_000, // poll every 30s for new recs
  })

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
  })

  const watchlistIds = new Set(watchlist.map((w) => w.movie_id))
  const unreadCount = recommendations.filter((r) => !r.is_read).length
  const hasUnread = unreadCount > 0

  // Bell wiggle every 5 seconds when there are unread recommendations
  useEffect(() => {
    if (!hasUnread) {
      if (wiggleTimerRef.current) clearInterval(wiggleTimerRef.current)
      return
    }

    const triggerWiggle = () => {
      const el = bellRef.current
      if (!el) return
      el.classList.remove('bell-wiggle')
      // Force reflow to restart the animation
      void el.offsetWidth
      el.classList.add('bell-wiggle')
    }

    triggerWiggle()
    wiggleTimerRef.current = setInterval(triggerWiggle, 5000)

    return () => {
      if (wiggleTimerRef.current) clearInterval(wiggleTimerRef.current)
    }
  }, [hasUnread])

  const markReadMutation = useMutation({
    mutationFn: markRecommendationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  })

  const dismissMutation = useMutation({
    mutationFn: dismissRecommendation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  })

  const watchlistAddMutation = useMutation({
    mutationFn: (rec: Recommendation) =>
      addToWatchlist({
        movie_id: rec.movies.id,
        title: rec.movies.title,
        poster_path: rec.movies.poster_path,
        release_date: rec.movies.release_date,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const watchlistRemoveMutation = useMutation({
    mutationFn: (movieId: number) => removeFromWatchlist(movieId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const handleOpen = (rec: Recommendation) => {
    setOpenRec(rec)
    if (!rec.is_read) markReadMutation.mutate(rec.id)
  }

  const handleAddWatchlist = (rec: Recommendation) => {
    watchlistAddMutation.mutate(rec)
    if (!rec.is_read) markReadMutation.mutate(rec.id)
  }

  const handleDismiss = (rec: Recommendation) => {
    dismissMutation.mutate(rec.id)
    if (openRec?.id === rec.id) setOpenRec(null)
  }

  // Group by sender
  const grouped = recommendations.reduce<Record<string, Recommendation[]>>((acc, rec) => {
    const key = rec.sender_id
    if (!acc[key]) acc[key] = []
    acc[key].push(rec)
    return acc
  }, {})

  const senderGroups = Object.values(grouped)

  return (
    <>
      {/* Section header with bell */}
      <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
        <h2 className="text-lg font-semibold text-gray-lighter">Recommendations for Me</h2>
        <span ref={bellRef} className="inline-flex items-center" aria-label={hasUnread ? `${unreadCount} new recommendations` : 'No new recommendations'}>
          <BellIcon hasUnread={hasUnread} />
        </span>
        {hasUnread && (
          <span className="rounded-full bg-magenta px-2 py-0.5 text-xs font-bold text-white leading-none">
            {unreadCount}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <span className="text-sm text-gray-muted">Loading…</span>
        </div>
      ) : senderGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <span ref={bellRef} className="inline-flex items-center opacity-40">
            <BellIcon hasUnread={false} />
          </span>
          <p className="text-gray-300">No recommendations yet.</p>
          <p className="text-xs text-gray-400">
            When a friend sends you a movie it will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {senderGroups.map((group) => {
            const sender = group[0].sender
            return (
              <section key={group[0].sender_id}>
                <p className="mb-3 text-sm font-semibold text-gray-lighter">
                  {sender?.username ?? 'Someone'} Recommends:
                </p>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5 my-2">
                  {group.map((rec) => (
                    <RecMovieCard
                      key={rec.id}
                      rec={rec}
                      isNew={!rec.is_read}
                      inWatchlist={watchlistIds.has(rec.movies.id)}
                      onOpen={() => handleOpen(rec)}
                      onAddWatchlist={() => handleAddWatchlist(rec)}
                      onDismiss={() => handleDismiss(rec)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Movie overview modal */}
      {openRec && (
        <MovieOverviewModal
          recommendation={openRec}
          onClose={() => setOpenRec(null)}
          watchlistIds={watchlistIds}
          onAddWatchlist={(movie) => {
            watchlistAddMutation.mutate({
              ...openRec,
              movies: movie,
            })
          }}
          onRemoveWatchlist={(movie) => watchlistRemoveMutation.mutate(movie.id)}
        />
      )}
    </>
  )
}
