import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchMovies } from '../../services/apiClient'
import MovieSearchBar from './MovieSearchBar'
import MovieGrid from './MovieGrid'
import ReviewModal from '../reviews/ReviewModal'
import type { Movie } from '../../types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  const { data, isFetching, isError } = useQuery({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => searchMovies(query, page),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 min
  })

  const handleSearch = (q: string) => {
    setQuery(q)
    setPage(1)
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-8">
      <h1 className="self-start text-2xl font-bold text-gray-light">
        Find a Movie
      </h1>

      <MovieSearchBar onSearch={handleSearch} isLoading={isFetching} />

      {isError && (
        <p className="text-pink-brand text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      {data && (
        <>
          <div className="w-full">
            <MovieGrid
              movies={data.results}
              onSelectMovie={setSelectedMovie}
            />
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal-light"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-muted">
                Page {page} of {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal-light"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {!query && !isFetching && (
        <p className="mt-8 text-gray-muted text-sm">
          Type at least 2 characters to search for movies.
        </p>
      )}

      {selectedMovie && (
        <ReviewModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </main>
  )
}
