import RetryImage from '../../components/RetryImage'
import type { Movie } from '../../types'

const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280'
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w342'

interface Props {
  movies: Movie[]
  isLoading: boolean
  onSelect: (movie: Movie) => void
}

function Tile({
  movie,
  onSelect,
  size,
  className = '',
}: {
  movie: Movie
  onSelect: (movie: Movie) => void
  size: 'hero' | 'small'
  className?: string
}) {
  const backdropUrl = movie.backdrop_path ? `${TMDB_BACKDROP}${movie.backdrop_path}` : null
  const posterUrl = movie.poster_path ? `${TMDB_POSTER}${movie.poster_path}` : null
  const isHero = size === 'hero'

  return (
    <div
      onClick={() => onSelect(movie)}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-card border border-white/10 bg-navy-card ${
        isHero ? 'h-64 sm:h-80 md:h-full' : 'h-40 sm:h-48 md:h-full'
      } ${className}`}
    >
      {backdropUrl && (
        <RetryImage
          src={backdropUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          fallback={<></>}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />

      <div className={`absolute inset-x-0 bottom-0 flex items-end gap-3 ${isHero ? 'p-5 sm:p-8' : 'p-3 sm:p-4'}`}>
        {isHero && posterUrl && (
          <div className="hidden w-20 shrink-0 overflow-hidden rounded-lg border-2 border-white/10 bg-navy-card shadow-xl sm:block md:w-24">
            <div className="aspect-[2/3] w-full">
              <RetryImage src={posterUrl} alt="" className="h-full w-full object-cover" fallback={<div className="h-full w-full bg-navy-card" />} />
            </div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={`font-semibold uppercase tracking-wider text-teal ${isHero ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'}`}>
            {isHero ? 'Pick of the Week' : 'Also for you'}
          </p>
          <h3
            style={{ fontFamily: '"Source Sans 3", sans-serif' }}
            className={`mt-1 truncate font-bold text-white drop-shadow-md ${
              isHero ? 'text-2xl sm:text-4xl md:text-5xl' : 'text-base sm:text-xl'
            }`}
          >
            {movie.title}
          </h3>
        </div>
      </div>
    </div>
  )
}

function TileSkeleton({ size }: { size: 'hero' | 'small' }) {
  return (
    <div
      className={`animate-pulse rounded-card border border-white/10 bg-navy-card ${
        size === 'hero' ? 'h-64 sm:h-80 md:h-full' : 'h-40 sm:h-48 md:h-full'
      }`}
    />
  )
}

export default function PicksOfTheWeek({ movies, isLoading, onSelect }: Props) {
  if (!isLoading && movies.length === 0) return null

  return (
    <section className="flex w-full flex-col gap-3">
      <div>
        <h2 style={{ fontFamily: '"Source Sans 3", sans-serif' }} className="text-lg font-bold text-gray-lighter sm:text-xl">
          Movie Picks of the Week
        </h2>
        <p className="text-sm text-gray-muted">Your top matches, refreshed every week</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 md:[grid-auto-rows:1fr]">
        {isLoading ? (
          <>
            <TileSkeleton size="hero" />
            <div className="grid grid-cols-2 gap-4 md:contents">
              <TileSkeleton size="small" />
              <TileSkeleton size="small" />
            </div>
          </>
        ) : (
          <>
            <Tile movie={movies[0]} onSelect={onSelect} size="hero" className="md:col-span-2 md:row-span-2" />
            <div className="grid grid-cols-2 gap-4 md:contents">
              {movies[1] && <Tile movie={movies[1]} onSelect={onSelect} size="small" />}
              {movies[2] && <Tile movie={movies[2]} onSelect={onSelect} size="small" />}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
