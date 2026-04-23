import type { Movie } from '../types'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const FALLBACK_IMG = 'https://via.placeholder.com/342x513?text=No+Poster'

interface Props {
  movie: Movie
  onSelect?: (movie: Movie) => void
}

export default function MovieCard({ movie, onSelect }: Props) {
  const posterUrl = movie.poster_path
    ? `${TMDB_IMG}${movie.poster_path}`
    : FALLBACK_IMG

  return (
    <article
      onClick={() => onSelect?.(movie)}
      className={`poster-card${onSelect ? ' cursor-pointer' : ''}`}
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
        <img
          src={posterUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <p className="mt-2 text-center text-xs font-medium text-gray-lighter line-clamp-2 leading-snug">
        {movie.title}
      </p>
    </article>
  )
}
