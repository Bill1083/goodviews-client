import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { invalidateTasteStats } from '../utils/tasteStatsCache'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createReview, getMovieDetails, getMovieReviews, updateReview, type NotInterestedScope } from '../services/apiClient'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useCloseOnBack } from '../hooks/useCloseOnBack'
import { getLastPointerPosition } from '../utils/pointerTracker'
import { dropFromForYouFeed, refreshForYouFeed } from '../utils/forYouCache'
import StarRating from './StarRating'
import WatchProvidersModal from './WatchProvidersModal'
import RetryImage from './RetryImage'
import type { Movie, MovieDetails, MovieReviewsData, Review, MovieRecommendationInfo, CastMember } from '../types'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280'
const TMDB_PROFILE = 'https://image.tmdb.org/t/p/w185'
const TMDB_PROVIDER_LOGO = 'https://image.tmdb.org/t/p/w92'
// Only Australia for now — TMDB's watch/providers response includes every country in one
// payload, so supporting more regions later is just reading a different key here.
const REGION = 'AU'

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

  /** Extra content rendered directly below the action buttons — used for inline expandable
   *  panels such as "Send to Friends". */
  extraContent?: ReactNode

  /** Shown as a small banner at the top of the details section when this movie was opened
   *  from the "For You" page — e.g. "Because you liked Inception" or "Alex rated this highly". */
  forYouReason?: string | null

  /** Shows the "not interested" menu beside the For You reason when provided. */
  onNotInterested?: (scope: NotInterestedScope) => void

  /** Action buttons (write review, watchlist, send to friends, etc.), rendered left to right
   *  above the reviews list. */
  actions: MovieDetailAction[]
}

/** Dark outline + soft glow so the stars stay legible against the bright backdrop behind them. */
const STAR_SHADOW = '0 0 2px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.85), 0 0 10px rgba(0,0,0,0.45)'

/** Actions promoted out of the button row into icon-only buttons beside the stars. */
const INLINE_ACTION_KEYS = ['watchlist', 'send']

const NOT_INTERESTED_OPTIONS: { scope: NotInterestedScope; label: string }[] = [
  { scope: 'movie', label: 'Not interested in this movie' },
  { scope: 'type', label: 'Not interested in these types of movies' },
]

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

/** The same action rendered as a compact icon-only square — label kept for tooltip/screen readers. */
function IconActionButton({ action }: { action: MovieDetailAction }) {
  const variant = action.variant ?? 'outline'
  return (
    <button
      onClick={action.onClick}
      disabled={action.disabled}
      aria-label={action.label}
      title={action.label}
      className={[
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        actionVariantClasses[variant],
        action.active ? 'ring-2 ring-teal/50' : '',
      ].join(' ')}
    >
      {action.icon}
    </button>
  )
}

/** Mirrors the real hero banner's layout so it doesn't pop/reflow once the backdrop arrives. */
function BannerSkeleton() {
  return (
    <div className="relative h-40 w-full shrink-0 overflow-hidden bg-navy-card sm:h-44 md:h-52 lg:h-56 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-navy-wine via-navy-wine/70 to-navy-card/40" />
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-5 pb-4 sm:gap-4 sm:px-6 sm:pb-5">
        <div className="aspect-[2/3] w-20 shrink-0 rounded-lg border-2 border-white/10 bg-navy-card/80 sm:w-24 md:w-28" />
        <div className="min-w-0 flex-1 pb-1">
          <div className="h-5 w-2/3 rounded bg-navy-card/80 sm:h-7" />
        </div>
      </div>
    </div>
  )
}

/** Mirrors the loaded body block-for-block, at matching heights, so nothing moves under
 *  the user's thumb when the data lands — tapping a star or "not interested" the instant
 *  the modal opens shouldn't land on whatever slid into that spot. */
function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Quick rate: label, stars + icon buttons, hint line */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-24 rounded bg-navy-card/70" />
        <div className="flex items-center justify-between gap-3">
          <div className="h-9 w-44 rounded bg-navy-card/70" />
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-lg bg-navy-card/70" />
            <div className="h-9 w-9 rounded-lg bg-navy-card/70" />
          </div>
        </div>
        <div className="h-4 w-64 max-w-full rounded bg-navy-card/70" />
      </div>

      {/* Avg rating chip */}
      <div className="h-[69px] w-48 rounded-xl bg-navy-card/70" />

      {/* Synopsis — three lines, the collapsed height */}
      <div className="flex flex-col gap-2 py-0.5">
        <div className="h-4 w-full rounded bg-navy-card/70" />
        <div className="h-4 w-full rounded bg-navy-card/70" />
        <div className="h-4 w-2/3 rounded bg-navy-card/70" />
      </div>

      {/* Providers row */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 rounded bg-navy-card/70" />
        <div className="h-6 w-6 shrink-0 rounded-md bg-navy-card/70" />
        <div className="h-6 w-6 shrink-0 rounded-md bg-navy-card/70" />
      </div>

      {/* "More" toggle, including its divider and the gap above its collapsed panel */}
      <div className="flex flex-col gap-4 border-t border-white/8 pt-4">
        <div className="h-5 w-16 rounded bg-navy-card/70" />
        <div className="h-0" />
      </div>

      {/* Bottom-right action button */}
      <div className="h-9 w-36 self-end rounded-lg bg-navy-card/70" />
    </div>
  )
}

function StatChip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 self-start rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-3 min-w-[140px]">
      <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wide">{label}</p>
      {children}
    </div>
  )
}

function CastAvatar({
  actor,
  onPersonClick,
  size = 'md',
}: {
  actor: CastMember
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
  size?: 'sm' | 'md'
}) {
  const dimension = size === 'sm' ? 'h-12 w-12' : 'h-14 w-14'
  return (
    <div
      className={['flex w-16 shrink-0 flex-col items-center gap-1 text-center', onPersonClick ? 'cursor-pointer group' : ''].join(' ')}
      onClick={onPersonClick ? () => onPersonClick(actor.id, actor.name, 'actor') : undefined}
      role={onPersonClick ? 'button' : undefined}
      tabIndex={onPersonClick ? 0 : undefined}
      onKeyDown={onPersonClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onPersonClick(actor.id, actor.name, 'actor') } : undefined}
    >
      <div className={[dimension, 'shrink-0 overflow-hidden rounded-full border bg-navy-card/60 transition-colors', onPersonClick ? 'border-white/10 group-hover:border-magenta/50' : 'border-white/10'].join(' ')}>
        {actor.profile_path ? (
          <RetryImage
            src={`${TMDB_PROFILE}${actor.profile_path}`}
            alt={actor.name}
            className="h-full w-full object-cover"
            loading="lazy"
            fallback={<div className="flex h-full w-full items-center justify-center text-xs text-gray-muted">?</div>}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-muted">?</div>
        )}
      </div>
      <p className={['w-full line-clamp-2 text-[10px] leading-tight transition-colors', onPersonClick ? 'text-gray-lighter group-hover:text-magenta' : 'text-gray-lighter'].join(' ')}>
        {actor.name}
      </p>
      <p className="w-full line-clamp-1 text-[10px] italic leading-tight text-gray-muted">{actor.character}</p>
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
  forYouReason,
  onNotInterested,
}: Props) {
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null
  const [showAllCast, setShowAllCast] = useState(false)
  const [showProviders, setShowProviders] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [showNotInterestedMenu, setShowNotInterestedMenu] = useState(false)
  const notInterestedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showNotInterestedMenu) return
    const closeOnOutsidePress = (e: PointerEvent) => {
      if (!notInterestedRef.current?.contains(e.target as Node)) setShowNotInterestedMenu(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [showNotInterestedMenu])
  const [optimisticRating, setOptimisticRating] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  useBodyScrollLock(true)
  useCloseOnBack(onClose)

  // Anchor the entrance animation's transform-origin to wherever the user actually
  // clicked/tapped, so the dialog visually launches forward from the poster they
  // selected instead of just fading in centered on the screen.
  useLayoutEffect(() => {
    const el = dialogRef.current
    const origin = getLastPointerPosition()
    if (!el || !origin) return
    const rect = el.getBoundingClientRect()
    el.style.transformOrigin = `${origin.x - rect.left}px ${origin.y - rect.top}px`
  }, [])

  const { data, isLoading } = useQuery<MovieReviewsData>({
    queryKey: ['movie-reviews', movie.id],
    queryFn: () => getMovieReviews(movie.id),
    staleTime: 1000 * 60 * 2,
  })

  // Shares its cache with MovieDescriptionPanel's identical query, so this rarely costs an extra request.
  const { data: details, isLoading: detailsLoading } = useQuery<MovieDetails>({
    queryKey: ['movie-details', movie.id],
    queryFn: () => getMovieDetails(movie.id),
    staleTime: 1000 * 60 * 60,
  })
  const backdropUrl = details?.backdrop_path ? `${TMDB_BACKDROP}${details.backdrop_path}` : null
  const directors = details?.credits?.crew?.filter((c) => c.job === 'Director') ?? []
  const allCast = details?.credits?.cast ?? []
  const topCast = allCast.slice(0, 3)
  const restCast = allCast.slice(3)
  const genres = details?.genres ?? []
  const runtime = details?.runtime
  const displayOverview = details?.overview ?? movie.overview
  const auProviders = details?.['watch/providers']?.results?.[REGION]
  const flatrateProviders = auProviders?.flatrate ?? []

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

  // Lets a tap on a star submit a rating immediately, without opening the full
  // review form — that form is still reachable via the "Write a Review" action
  // for anyone who also wants to add text/categories/sharing.
  const rateMutation = useMutation({
    mutationFn: (newRating: number) =>
      myReview
        ? updateReview(myReview.id, { rating: newRating })
        : createReview({
            movie_id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path ?? null,
            release_date: movie.release_date ?? null,
            genre_ids: movie.genre_ids,
            vote_average: movie.vote_average,
            rating: newRating,
            review_text: '',
          }),
    // A rated movie is no longer a suggestion, so take it out of the For You feed
    // on tap instead of leaving it there until the refetch lands.
    onMutate: () => ({ dropped: !myReview && dropFromForYouFeed(queryClient, movie.id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-reviews', movie.id] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
      invalidateTasteStats(queryClient)
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      queryClient.invalidateQueries({ queryKey: ['movies', 'picks-of-the-week'] })
      refreshForYouFeed(queryClient)
    },
    onError: (_err, _rating, context) => {
      if (context?.dropped) refreshForYouFeed(queryClient)
    },
  })
  const displayRating = optimisticRating ?? myReview?.rating ?? 0
  const handleRate = (star: number) => {
    setOptimisticRating(star)
    rateMutation.mutate(star, { onError: () => setOptimisticRating(null) })
  }

  const inlineActions = actions.filter((a) => INLINE_ACTION_KEYS.includes(a.key))
  const rowActions = actions.filter((a) => !INLINE_ACTION_KEYS.includes(a.key))

  return (
    <>
    <div
      className="modal-backdrop-fade fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/80 backdrop-blur-sm p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="modal-zoom-forward relative mx-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-wine shadow-2xl sm:my-8"
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

        {/* Hero banner — a wide scene still from the film (TMDB backdrop), just tall enough to
            frame the poster + title floating in front of it. Kept short so the year/director/
            synopsis/cast/actions below don't require scrolling to reach on desktop. */}
        {detailsLoading ? (
          <BannerSkeleton />
        ) : backdropUrl ? (
          <div className="relative h-40 w-full shrink-0 overflow-hidden bg-navy-card sm:h-44 md:h-52 lg:h-56">
            <RetryImage src={backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<></>} />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-wine via-navy-wine/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-5 pb-4 sm:gap-4 sm:px-6 sm:pb-5">
              <div className="w-20 shrink-0 overflow-hidden rounded-lg border-2 border-white/10 bg-navy-card shadow-xl sm:w-24 md:w-28">
                <div className="aspect-[2/3] w-full">
                  {posterUrl ? (
                    <RetryImage
                      src={posterUrl}
                      alt={`${movie.title} poster`}
                      className="h-full w-full object-contain"
                      fallback={<div className="h-full w-full bg-navy-card" />}
                    />
                  ) : (
                    <div className="h-full w-full bg-navy-card" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <h2 className="text-lg font-bold leading-tight text-white drop-shadow-md sm:text-2xl">{movie.title}</h2>
              </div>
            </div>
          </div>
        ) : (
          /* No backdrop available — same poster + title pairing, just without the banner space. */
          <div className="flex shrink-0 items-center gap-3 px-5 pt-4 sm:gap-4 sm:px-6 sm:pt-5">
            <div className="w-16 shrink-0 overflow-hidden rounded-lg border-2 border-navy-wine bg-navy-card shadow-lg sm:w-20 md:w-24">
              <div className="aspect-[2/3] w-full">
                {posterUrl ? (
                  <RetryImage
                    src={posterUrl}
                    alt={`${movie.title} poster`}
                    className="h-full w-full object-contain"
                    fallback={<div className="h-full w-full bg-navy-card" />}
                  />
                ) : (
                  <div className="h-full w-full bg-navy-card" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="text-lg font-bold leading-tight text-gray-lighter sm:text-2xl">{movie.title}</h2>
            </div>
          </div>
        )}

        {/* Details — scrollable */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 pt-4 sm:gap-4 sm:p-6 sm:pt-5">
          {(forYouReason || onNotInterested) && (
            <div className="flex items-center gap-2">
              {forYouReason && (
                <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-medium text-teal-light">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="truncate">{forYouReason}</span>
                </div>
              )}
              {onNotInterested && (
                <div ref={notInterestedRef} className="relative ml-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowNotInterestedMenu((v) => !v)}
                    aria-label="Not interested"
                    aria-expanded={showNotInterestedMenu}
                    title="Not interested"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-brand/40 bg-pink-brand/10 text-pink-brand transition-colors hover:bg-pink-brand/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 105.636 5.636a9 9 0 0012.728 12.728zM6 6l12 12" />
                    </svg>
                  </button>
                  {showNotInterestedMenu && (
                    <div className="absolute right-0 top-full z-20 mt-1.5 w-60 overflow-hidden rounded-lg border border-white/15 bg-navy-card shadow-2xl">
                      {NOT_INTERESTED_OPTIONS.map(({ scope, label }) => (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => {
                            setShowNotInterestedMenu(false)
                            onNotInterested(scope)
                          }}
                          className="block w-full px-3 py-2.5 text-left text-xs text-gray-lighter transition-colors hover:bg-white/10"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {isLoading ? (
            <DetailSkeleton />
          ) : (
            <>
              {/* Quick rate — the first thing available on open, no need to tap into the
                  full review form just to leave a star rating. */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wide">
                  {myReview ? 'Your Rating' : 'Rate this movie'}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div style={{ textShadow: STAR_SHADOW }}>
                    <StarRating value={displayRating} onChange={handleRate} size="lg" />
                  </div>
                  {inlineActions.length > 0 && (
                    <div className="flex shrink-0 items-center gap-2">
                      {inlineActions.map((action) => (
                        <IconActionButton key={action.key} action={action} />
                      ))}
                    </div>
                  )}
                </div>
                {!myReview && (
                  <p className="text-xs text-gray-muted">Tap a star to rate — add a written review anytime.</p>
                )}
              </div>

              {extraContent}

              {/* Your review text + rewatch controls */}
              {myReview && (myReview.review_text || rewatch) && (
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

              {/* Synopsis — capped at 3 lines on a phone (tap to expand, as does More), but shown
                  in full wherever there's room for it. Its three lines are reserved while the
                  details load so the buttons below don't jump once the text arrives. */}
              {detailsLoading && !displayOverview ? (
                <div className="flex flex-col gap-2 py-0.5" aria-hidden>
                  {['w-full', 'w-full', 'w-2/3'].map((w) => (
                    <div key={w} className={`h-4 ${w} animate-pulse rounded bg-navy-card/60`} />
                  ))}
                </div>
              ) : (
                displayOverview && (
                  <p
                    role="button"
                    tabIndex={0}
                    aria-expanded={descExpanded}
                    onClick={() => setDescExpanded((v) => !v)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDescExpanded((v) => !v) } }}
                    className={[
                      'cursor-pointer text-sm leading-relaxed text-gray-light/80',
                      descExpanded ? '' : 'line-clamp-3 sm:line-clamp-none',
                    ].join(' ')}
                  >
                    {displayOverview}
                  </p>
                )
              )}

              {detailsLoading ? (
                <div className="flex items-center gap-2" aria-hidden>
                  <span className="text-[11px] font-semibold text-gray-muted uppercase tracking-wide">Available on</span>
                  <div className="h-6 w-6 animate-pulse rounded-md bg-navy-card/60" />
                  <div className="h-6 w-6 animate-pulse rounded-md bg-navy-card/60" />
                </div>
              ) : flatrateProviders.length === 0 ? (
                <p className="text-xs text-gray-muted">Not available on any services in your region</p>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-muted uppercase tracking-wide">Available on</span>
                  <button
                    type="button"
                    onClick={() => setShowProviders(true)}
                    aria-label="See where to stream this movie in Australia"
                    className="flex items-center gap-1.5"
                  >
                    {flatrateProviders.slice(0, 5).map((provider) => (
                      <img
                        key={provider.provider_id}
                        src={`${TMDB_PROVIDER_LOGO}${provider.logo_path}`}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="h-6 w-6 rounded-md object-cover ring-1 ring-white/10"
                      />
                    ))}
                  </button>
                </div>
              )}

              {/* More — collapsed by default; expands to reveal the credits and friends' reviews */}
              <div className="flex flex-col gap-4 border-t border-white/8 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const next = !showMore
                    setShowMore(next)
                    setDescExpanded(next)
                  }}
                  aria-expanded={showMore}
                  className="flex items-center gap-1.5 self-start text-sm font-medium text-gray-lighter transition-colors hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0 transition-transform duration-200"
                    style={{ transform: showMore ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  {showMore ? 'Less' : 'More'}
                </button>

                {/* 0fr → 1fr animates to the content's own height, so a long reviews
                    list can't get clipped the way a fixed max-height would clip it. */}
                <div
                  className="grid transition-all duration-300 ease-in-out"
                  style={{ gridTemplateRows: showMore ? '1fr' : '0fr', opacity: showMore ? 1 : 0 }}
                >
                  <div className="flex flex-col gap-4 overflow-hidden">
                    <div className="flex flex-col gap-2.5">
                      {(movie.release_date || directors.length > 0) && (
                        <p className="text-sm leading-relaxed">
                          {movie.release_date && (
                            <span className="font-medium text-gray-lighter">{movie.release_date.slice(0, 4)}</span>
                          )}
                          {directors.length > 0 && (
                            <span className="text-gray-muted">
                              {movie.release_date ? ' · ' : ''}
                              Directed by{' '}
                              {directors.map((d, i) => (
                                <span key={d.id}>
                                  {onPersonClick ? (
                                    <button
                                      type="button"
                                      onClick={() => onPersonClick(d.id, d.name, 'director')}
                                      className="text-gray-lighter underline decoration-white/25 underline-offset-2 transition-colors hover:text-magenta hover:decoration-magenta/50"
                                    >
                                      {d.name}
                                    </button>
                                  ) : (
                                    <span className="text-gray-lighter">{d.name}</span>
                                  )}
                                  {i < directors.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </span>
                          )}
                        </p>
                      )}
                      {(runtime || genres.length > 0) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {runtime != null && runtime > 0 && (
                            <span className="text-xs text-gray-muted">
                              {Math.floor(runtime / 60)}h {runtime % 60}m
                            </span>
                          )}
                          {genres.map((g) => (
                            <span key={g.id} className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-gray-muted">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {topCast.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wide">Cast</p>
                        <div className="flex flex-wrap gap-2">
                          {topCast.map((actor) => (
                            <CastAvatar key={actor.id} actor={actor} onPersonClick={onPersonClick} />
                          ))}
                        </div>
                        {restCast.length > 0 && (
                          <button
                            onClick={() => setShowAllCast((v) => !v)}
                            className="self-start text-xs text-gray-muted transition-colors hover:text-gray-lighter"
                          >
                            {showAllCast ? 'Show less' : `+${restCast.length} more`}
                          </button>
                        )}
                      </div>
                    )}

                    {showAllCast && restCast.length > 0 && (
                      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                        {restCast.map((actor) => (
                          <CastAvatar key={actor.id} actor={actor} onPersonClick={onPersonClick} size="sm" />
                        ))}
                      </div>
                    )}

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
                  </div>
                </div>
              </div>

              {rowActions.length > 0 && (
                <div className="flex flex-wrap justify-end gap-2">
                  {rowActions.map((action) => (
                    <ActionButton key={action.key} action={action} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>

    {showProviders && (
      <WatchProvidersModal
        movieTitle={movie.title}
        providers={flatrateProviders}
        justWatchLink={auProviders?.link}
        onClose={() => setShowProviders(false)}
      />
    )}
    </>
  )
}
