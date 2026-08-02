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
import MovieDetailModal from '../../components/MovieDetailModal'
import PersonModal from '../../components/PersonModal'
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

// ─── Movie overview modal (shared MovieDetailModal, fed with this notification's sender) ──
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
  const inWatchlist = watchlistIds.has(movie.id)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [personModalId, setPersonModalId] = useState<number | null>(null)

  const { data: reviewData } = useQuery<MovieReviewsData>({
    queryKey: ['movie-reviews', movie.id],
    queryFn: () => getMovieReviews(movie.id),
    staleTime: 1000 * 60 * 2,
  })
  const myReview = reviewData?.my_review ?? null

  return (
    <>
      <MovieDetailModal
        movie={movie}
        onClose={onClose}
        onPersonClick={(pid) => setPersonModalId(pid)}
        recommendationOverride={{
          sender: recommendation.sender,
          sender_review: recommendation.sender_review,
          recommended_at: recommendation.created_at,
        }}
        actions={[
          {
            key: 'watchlist',
            label: inWatchlist ? 'In Watchlist' : 'Add to Watchlist',
            variant: inWatchlist ? 'outline' : 'primary',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {inWatchlist ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                )}
              </svg>
            ),
            onClick: () => (inWatchlist ? onRemoveWatchlist(movie) : onAddWatchlist(movie)),
          },
          {
            key: 'review',
            label: myReview ? 'Edit Review' : 'Write a Review',
            variant: 'teal',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
            onClick: () => setShowReviewModal(true),
          },
        ]}
      />

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

      {personModalId !== null && (
        <PersonModal personId={personModalId} onClose={() => setPersonModalId(null)} />
      )}
    </>
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
        genre_ids: rec.movies.genre_ids,
        vote_average: rec.movies.vote_average,
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[2/3] w-full animate-pulse rounded-card bg-navy-card/60" />
              <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-navy-card/60" />
            </div>
          ))}
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
