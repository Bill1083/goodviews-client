import { useState } from 'react'
import type { Movie } from '../types'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const FALLBACK_IMG = 'https://via.placeholder.com/342x513?text=No+Poster'

// ─── Watchlist icon SVGs (from design — use original viewBox coords) ──────────
const PlusSVG = () => (
  <svg width="19" height="18" viewBox="2956 4056 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="2965.5" cy="4065" rx="7.917" ry="7.5"
      style={{ fill: 'none', stroke: '#fff', strokeOpacity: 0.9, strokeWidth: 1.5 }} />
    <path d="M2967.875,4065L2965.5,4065M2965.5,4065L2963.125,4065M2965.5,4065L2965.5,4062.75M2965.5,4065L2965.5,4067.25"
      fill="none" strokeLinecap="round"
      style={{ stroke: '#fff', strokeOpacity: 0.9, strokeWidth: 1.5 }} />
  </svg>
)

const TickSVG = () => (
  <svg width="19" height="18" viewBox="3274 7722 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3290.921875,7731.84375C3290.328125,7734.65625,3288.089599609375,7737.3037109375,3284.94775390625,7737.896484375C3281.805908203125,7738.48828125,3278.61767578125,7737.103515625,3277.040283203125,7734.46240234375C3275.462890625,7731.8212890625,3275.852294921875,7728.51904296875,3278.006103515625,7726.2724609375C3280.16015625,7724.0263671875,3283.796875,7723.40625,3286.765625,7724.53125"
      fill="none" strokeLinejoin="round" strokeLinecap="round"
      style={{ stroke: '#e1e1e1', strokeWidth: 1.5 }} />
    <path d="M3280.828125,7730.71875L3283.796875,7733.53125L3290.921875,7726.21875"
      fill="none" strokeLinejoin="round" strokeLinecap="round"
      style={{ stroke: '#e1e1e1', strokeWidth: 1.5 }} />
  </svg>
)

const MinusSVG = () => (
  <svg width="19" height="18" viewBox="3137 4020 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3143.33349609375,4029L3149.66650390625,4029M3153.625,4029C3153.625,4032.72802734375,3150.43505859375,4035.75,3146.5,4035.75C3142.56494140625,4035.75,3139.375,4032.72802734375,3139.375,4029C3139.375,4025.27197265625,3142.56494140625,4022.25,3146.5,4022.25C3150.43505859375,4022.25,3153.625,4025.27197265625,3153.625,4029Z"
      fill="none" strokeLinecap="round" strokeLinejoin="round"
      style={{ stroke: '#fff', strokeWidth: 2 }} />
  </svg>
)

interface Props {
  movie: Movie
  onSelect?: (movie: Movie) => void
  /** Is this movie already in the watchlist? */
  isInWatchlist?: boolean
  /** Called when user clicks + (add). Omit to hide watchlist overlay. */
  onWatchlistAdd?: (movie: Movie) => void
  /** Called when user clicks − (remove). */
  onWatchlistRemove?: (movie: Movie) => void
  /** When true, always shows minus/remove overlay (used in want-to-watch list). */
  watchlistRemoveOnly?: boolean
}

export default function MovieCard({
  movie,
  onSelect,
  isInWatchlist,
  onWatchlistAdd,
  onWatchlistRemove,
  watchlistRemoveOnly,
}: Props) {
  const [cardHovered, setCardHovered] = useState(false)
  const [iconHovered, setIconHovered] = useState(false)

  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : FALLBACK_IMG
  const hasWatchlist = !!(onWatchlistAdd || onWatchlistRemove || watchlistRemoveOnly)

  // Determine overlay content
  let overlayText: string
  let overlayIcon: 'plus' | 'tick' | 'minus'

  if (watchlistRemoveOnly) {
    overlayText = 'Remove from watchlist'
    overlayIcon = 'minus'
  } else if (isInWatchlist) {
    overlayText = iconHovered ? 'Remove from watchlist' : 'Added to watchlist'
    overlayIcon = iconHovered ? 'minus' : 'tick'
  } else {
    overlayText = 'Add to watchlist'
    overlayIcon = 'plus'
  }

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isInWatchlist || watchlistRemoveOnly) {
      onWatchlistRemove?.(movie)
    } else {
      onWatchlistAdd?.(movie)
    }
  }

  return (
    <article
      onClick={() => onSelect?.(movie)}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => { setCardHovered(false); setIconHovered(false) }}
      className={`poster-card relative${onSelect ? ' cursor-pointer' : ''}`}
      style={{
        outline: hasWatchlist && cardHovered ? '2px solid #2b6cb0' : '2px solid transparent',
        outlineOffset: '-2px',
        transition: 'outline-color 0.15s ease',
      }}
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-lg relative">
        <img
          src={posterUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {/* Watchlist overlay — visible on card hover */}
        {hasWatchlist && cardHovered && (
          <div
            className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2 py-2.5 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 65%, transparent 100%)',
            }}
          >
            <span className="flex-1 text-xs text-white/90 leading-snug">{overlayText}</span>
            <button
              onMouseEnter={() => setIconHovered(true)}
              onMouseLeave={() => setIconHovered(false)}
              onClick={handleWatchlistClick}
              className="shrink-0 transition-transform hover:scale-110 pointer-events-auto"
              aria-label={overlayText}
            >
              {overlayIcon === 'plus' && <PlusSVG />}
              {overlayIcon === 'tick' && <TickSVG />}
              {overlayIcon === 'minus' && <MinusSVG />}
            </button>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs font-medium text-gray-lighter line-clamp-2 leading-snug">
        {movie.title}
      </p>
    </article>
  )
}

