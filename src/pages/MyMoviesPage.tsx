import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyReviews } from '../services/apiClient'
import MovieCard from '../components/MovieCard'
import type { Movie } from '../types'

type SidebarSection = 'watched' | 'want-to-watch' | 'favourite-actors'

const SIDEBAR_LINKS: { id: SidebarSection; label: string }[] = [
  { id: 'watched', label: "Movies I've Watched" },
  { id: 'want-to-watch', label: 'Movies I want to Watch' },
  { id: 'favourite-actors', label: 'My Favourite Actors' },
]

export default function MyMoviesPage() {
  const [activeSection, setActiveSection] = useState<SidebarSection>('watched')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => getMyReviews(1),
    enabled: activeSection === 'watched',
  })

  // Deduplicate movies by movie_id
  const watchedMovies: Movie[] = []
  const seen = new Set<number>()
  for (const review of reviewsData?.reviews ?? []) {
    if (review.movies && !seen.has(review.movies.id)) {
      seen.add(review.movies.id)
      watchedMovies.push(review.movies as Movie)
    }
  }

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-6 py-8">
      {/* Sidebar */}
      <aside className="w-60 shrink-0">
        <ul className="flex flex-col gap-8">
          {SIDEBAR_LINKS.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => { setActiveSection(link.id); setSelectedMovie(null) }}
                className={`sidebar-link w-full text-left${activeSection === link.id ? ' active' : ''}`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        {/* Section header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-lighter">
            {SIDEBAR_LINKS.find((l) => l.id === activeSection)?.label}
          </h2>
        </div>

        {/* Watched — movie grid */}
        {activeSection === 'watched' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <span className="text-sm text-gray-muted">Loading…</span>
              </div>
            ) : watchedMovies.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <p className="text-gray-muted">No movies reviewed yet.</p>
                <p className="text-xs text-gray-muted/60">
                  Head to&nbsp;<strong className="text-teal">Make Review</strong>&nbsp;to add your first one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-5">
                {watchedMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={handleMovieSelect}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Want to Watch — placeholder */}
        {activeSection === 'want-to-watch' && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-gray-muted">Your watchlist is empty.</p>
            <p className="text-xs text-gray-muted/60">This feature is coming soon.</p>
          </div>
        )}

        {/* Favourite Actors — placeholder */}
        {activeSection === 'favourite-actors' && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-gray-muted">No favourite actors saved yet.</p>
            <p className="text-xs text-gray-muted/60">This feature is coming soon.</p>
          </div>
        )}
      </main>

      {/* Selected movie detail panel */}
      {selectedMovie && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedMovie(null)}
        >
          <div
            className="panel-card flex max-w-2xl w-full gap-6 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Poster */}
            <div className="w-44 shrink-0">
              <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
                <img
                  src={
                    selectedMovie.poster_path
                      ? `https://image.tmdb.org/t/p/w342${selectedMovie.poster_path}`
                      : 'https://via.placeholder.com/342x513?text=No+Poster'
                  }
                  alt={`${selectedMovie.title} poster`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-bold text-gray-lighter">{selectedMovie.title}</h2>
              {selectedMovie.release_date && (
                <p className="text-sm text-gray-muted">{selectedMovie.release_date.slice(0, 4)}</p>
              )}
              {selectedMovie.overview && (
                <p className="text-sm text-gray-light/80 leading-relaxed line-clamp-5">
                  {selectedMovie.overview}
                </p>
              )}
              <button
                onClick={() => setSelectedMovie(null)}
                className="mt-auto self-start rounded-lg px-4 py-2 text-sm text-gray-muted border border-white/10 hover:border-white/30 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
