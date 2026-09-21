import type { MovieRef, RatedFilm } from '../../../types/stats'
import { releaseYear } from '../../../utils/formatStats'
import PosterThumb, { RatingBadge } from './PosterThumb'

interface Props {
  films: RatedFilm[]
  onSelect?: (movie: MovieRef) => void
  size?: 'sm' | 'md'
  /** Show "×N" next to the rating for rewatched films. */
  showRewatch?: boolean
  /** Extra caption under each title (e.g. runtime), keyed by movie id. */
  captions?: Record<number, string>
}

/** Horizontal, swipe-safe row of posters. Marked data-no-swipe so the app's
 * page-swipe navigation (App.tsx) doesn't fire while scrolling it. */
export default function PosterStrip({ films, onSelect, size = 'sm', showRewatch = false, captions }: Props) {
  const width = size === 'md' ? 'w-20' : 'w-14'
  return (
    <div
      data-no-swipe="true"
      className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {films.map(({ movie, rating, rewatch_count }) => (
        <div key={movie.id} className={`flex ${width} shrink-0 flex-col gap-1`}>
          <PosterThumb
            path={movie.poster_path}
            title={movie.title}
            size={size}
            onClick={onSelect ? () => onSelect(movie) : undefined}
            badge={<RatingBadge rating={rating} rewatches={showRewatch ? rewatch_count : 0} />}
          />
          <span className="truncate text-[11px] leading-tight text-gray-light" title={movie.title}>
            {movie.title}
          </span>
          <span className="truncate text-[10px] leading-none text-gray-muted">{captions?.[movie.id] ?? releaseYear(movie.release_date)}</span>
        </div>
      ))}
    </div>
  )
}
