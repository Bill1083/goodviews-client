import type { Movie } from '../types'
import StarRating from './StarRating'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const FALLBACK_IMG = 'https://via.placeholder.com/342x513?text=No+Poster'

interface Props {
  movie: Movie
  rating?: number
  onSelect?: (movie: Movie) => void
}

export default function MovieCard({ movie, rating, onSelect }: Props) {
  const posterUrl = movie.poster_path
    ? `${TMDB_IMG}${movie.poster_path}`
    : FALLBACK_IMG

  const year = movie.release_date ? movie.release_date.slice(0, 4) : '—'

  return (
    <article
      onClick={() => onSelect?.(movie)}
      className={[
        'group flex flex-col rounded-card overflow-hidden bg-navy border border-purple/20',
        'transition-all duration-200 hover:border-teal/60 hover:shadow-lg hover:shadow-teal/10',
        onSelect ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      <div className="relative overflow-hidden aspect-[2/3] bg-navy">
        <img
          src={posterUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-1 p-3">
        <h3 className="text-sm font-semibold text-gray-light leading-snug line-clamp-2">
          {movie.title}
        </h3>
        <p className="text-xs text-gray-muted">{year}</p>
        {rating !== undefined && (
          <StarRating value={rating} readOnly size="sm" />
        )}
      </div>
    </article>
  )
}
