import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMyReviews } from '../services/apiClient'
import MovieCard from '../components/MovieCard'
import type { Movie } from '../types'

type SidebarSection = 'watched' | 'want-to-watch' | 'favourite-actors' | 'favourite-directors' | 'Recommendations'

const SIDEBAR_LINKS: { id: SidebarSection; label: string }[] = [
  { id: 'watched', label: "Movies I've Watched" },
  { id: 'want-to-watch', label: 'Movies I want to Watch' },
  { id: 'favourite-actors', label: 'My Favourite Actors' },
  { id: 'favourite-directors', label: 'My Favourite Directors' },
  { id: 'Recommendations', label: 'Recommendations for Me' },
]

export default function MyMoviesPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<SidebarSection>('watched')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [searchQ, setSearchQ] = useState('')

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-lighter">
            {SIDEBAR_LINKS.find((l) => l.id === activeSection)?.label}
          </h2>
        </div>

        {/* Sort / Filter / Search bar */}
        <div className="mb-5 flex items-center gap-3">
          {/* Sort */}
          <button
            className="flex items-center justify-center rounded-lg border border-white/15 bg-navy-card/40 p-2 text-gray-muted hover:text-gray-lighter transition-colors"
            title="Sort"
          >
            <svg width="24" height="24" viewBox="3000 963 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3004,971L3013,971" stroke="#e1e1e1" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3006,976L3013,976" stroke="#e1e1e1" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3008,981L3013,981" stroke="#e1e1e1" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3017,983L3017,967L3020,971" stroke="#e1e1e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Filter */}
          <button
            className="flex items-center justify-center rounded-lg border border-white/15 bg-navy-card/40 p-2 text-gray-muted hover:text-gray-lighter transition-colors"
            title="Filter"
          >
            <svg width="24" height="24" viewBox="3049 963 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3070,969L3068,969M3070,975L3065,975M3070,981L3065,981M3056,983L3056,976.5612182617188C3056,976.3532104492188,3056,976.2492065429688,3055.9794921875,976.1497192382812C3055.96142578125,976.0615234375,3055.931640625,975.97607421875,3055.890625,975.8958129882812C3055.84423828125,975.805419921875,3055.779296875,975.7241821289062,3055.6494140625,975.5617065429688L3052.3505859375,971.438232421875C3052.220703125,971.2758178710938,3052.15576171875,971.194580078125,3052.109375,971.1041870117188C3052.068359375,971.02392578125,3052.03857421875,970.9385375976562,3052.0205078125,970.8502807617188C3052,970.7507934570312,3052,970.6467895507812,3052,970.438720703125L3052,968.5999755859375C3052,968.0399780273438,3052,967.7599487304688,3052.10888671875,967.5460205078125C3052.205078125,967.3578491210938,3052.35791015625,967.2048950195312,3052.5458984375,967.1090087890625C3052.759765625,967,3053.0400390625,967,3053.60009765625,967L3062.39990234375,967C3062.9599609375,967,3063.240234375,967,3063.4541015625,967.1090087890625C3063.64208984375,967.2048950195312,3063.794921875,967.3578491210938,3063.89111328125,967.5460205078125C3064,967.7599487304688,3064,968.0399780273438,3064,968.5999755859375L3064,970.438720703125C3064,970.6467895507812,3064,970.7507934570312,3063.9794921875,970.8502807617188C3063.96142578125,970.9385375976562,3063.931640625,971.02392578125,3063.890625,971.1041870117188C3063.84423828125,971.194580078125,3063.779296875,971.2758178710938,3063.6494140625,971.438232421875L3060.3505859375,975.5617065429688C3060.220703125,975.7241821289062,3060.15576171875,975.805419921875,3060.109375,975.8958129882812C3060.068359375,975.97607421875,3060.03857421875,976.0615234375,3060.0205078125,976.1497192382812C3060,976.2492065429688,3060,976.3532104492188,3060,976.5612182617188L3060,980L3056,983Z" stroke="#e1e1e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Search */}
          <input
            type="text"
            placeholder="Search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="flex-1 rounded-full border border-white/15 bg-navy-card/40 px-4 py-2 text-sm text-gray-lighter placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-teal/40"
          />
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
                <p className="text-gray-300">No movies reviewed yet.</p>
                <p className="text-xs text-gray-400">
                  Head to&nbsp;<strong className="text-teal-500">Make Review</strong>&nbsp;to add your first one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-5">
                {watchedMovies
                  .filter((m) =>
                    searchQ.trim()
                      ? m.title.toLowerCase().includes(searchQ.toLowerCase())
                      : true,
                  )
                  .map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onSelect={handleMovieSelect}
                    />
                  ))}
                {/* Add movie placeholder — only shown when there are already movies */}
                {!searchQ.trim() && (
                  <button
                    onClick={() => navigate('/search')}
                    className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-card border-2 border-dashed border-white/20 bg-navy-card/30 text-gray-muted hover:border-white/40 hover:text-gray-lighter transition-colors"
                    title="Add a movie"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Want to Watch — placeholder */}
        {activeSection === 'want-to-watch' && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-gray-300">Your watchlist is empty.</p>
            <p className="text-xs text-gray-400">This feature is coming soon.</p>
          </div>
        )}

        {/* Favourite Actors — placeholder */}
        {activeSection === 'favourite-actors' && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-gray-300">No favourite actors saved yet.</p>
            <p className="text-xs text-gray-400">This feature is coming soon.</p>
          </div>
        )}

        {/* Favourite Directors — placeholder */}
        {activeSection === 'favourite-directors' && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-gray-300">No favourite directors saved yet.</p>
            <p className="text-xs text-gray-400">This feature is coming soon.</p>
          </div>
        )}

        {/* Recommendations — placeholder */}
        {activeSection === 'Recommendations' && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-gray-300">No recommendations available yet.</p>
            <p className="text-xs text-gray-400">This feature is coming soon.</p>
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
