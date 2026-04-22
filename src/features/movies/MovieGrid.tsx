import MovieCard from '../../components/MovieCard'
import type { Movie } from '../../types'

interface Props {
  movies: Movie[]
  onSelectMovie: (movie: Movie) => void
}

export default function MovieGrid({ movies, onSelectMovie }: Props) {
  if (movies.length === 0) {
    return (
      <p className="mt-12 text-center text-gray-muted">
        No results found. Try a different search.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
      ))}
    </div>
  )
}
