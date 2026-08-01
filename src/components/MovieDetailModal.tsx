import { useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMovieDetails, getMovieReviews } from '../services/apiClient'
import StarRating from './StarRating'
import MovieDescriptionPanel from './MovieDescriptionPanel'
import type { Movie, MovieDetails, MovieReviewsData, Review, MovieRecommendationInfo } from '../types'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280'
const FALLBACK_IMG = 'https://via.placeholder.com/342x513?text=No+Poster'

export interface MovieDetailAction {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'primary' | 'teal' | 'outline' | 'danger' | 'magenta'
  active?: boolean
  disabled?: boolean
}

interface Props {
  movie: Movie
  onClose: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void

  /** Pass the caller's own review object directly (e.g. from the watched list) so rewatch-count
   *  updates made via local state are reflected immediately without waiting on a refetch. */
  myReviewOverride?: Review | null

  /** Rewatch controls — omit entirely for movies that haven't been reviewed yet. */
  rewatch?: { onIncrement: () => void; onDecrement: () => void }

  /** Known recommendation context (e.g. opened straight from a specific notification card).
   *  Falls back to the server-derived value for the movie when omitted. */
  recommendationOverride?: MovieRecommendationInfo | null
  /** Tag shown next to the pinned reviewer's name. Pass null to hide it (e.g. a friend's
   *  activity feed review isn't necessarily something they "recommended" to you). */
  pinnedTagLabel?: string | null
  /** Accent color for the pinned review card — magenta for real recommendations, teal for
   *  a friend's own activity being featured. */
  pinnedAccent?: 'magenta' | 'teal'
  /** Override the date shown on the pinned review (e.g. "Watched 3 times" instead of a date). */
  pinnedMetaText?: string

  /** Extra content rendered between the rating stats and the description panel — used for
   *  inline expandable panels such as "Send to Friends". */
  extraContent?: ReactNode

  /** Footer action buttons, rendered left to right. */
  actions: MovieDetailAction[]
}

const actionVariantClasses: Record<NonNullable<MovieDetailAction['variant']>, string> = {
  primary: 'bg-magenta text-white hover:bg-magenta/90 active:scale-95',
  teal: 'border border-teal/40 bg-teal/10 text-teal-light hover:bg-teal/20',
  outline: 'border border-white/15 bg-navy-card/60 text-gray-lighter hover:bg-white/10 hover:border-white/30',
  danger: 'border border-pink-brand/40 bg-pink-brand/10 text-pink-brand hover:bg-pink-brand/20',
  magenta: 'border border-magenta/40 bg-magenta/10 text-magenta hover:bg-magenta/20',
}

function ActionButton({ action }: { action: MovieDetailAction }) {
  const variant = action.variant ?? 'outline'
  return (
    <button
      onClick={action.onClick}
      disabled={action.disabled}
      className={[
        'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        actionVariantClasses[variant],
        action.active ? 'ring-2 ring-teal/50' : '',
      ].join(' ')}
    >
      {action.icon}
      {action.label}
    </button>
  )
}

function StatChip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-3 min-w-[140px]">
      <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wide">{label}</p>
      {children}
    </div>
  )
}

/** Single shared, responsive movie-details dialog used across search, watched, watchlist,
 *  friend-recommendation and friend-activity contexts so the presentation is identical everywhere. */
export default function MovieDetailModal({
  movie,
  onClose,
  onPersonClick,
  myReviewOverride,
  rewatch,
  recommendationOverride,
  pinnedTagLabel = 'recommended this',
  pinnedAccent = 'magenta',
  pinnedMetaText,
  extraContent,
  actions,
}: Props) {
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : FALLBACK_IMG

  const { data, isLoading } = useQuery<MovieReviewsData>({
    queryKey: ['movie-reviews', movie.id],
    queryFn: () => getMovieReviews(movie.id),
    staleTime: 1000 * 60 * 2,
  })

  // Shares its cache with MovieDescriptionPanel's identical query, so this rarely costs an extra request.
  const { data: details } = useQuery<MovieDetails>({
    queryKey: ['movie-details', movie.id],
    queryFn: () => getMovieDetails(movie.id),
    staleTime: 1000 * 60 * 60,
  })
  const backdropUrl = details?.backdrop_path ? `${TMDB_BACKDROP}${details.backdrop_path}` : null

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const myReview = myReviewOverride !== undefined ? myReviewOverride : (data?.my_review ?? null)
  const avgRating = data?.avg_friend_rating ?? null
  const recommendation = recommendationOverride !== undefined ? recommendationOverride : (data?.recommendation ?? null)
  const recommenderId = recommendation?.sender?.id
  const otherFriendReviews = (data?.friend_reviews ?? []).filter((r) => r.user_id !== recommenderId)
  const rewatchCount = myReview?.rewatch_count ?? 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/80 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="dialog-scale-in relative mx-auto flex max-h-screen w-full max-w-4xl flex-col overflow-hidden bg-navy-wine shadow-2xl sm:my-8 sm:max-h-[88vh] sm:rounded-2xl sm:border sm:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — floats over whichever corner is on top */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-lg leading-none text-white/90 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
        >
          ×
        </button>

        {/* Hero banner — a wide scene still from the film (TMDB backdrop), cropped to fill
            since it's context/atmosphere rather than something that needs to stay uncropped. */}
        {backdropUrl && (
          <div className="relative h-36 w-full shrink-0 bg-navy-card sm:h-48 md:h-56 lg:h-64">
            <img src={backdropUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-wine via-navy-wine/5 to-transparent" />
          </div>
        )}

        {/* Poster thumbnail + title — sits beside the title rather than above it, and overlaps
            the bottom of the banner (when present) the way a lot of streaming apps do it. */}
        <div
          className={[
            'flex shrink-0 items-end gap-3 px-5 sm:gap-4 sm:px-6',
            backdropUrl ? '-mt-10 sm:-mt-14' : 'pt-5 sm:pt-6',
          ].join(' ')}
        >
          <div className="w-16 shrink-0 overflow-hidden rounded-lg border-2 border-navy-wine bg-navy-card shadow-lg sm:w-20 md:w-24">
            <div className="aspect-[2/3] w-full">
              <img src={posterUrl} alt={`${movie.title} poster`} className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h2 className="text-lg font-bold leading-tight text-gray-lighter sm:text-2xl">{movie.title}</h2>
            {movie.release_date && (
              <p className="mt-0.5 text-sm text-gray-muted">{movie.release_date.slice(0, 4)}</p>
            )}
          </div>
        </div>

        {/* Details — scrollable */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 pt-4 sm:gap-5 sm:p-6 sm:pt-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-sm text-gray-muted">Loading…</span>
            </div>
          ) : (
            <>
              {/* Rating stats */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <StatChip label="Your Rating">
                  {myReview ? (
                    <div className="flex items-center gap-2">
                      <StarRating value={myReview.rating} readOnly size="sm" />
                      <span className="text-xs text-gray-muted">{myReview.rating}/5</span>
                    </div>
                  ) : (
                    <span className="text-sm italic text-gray-muted">Not watched yet</span>
                  )}
                </StatChip>
                <StatChip label="Avg Rating (You & Friends)">
                  {avgRating !== null ? (
                    <div className="flex items-center gap-2">
                      <StarRating value={Math.round(avgRating)} readOnly size="sm" accentColor="text-yellow-400" />
                      <span className="text-xs text-gray-muted">{avgRating}/5</span>
                    </div>
                  ) : (
                    <span className="text-sm italic text-gray-muted">No reviews yet</span>
                  )}
                </StatChip>
              </div>

              {/* Your review text + rewatch controls */}
              {myReview && (
                <div className="flex flex-col gap-2.5">
                  {myReview.review_text && (
                    <p className="text-sm leading-relaxed text-gray-light/80">{myReview.review_text}</p>
                  )}
                  {rewatch && (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-gray-muted">
                        Watched <span className="font-semibold text-gray-lighter">{rewatchCount + 1}</span> time
                        {rewatchCount + 1 !== 1 ? 's' : ''}
                      </p>
                      {rewatchCount > 0 && (
                        <button
                          onClick={rewatch.onDecrement}
                          title="Remove a rewatch"
                          className="flex items-center gap-1 rounded-lg border border-white/15 bg-navy-card/40 px-2 py-1.5 text-xs font-medium text-gray-muted hover:border-white/30 hover:text-gray-lighter transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={rewatch.onIncrement}
                        className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-navy-card/40 px-3 py-1.5 text-xs font-medium text-gray-lighter hover:border-white/30 hover:bg-white/5 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Re-watched
                      </button>
                    </div>
                  )}
                </div>
              )}

              {extraContent}

              <MovieDescriptionPanel movieId={movie.id} overview={movie.overview} onPersonClick={onPersonClick} />

              {/* Reviews */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-lighter">Reviews:</p>
                <ul className="flex flex-col gap-4">
                  {recommendation && (recommendation.sender_review || recommendation.sender) && (
                    <li
                      className="flex flex-col gap-1.5 rounded-lg p-3"
                      style={
                        pinnedAccent === 'teal'
                          ? { border: '2px solid #14ceca', background: 'rgba(20,206,202,0.06)' }
                          : { border: '2px solid #dd3ee3', background: 'rgba(221,62,227,0.06)' }
                      }
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className={[
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                            pinnedAccent === 'teal' ? 'border-teal/50 bg-teal/20' : 'border-magenta/50 bg-magenta/20',
                          ].join(' ')}
                        >
                          <span className={['text-xs font-semibold', pinnedAccent === 'teal' ? 'text-teal-light' : 'text-magenta'].join(' ')}>
                            {recommendation.sender?.username?.slice(0, 2).toUpperCase() ?? '??'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-lighter">
                          {recommendation.sender?.username ?? 'Unknown'}
                        </span>
                        {pinnedTagLabel && (
                          <span className={['text-xs font-medium', pinnedAccent === 'teal' ? 'text-teal-light' : 'text-magenta'].join(' ')}>
                            {pinnedTagLabel}
                          </span>
                        )}
                        {recommendation.sender_review && (
                          <StarRating value={recommendation.sender_review.rating} readOnly size="sm" accentColor="text-yellow-400" />
                        )}
                        <span className="ml-auto text-xs text-gray-muted">
                          {pinnedMetaText ?? new Date(recommendation.sender_review?.created_at ?? recommendation.recommended_at).toLocaleDateString()}
                        </span>
                      </div>
                      {recommendation.sender_review?.review_text && (
                        <p className="ml-10 text-sm leading-relaxed text-gray-light/70">
                          {recommendation.sender_review.review_text}
                        </p>
                      )}
                    </li>
                  )}

                  {otherFriendReviews.map((rev) => (
                    <li key={rev.id} className="flex flex-col gap-1.5 border-b border-white/8 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-navy-card/60">
                          <span className="text-xs font-semibold text-gray-lighter">
                            {rev.profiles?.username?.slice(0, 2).toUpperCase() ?? '??'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-lighter">{rev.profiles?.username ?? 'Unknown'}</span>
                        <StarRating value={rev.rating} readOnly size="sm" accentColor="text-yellow-400" />
                        <span className="ml-auto text-xs text-gray-muted">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      {rev.review_text && <p className="ml-10 text-sm leading-relaxed text-gray-light/70">{rev.review_text}</p>}
                    </li>
                  ))}

                  {!recommendation && otherFriendReviews.length === 0 && (
                    <p className="text-sm italic text-gray-muted">No reviews yet for this movie.</p>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            {actions.map((action) => (
              <ActionButton key={action.key} action={action} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
