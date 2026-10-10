import RetryImage from './RetryImage'
import type { Movie } from '../types'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185'

interface Props {
  /** The collection's own name, already stripped of a trailing "Collection"
   *  suffix and relabeled "Universe" by the caller. */
  title: string
  /** Already server-ordered (sequels/prequels first) — rendered as-is. */
  movies: Movie[]
  /** Omit to render a non-interactive strip (e.g. in a context with no
   *  "open a different movie" flow of its own) — tiles still show the
   *  franchise, just aren't tappable. */
  onSelectMovie?: (movie: Movie) => void
}

/** A short horizontal strip of a franchise's other films — deliberately
 *  simpler than MovieCarousel (no drag/auto-drift/3D, built for a long
 *  Discover row): a plain native scroll-snap row, sized for the handful of
 *  entries a single TMDB collection typically has. */
export default function FranchiseStrip({ title, movies, onSelectMovie }: Props) {
  if (movies.length === 0) return null

  return (
    <div className="flex flex-col gap-2 border-t border-white/8 pt-4">
      <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wide">{title}</p>
      <div className="flex snap-x gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {movies.map((m) => {
          const poster = (
            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/10 bg-navy-card">
              {m.poster_path ? (
                <RetryImage
                  src={`${TMDB_IMG}${m.poster_path}`}
                  alt={m.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  fallback={<div className="h-full w-full bg-navy-card" />}
                />
              ) : (
                <div className="h-full w-full bg-navy-card" />
              )}
            </div>
          )
          const caption = <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-gray-lighter">{m.title}</p>

          return onSelectMovie ? (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMovie(m)}
              className="w-20 shrink-0 snap-start text-left sm:w-24"
            >
              {poster}
              {caption}
            </button>
          ) : (
            <div key={m.id} className="w-20 shrink-0 snap-start sm:w-24">
              {poster}
              {caption}
            </div>
          )
        })}
      </div>
    </div>
  )
}
