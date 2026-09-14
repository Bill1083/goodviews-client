import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyReviews,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getRecommendations,
  getMyCategories,
  incrementRewatch,
  decrementRewatch,
  getBulkFriendRatings,
  getFriendActivity,
  getMovieReviews,
  getMyFriends,
  getPersonDetails,
  searchMovies,
  searchPeople,
  getFavouriteActors,
  getFavouriteDirectors,
  addFavouriteActor,
  addFavouriteDirector,
  removeFavouriteActor,
  removeFavouriteDirector,
} from '../services/apiClient'
import MovieCard from '../components/MovieCard'
import MovieDetailModal from '../components/MovieDetailModal'
import SendToFriendsPanel from '../components/SendToFriendsPanel'
import PersonModal from '../components/PersonModal'
import RecommendationsSection from '../features/movies/RecommendationsSection'
import ReviewModal from '../features/reviews/ReviewModal'
import StarRating from '../components/StarRating'
import RetryImage from '../components/RetryImage'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { TMDB_GENRES } from '../utils/genres'
import type { Movie, Review, FriendReview, FriendActivityItem, PaginatedReviews, PersonSearchResult, FilmographyEntry } from '../types'

type SidebarSection = 'watched' | 'want-to-watch' | 'favourite-actors' | 'favourite-directors' | 'Recommendations' | 'Friends'
type SortKey = 'date-desc' | 'date-asc' | 'release-asc' | 'release-desc' | 'rating-high' | 'rating-low' | 'rating-friends-high' | 'rating-friends-low' | 'rating-public-high' | 'rating-public-low' | 'alpha-az' | 'alpha-za'

interface ReviewModalConfig {
  mode: 'create' | 'edit' | 'share'
  movie: Movie
  reviewId?: string
  initialRating?: number
  initialReviewText?: string
  initialCategoryIds?: string[]
  onSaved?: () => void
}

const SIDEBAR_LINKS: { id: SidebarSection; label: string }[] = [
  { id: 'watched', label: "Movies I've Watched" },
  { id: 'want-to-watch', label: 'Movies I want to Watch' },
  { id: 'favourite-actors', label: 'My Favourite Actors' },
  { id: 'favourite-directors', label: 'My Favourite Directors' },
  { id: 'Recommendations', label: 'Recommendations for Me' },
  { id: 'Friends', label: 'Friends' },
]

// ─── Grid loading skeleton (watched / want-to-watch) ──────────────────────────
function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[2/3] w-full animate-pulse rounded-card bg-navy-card/60" />
          <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-navy-card/60" />
        </div>
      ))}
    </div>
  )
}

// ─── "Did you mean…" — shown when a text search comes up empty or thin (≤3
//     local matches) in a My Movies list, offering up to 10 real results
//     from the full catalog that aren't already in that list. ────────────
function DidYouMeanMovies({
  query, localCount, suggestions, isFetching, onSelect,
}: {
  query: string
  localCount: number
  suggestions: Movie[]
  isFetching: boolean
  onSelect: (movie: Movie) => void
}) {
  if (query.trim().length < 2 || localCount > 3) return null
  if (!isFetching && suggestions.length === 0) return null

  return (
    <div className={localCount > 0 ? 'mt-8 flex flex-col gap-3 border-t border-white/10 pt-6' : 'flex flex-col gap-3'}>
      {localCount === 0 && <p className="text-gray-300">Oops, I can't seem to find that movie here</p>}
      <p className="text-sm font-medium text-gray-lighter">Did you mean…</p>
      {isFetching ? (
        <MovieGridSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {suggestions.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function DidYouMeanPeople({
  kind, query, localCount, suggestions, isFetching, onSelect, onAdd, addingId,
}: {
  kind: 'actor' | 'director'
  query: string
  localCount: number
  suggestions: PersonSearchResult[]
  isFetching: boolean
  onSelect: (personId: number) => void
  onAdd: (person: PersonSearchResult) => void
  addingId: number | null
}) {
  if (query.trim().length < 2 || localCount > 3) return null
  if (!isFetching && suggestions.length === 0) return null

  return (
    <div className={localCount > 0 ? 'mt-8 flex flex-col gap-3 border-t border-white/10 pt-6' : 'flex flex-col gap-3'}>
      {localCount === 0 && <p className="text-gray-300">Oops, I can't seem to find that {kind} here</p>}
      <p className="text-sm font-medium text-gray-lighter">Did you mean…</p>
      {isFetching ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 animate-pulse rounded-full bg-navy-card/60" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-navy-card/60" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {suggestions.map((person) => {
            const profileUrl = person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null
            return (
              <div key={person.id} className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-navy-card/40 p-3 text-center">
                <button
                  type="button"
                  onClick={() => onSelect(person.id)}
                  className="w-full flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-navy-card/60">
                    {profileUrl ? (
                      <RetryImage
                        src={profileUrl}
                        alt={person.name}
                        className="h-full w-full object-cover"
                        fallback={<div className="h-full w-full flex items-center justify-center text-gray-muted text-lg font-semibold">{person.name.charAt(0)}</div>}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-muted text-lg font-semibold">{person.name.charAt(0)}</div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-lighter leading-tight line-clamp-2">{person.name}</p>
                </button>
                <button
                  onClick={() => onAdd(person)}
                  disabled={addingId === person.id}
                  className="text-[10px] text-gray-muted hover:text-teal transition-colors disabled:opacity-40"
                  title={`Add as favourite ${kind}`}
                >
                  {addingId === person.id ? 'Adding…' : '+ Add'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Favourite actor/director row — the point of favouriting someone is to
//     see what they've been in, not to look at a grid of faces, so each
//     favourite is a shelf: who they are, then their movies right there. ──
function PersonFilmographyRow({
  personId, name, profilePath, type, onOpenPerson, onRemove, removing, onSelectMovie, genreScore, watchlistMovieIds,
}: {
  personId: number
  name: string
  profilePath: string | null
  type: 'actor' | 'director'
  onOpenPerson: () => void
  onRemove: () => void
  removing: boolean
  onSelectMovie: (movie: Movie) => void
  /** Per-genre affinity built from the user's own ratings — positive for
   *  genres they tend to rate highly, negative for ones they don't. Empty
   *  when there's no rating history to draw one from. */
  genreScore: Map<number, number>
  watchlistMovieIds: Set<number>
}) {
  const { data: details, isLoading } = useQuery({
    queryKey: ['person-details', personId],
    queryFn: () => getPersonDetails(personId),
    staleTime: 1000 * 60 * 30,
  })

  const credits = type === 'actor'
    ? (details?.movie_credits?.cast ?? [])
    : (details?.movie_credits?.crew ?? []).filter((c) => c.job === 'Director')

  // Closest thing to the For You algorithm we can do client-side: rank by
  // how well each film's genres match the genres the user actually rates
  // highly. Falls through to "already on your watchlist" and then plain
  // popularity — both when there's no genre signal at all (a new account)
  // and as tie-breaks when there is one.
  const genreAffinity = (film: FilmographyEntry) => {
    const genres = film.genre_ids ?? []
    if (genres.length === 0) return 0
    return genres.reduce((sum, g) => sum + (genreScore.get(g) ?? 0), 0) / genres.length
  }
  const films = [...credits]
    .sort((a, b) => {
      const affinityDiff = genreAffinity(b) - genreAffinity(a)
      if (affinityDiff !== 0) return affinityDiff
      const watchlistDiff = Number(watchlistMovieIds.has(b.id)) - Number(watchlistMovieIds.has(a.id))
      if (watchlistDiff !== 0) return watchlistDiff
      return (b.popularity ?? 0) - (a.popularity ?? 0)
    })
    .slice(0, 5)

  const profileUrl = profilePath ? `https://image.tmdb.org/t/p/w185${profilePath}` : null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-navy-card/40 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenPerson}
          className="flex min-w-0 items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-white/10 bg-navy-card/60">
            {profileUrl ? (
              <RetryImage
                src={profileUrl}
                alt={name}
                className="h-full w-full object-cover"
                fallback={<div className="h-full w-full flex items-center justify-center text-gray-muted text-sm font-semibold">{name.charAt(0)}</div>}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-muted text-sm font-semibold">{name.charAt(0)}</div>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-lighter truncate">{name}</span>
        </button>
        <button
          onClick={onRemove}
          disabled={removing}
          className="ml-auto shrink-0 text-[11px] text-gray-muted hover:text-pink-brand transition-colors disabled:opacity-40"
          title="Remove from favourites"
        >
          Remove
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] w-36 shrink-0 animate-pulse rounded-lg bg-navy-card/60" />
          ))}
        </div>
      ) : films.length === 0 ? (
        <p className="text-xs text-gray-muted italic">No known movie credits.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {films.map((film) => {
            const posterUrl = film.poster_path ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : null
            return (
              <button
                key={film.id}
                type="button"
                onClick={() => onSelectMovie({
                  id: film.id, title: film.title, poster_path: film.poster_path,
                  release_date: film.release_date ?? null, vote_average: film.vote_average, genre_ids: film.genre_ids,
                })}
                className="group flex w-36 shrink-0 flex-col gap-2 text-left"
              >
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-navy-card/60">
                  {posterUrl ? (
                    <RetryImage
                      src={posterUrl}
                      alt={film.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fallback={<div className="flex h-full w-full items-center justify-center p-1 text-center text-xs text-gray-muted">{film.title}</div>}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-1 text-center text-xs text-gray-muted">{film.title}</div>
                  )}
                </div>
                <p className="text-xs leading-snug text-gray-lighter line-clamp-2">{film.title}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sort Panel ───────────────────────────────────────────────────────────────
function SortPanel({
  open, onClose, sortBy, setSortBy, showRating,
}: {
  open: boolean; onClose: () => void; sortBy: SortKey | null; setSortBy: (k: SortKey | null) => void; showRating: boolean
}) {
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const btn = (label: string, key: SortKey) => (
    <button
      key={key}
      onClick={() => setSortBy(sortBy === key ? null : key)}
      className={['px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
        sortBy === key ? 'bg-teal/20 border-teal/60 text-teal-light' : 'bg-navy-card/40 border-white/15 text-gray-lighter hover:border-white/30'].join(' ')}
    >{label}</button>
  )

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />}
      <div className={['fixed top-0 right-0 z-40 h-full w-full max-w-xs bg-navy-card border-l border-white/10 p-5 flex flex-col gap-6 overflow-y-auto transition-transform duration-300 sm:w-72 sm:max-w-none sm:p-6',
        open ? 'translate-x-0' : 'translate-x-full'].join(' ')}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-lighter">Sort By:</h3>
          <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none">×</button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Date Added</p>
          <div className="flex gap-2 flex-wrap">{btn('Oldest First', 'date-asc')}{btn('Newest First', 'date-desc')}</div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Release Date</p>
          <div className="flex gap-2 flex-wrap">{btn('Oldest Release', 'release-asc')}{btn('Newest Release', 'release-desc')}</div>
        </div>
        {showRating && (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Rating by Friends</p>
              <p className="text-[11px] text-gray-muted/70 -mt-1">Your rating + friends' avg</p>
              <div className="flex gap-2 flex-wrap">{btn('Highest', 'rating-friends-high')}{btn('Lowest', 'rating-friends-low')}</div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Rating by Public</p>
              <p className="text-[11px] text-gray-muted/70 -mt-1">TMDB score</p>
              <div className="flex gap-2 flex-wrap">{btn('Highest', 'rating-public-high')}{btn('Lowest', 'rating-public-low')}</div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Your Rating</p>
              <div className="flex gap-2 flex-wrap">{btn('Highest Rated', 'rating-high')}{btn('Lowest Rated', 'rating-low')}</div>
            </div>
          </>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Alphabetical</p>
          <div className="flex gap-2 flex-wrap">{btn('A – Z', 'alpha-az')}{btn('Z – A', 'alpha-za')}</div>
        </div>
      </div>
    </>
  )
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  open, onClose, categories, filterCategoryIds, setFilterCategoryIds,
  filterYearFrom, setFilterYearFrom, filterYearTo, setFilterYearTo,
  filterActor, setFilterActor, filterActorId, setFilterActorId,
  filterDirector, setFilterDirector, filterDirectorId, setFilterDirectorId,
  filterGenreIds, setFilterGenreIds,
}: {
  open: boolean; onClose: () => void
  categories: { id: string; name: string; outline_color: string | null; fill_color: string | null }[]
  filterCategoryIds: string[]; setFilterCategoryIds: (ids: string[]) => void
  filterYearFrom: string; setFilterYearFrom: (y: string) => void
  filterYearTo: string; setFilterYearTo: (y: string) => void
  filterActor: string; setFilterActor: (a: string) => void
  filterActorId: number | null; setFilterActorId: (id: number | null) => void
  filterDirector: string; setFilterDirector: (d: string) => void
  filterDirectorId: number | null; setFilterDirectorId: (id: number | null) => void
  filterGenreIds: number[]; setFilterGenreIds: (ids: number[]) => void
}) {
  const [myCatsOpen, setMyCatsOpen] = useState(true)
  const [genresOpen, setGenresOpen] = useState(true)
  const [actorQuery, setActorQuery] = useState(filterActor)
  const [directorQuery, setDirectorQuery] = useState(filterDirector)

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Sync local text when external value is cleared
  useEffect(() => { if (!filterActorId) setActorQuery(filterActor) }, [filterActor, filterActorId])
  useEffect(() => { if (!filterDirectorId) setDirectorQuery(filterDirector) }, [filterDirector, filterDirectorId])

  const { data: actorSearchData } = useQuery({
    queryKey: ['people-search-filter-actor', actorQuery],
    queryFn: () => searchPeople(actorQuery),
    enabled: actorQuery.length >= 2 && !filterActorId,
    staleTime: 1000 * 60 * 5,
  })
  const { data: directorSearchData } = useQuery({
    queryKey: ['people-search-filter-director', directorQuery],
    queryFn: () => searchPeople(directorQuery),
    enabled: directorQuery.length >= 2 && !filterDirectorId,
    staleTime: 1000 * 60 * 5,
  })

  const actorSuggestions = (actorSearchData?.results ?? []).filter(p => p.known_for_department === 'Acting').slice(0, 5)
  const directorSuggestions = (directorSearchData?.results ?? []).filter(p => p.known_for_department === 'Directing').slice(0, 5)

  const hasFilters = filterCategoryIds.length > 0 || filterGenreIds.length > 0 || filterYearFrom || filterYearTo || filterActorId || filterDirectorId

  const toggleCategory = (id: string) =>
    setFilterCategoryIds(filterCategoryIds.includes(id) ? filterCategoryIds.filter((c) => c !== id) : [...filterCategoryIds, id])

  const toggleGenre = (id: number) =>
    setFilterGenreIds(filterGenreIds.includes(id) ? filterGenreIds.filter((g) => g !== id) : [...filterGenreIds, id])

  const clearActor = () => { setFilterActor(''); setFilterActorId(null); setActorQuery('') }
  const clearDirector = () => { setFilterDirector(''); setFilterDirectorId(null); setDirectorQuery('') }

  const clearAll = () => {
    setFilterCategoryIds([]); setFilterGenreIds([])
    setFilterYearFrom(''); setFilterYearTo('')
    clearActor(); clearDirector()
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />}
      <div className={['fixed top-0 right-0 z-40 h-full w-full max-w-xs bg-navy-card border-l border-white/10 p-5 flex flex-col gap-5 overflow-y-auto transition-transform duration-300 sm:w-80 sm:max-w-none sm:p-6',
        open ? 'translate-x-0' : 'translate-x-full'].join(' ')}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-lighter">Filter By:</h3>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={clearAll} className="text-xs text-gray-muted hover:text-pink-brand transition-colors">Clear all</button>
            )}
            <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none">×</button>
          </div>
        </div>

        {/* My Movie Categories */}
        <div className="flex flex-col gap-2">
          <button onClick={() => setMyCatsOpen(v => !v)}
            className="flex items-center justify-between w-full rounded-lg border border-white/15 bg-navy/50 px-4 py-2.5 text-sm font-medium text-gray-lighter hover:border-white/30 transition-colors">
            <span>My Movie Categories {filterCategoryIds.length > 0 && <span className="ml-1 text-teal-light text-xs">({filterCategoryIds.length} selected)</span>}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${myCatsOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {myCatsOpen && (
            <div className="flex flex-wrap gap-2 pl-1">
              {categories.length === 0 ? (
                <p className="text-xs text-gray-muted italic">No categories yet</p>
              ) : categories.map((cat) => {
                const isSelected = filterCategoryIds.includes(cat.id)
                const border = cat.outline_color ?? '#ffffff40'
                const bg = isSelected ? (cat.fill_color ?? cat.outline_color ?? '#ffffff20') : 'transparent'
                return (
                  <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                    className="w-fit px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{ border: `2px solid ${border}`, backgroundColor: bg, color: '#e9e9e9', opacity: isSelected ? 1 : 0.7 }}>
                    {cat.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-col gap-2">
          <button onClick={() => setGenresOpen(v => !v)}
            className="flex items-center justify-between w-full rounded-lg border border-white/15 bg-navy/50 px-4 py-2.5 text-sm font-medium text-gray-lighter hover:border-white/30 transition-colors">
            <span>Genres {filterGenreIds.length > 0 && <span className="ml-1 text-magenta text-xs">({filterGenreIds.length} selected)</span>}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${genresOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {genresOpen && (
            <div className="flex flex-wrap gap-2 pl-1">
              {TMDB_GENRES.map((genre) => {
                const isSelected = filterGenreIds.includes(genre.id)
                return (
                  <button key={genre.id} onClick={() => toggleGenre(genre.id)}
                    className={['w-fit px-3 py-1 rounded-full text-xs font-medium border-2 transition-all',
                      isSelected ? 'border-magenta bg-magenta/20 text-white' : 'border-white/20 text-gray-muted hover:border-white/40'].join(' ')}>
                    {genre.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Release Year */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Release Year</p>
          <div className="flex gap-2 items-center">
            <input type="number" placeholder="From" value={filterYearFrom} min={1900} max={2100}
              onChange={(e) => setFilterYearFrom(e.target.value)} className="input-base w-full text-sm" />
            <span className="text-gray-muted text-xs">–</span>
            <input type="number" placeholder="To" value={filterYearTo} min={1900} max={2100}
              onChange={(e) => setFilterYearTo(e.target.value)} className="input-base w-full text-sm" />
          </div>
        </div>

        {/* Actor filter */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Actor</p>
          {filterActorId ? (
            <div className="flex items-center justify-between rounded-lg border border-teal/40 bg-teal/10 px-3 py-2">
              <span className="text-sm text-teal-light">{filterActor}</span>
              <button onClick={clearActor} className="text-gray-muted hover:text-pink-brand text-lg leading-none ml-2">×</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" placeholder="Search actor…" value={actorQuery}
                onChange={(e) => setActorQuery(e.target.value)} className="input-base text-sm" />
              {actorSuggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-navy-card shadow-xl overflow-hidden">
                  {actorSuggestions.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={() => { setFilterActor(p.name); setFilterActorId(p.id); setActorQuery(p.name) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-lighter hover:bg-white/5 transition-colors text-left"
                      >
                        {p.profile_path && <img src={`https://image.tmdb.org/t/p/w45${p.profile_path}`} className="h-7 w-7 rounded-full object-cover shrink-0" alt="" />}
                        <span>{p.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Director filter */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Director</p>
          {filterDirectorId ? (
            <div className="flex items-center justify-between rounded-lg border border-teal/40 bg-teal/10 px-3 py-2">
              <span className="text-sm text-teal-light">{filterDirector}</span>
              <button onClick={clearDirector} className="text-gray-muted hover:text-pink-brand text-lg leading-none ml-2">×</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" placeholder="Search director…" value={directorQuery}
                onChange={(e) => setDirectorQuery(e.target.value)} className="input-base text-sm" />
              {directorSuggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-navy-card shadow-xl overflow-hidden">
                  {directorSuggestions.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={() => { setFilterDirector(p.name); setFilterDirectorId(p.id); setDirectorQuery(p.name) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-lighter hover:bg-white/5 transition-colors text-left"
                      >
                        {p.profile_path && <img src={`https://image.tmdb.org/t/p/w45${p.profile_path}`} className="h-7 w-7 rounded-full object-cover shrink-0" alt="" />}
                        <span>{p.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Reviews List Modal (Go to Reviews) ──────────────────────────────────────
function ReviewsListModal({ movie, myReview, onClose }: {
  movie: Movie; myReview: Review; onClose: () => void
}) {
  useBodyScrollLock(true)

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['movie-reviews', movie.id],
    queryFn: () => getMovieReviews(movie.id),
    staleTime: 1000 * 60 * 2,
  })

  const friendReviews: FriendReview[] = reviewData?.friend_reviews ?? []

  const formatRewatch = (count: number) => {
    const total = count + 1
    return `Watched ${total} time${total !== 1 ? 's' : ''}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="panel-card flex max-w-xl w-full flex-col gap-5 p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-lighter">{movie.title} — Reviews</h2>
          <button onClick={onClose} className="text-gray-muted hover:text-gray-lighter text-xl leading-none">×</button>
        </div>

        {/* Your review pinned at top */}
        <div className="flex flex-col gap-2 rounded-lg border border-teal/30 bg-teal/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-teal-light uppercase tracking-wide">Your Review</p>
            <span className="text-xs text-gray-muted">{formatRewatch(myReview.rewatch_count ?? 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <StarRating value={myReview.rating} readOnly size="sm" />
            <span className="text-xs text-gray-muted">{myReview.rating}/5</span>
          </div>
          {myReview.review_text && <p className="text-sm text-gray-light/80 leading-relaxed">{myReview.review_text}</p>}
        </div>

        {/* Friends' reviews */}
        {isLoading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-white/10 bg-navy-card/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-navy-card/70" />
                  <div className="h-3 w-16 rounded bg-navy-card/70" />
                </div>
                <div className="h-3 w-1/3 rounded bg-navy-card/70" />
              </div>
            ))}
          </div>
        ) : friendReviews.length === 0 ? (
          <p className="text-sm text-gray-muted italic text-center py-4">No friends have reviewed this movie yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {friendReviews.map((fr) => (
              <li key={fr.id} className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-navy-card/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-lighter">{fr.profiles?.username ?? 'Unknown'}</p>
                  <span className="text-xs text-gray-muted">{formatRewatch(fr.rewatch_count ?? 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={fr.rating} readOnly size="sm" />
                  <span className="text-xs text-gray-muted">{fr.rating}/5</span>
                </div>
                {fr.review_text && <p className="text-sm text-gray-light/80 leading-relaxed">{fr.review_text}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Watched Movie Detail Modal ───────────────────────────────────────────────
function WatchedMovieModal({ movie, review, onClose, onEdit, onShare, onRewatch, onDecrementRewatch, onGoToReviews, onPersonClick }: {
  movie: Movie; review: Review; onClose: () => void; onEdit: () => void; onShare: () => void
  onRewatch: () => void; onDecrementRewatch: () => void; onGoToReviews: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  return (
    <MovieDetailModal
      movie={movie}
      onClose={onClose}
      onPersonClick={onPersonClick}
      myReviewOverride={review}
      rewatch={{ onIncrement: onRewatch, onDecrement: onDecrementRewatch }}
      actions={[
        {
          key: 'edit',
          label: 'Edit Rating & Review',
          variant: 'teal',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
          onClick: onEdit,
        },
        {
          key: 'share',
          label: 'Share / Add to Category',
          variant: 'magenta',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          ),
          onClick: onShare,
        },
        {
          key: 'reviews',
          label: 'Go to Reviews',
          variant: 'outline',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          ),
          onClick: onGoToReviews,
        },
      ]}
    />
  )
}

// ─── Watchlist Movie Detail Modal ─────────────────────────────────────────────
function WatchlistMovieModal({ movie, onClose, onRemove, onWriteReview, onPersonClick }: {
  movie: Movie; onClose: () => void; onRemove: () => void; onWriteReview: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  const [showRecommendPanel, setShowRecommendPanel] = useState(false)

  return (
    <MovieDetailModal
      movie={movie}
      onClose={onClose}
      onPersonClick={onPersonClick}
      extraContent={
        showRecommendPanel ? (
          <SendToFriendsPanel
            movie={movie}
            onCancel={() => setShowRecommendPanel(false)}
            onSent={() => setShowRecommendPanel(false)}
          />
        ) : undefined
      }
      actions={[
        {
          key: 'write-review',
          label: 'Write a Review',
          variant: 'primary',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
          onClick: onWriteReview,
        },
        {
          key: 'send',
          label: 'Send to Friends',
          variant: 'teal',
          active: showRecommendPanel,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          ),
          onClick: () => setShowRecommendPanel((v) => !v),
        },
        {
          key: 'remove',
          label: 'Remove from Watchlist',
          variant: 'danger',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ),
          onClick: onRemove,
        },
      ]}
    />
  )
}

// ─── Suggested Movie Detail Modal — a "Did you mean…" pick, not yet in
//     either list, so both watchlist and review are live options. ─────────
function SuggestedMovieModal({ movie, onClose, isInWatchlist, onAddWatchlist, onRemoveWatchlist, onWriteReview, onPersonClick }: {
  movie: Movie; onClose: () => void; isInWatchlist: boolean
  onAddWatchlist: () => void; onRemoveWatchlist: () => void; onWriteReview: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  return (
    <MovieDetailModal
      movie={movie}
      onClose={onClose}
      onPersonClick={onPersonClick}
      actions={[
        {
          key: 'watchlist',
          label: isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist',
          variant: isInWatchlist ? 'teal' : 'outline',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isInWatchlist ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              )}
            </svg>
          ),
          onClick: () => (isInWatchlist ? onRemoveWatchlist() : onAddWatchlist()),
        },
        {
          key: 'write-review',
          label: 'Write a Review',
          variant: 'primary',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
          onClick: onWriteReview,
        },
      ]}
    />
  )
}

// ─── Friends Activity Section ─────────────────────────────────────────────────
function FriendsActivitySection({
  friendActivity, myFriendsCount, onNavigateToProfile, onPersonClick,
}: {
  friendActivity: FriendActivityItem[]
  myFriendsCount: number
  onNavigateToProfile: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  const [selectedReview, setSelectedReview] = useState<{
    friendName: string
    review: FriendActivityItem['reviews'][number]
  } | null>(null)

  const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'

  if (myFriendsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-gray-300 font-medium">You haven't added any friends yet.</p>
        <button onClick={onNavigateToProfile} className="mt-1 flex items-center gap-2 rounded-full bg-magenta px-5 py-2 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors">
          Go to Profile to Add Friends
        </button>
      </div>
    )
  }

  if (friendActivity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-gray-300">None of your friends have watched anything in the last 7 days.</p>
        <p className="text-xs text-gray-400">Check back soon!</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {friendActivity.map((friend) => (
          <div key={friend.friend_id} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-lighter">
              <span className="text-teal-light">{friend.username}</span> recently watched
            </h3>
              {/* Refactored for mobile: 2 cols on mobile for friends activity grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {friend.reviews.map((review) => {
                const m = review.movies
                const posterUrl = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null
                return (
                  <button
                    key={review.id}
                    onClick={() => setSelectedReview({ friendName: friend.username, review })}
                    className="group flex flex-col gap-1 text-left"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-card relative bg-navy-card/60">
                      {posterUrl ? (
                        <RetryImage
                          src={posterUrl}
                          alt={m.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallback={
                            <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-gray-muted">
                              {m.title}
                            </div>
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-gray-muted">
                          {m.title}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-lighter leading-snug line-clamp-2">{m.title}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedReview && (
        <FriendReviewModal
          friendName={selectedReview.friendName}
          review={selectedReview.review}
          onClose={() => setSelectedReview(null)}
          onPersonClick={onPersonClick}
        />
      )}
    </>
  )
}

// ─── Friend Review Detail Modal ────────────────────────────────────────────────
function FriendReviewModal({ friendName, review, onClose, onPersonClick }: {
  friendName: string
  review: FriendActivityItem['reviews'][number]
  onClose: () => void
  onPersonClick?: (personId: number, name: string, type: 'actor' | 'director') => void
}) {
  const queryClient = useQueryClient()

  useBodyScrollLock(true)

  const movie = review.movies as Movie
  const totalWatched = (review.rewatch_count ?? 0) + 1
  const [showReviewModal, setShowReviewModal] = useState(false)

  const { data: reviewData } = useQuery({
    queryKey: ['movie-reviews', movie.id],
    queryFn: () => getMovieReviews(movie.id),
    staleTime: 1000 * 60 * 2,
  })
  const myReview = reviewData?.my_review ?? null

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
    staleTime: 1000 * 60 * 2,
  })
  const inWatchlist = watchlist.some((w) => w.movie_id === movie.id)

  const addWatchlistMutation = useMutation({
    mutationFn: () => addToWatchlist({ movie_id: movie.id, title: movie.title, poster_path: movie.poster_path ?? null, release_date: movie.release_date ?? null, genre_ids: movie.genre_ids, vote_average: movie.vote_average }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })
  const removeWatchlistMutation = useMutation({
    mutationFn: () => removeFromWatchlist(movie.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const actions = [
    {
      key: 'review',
      label: myReview ? 'Edit Review' : 'Write a Review',
      variant: 'primary' as const,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: () => setShowReviewModal(true),
    },
    ...(!myReview
      ? [
          inWatchlist
            ? {
                key: 'watchlist',
                label: 'On Watchlist',
                variant: 'danger' as const,
                disabled: removeWatchlistMutation.isPending,
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ),
                onClick: () => removeWatchlistMutation.mutate(),
              }
            : {
                key: 'watchlist',
                label: 'Add to Watchlist',
                variant: 'teal' as const,
                disabled: addWatchlistMutation.isPending,
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                ),
                onClick: () => addWatchlistMutation.mutate(),
              },
        ]
      : []),
  ]

  return (
    <>
      <MovieDetailModal
        movie={movie}
        onClose={onClose}
        onPersonClick={onPersonClick}
        recommendationOverride={{
          sender: { id: review.user_id, username: friendName },
          sender_review: { id: review.id, rating: review.rating, review_text: review.review_text, created_at: review.created_at },
          recommended_at: review.created_at,
        }}
        pinnedTagLabel={null}
        pinnedAccent="teal"
        pinnedMetaText={`Watched ${totalWatched} time${totalWatched !== 1 ? 's' : ''}`}
        actions={actions}
      />

      {showReviewModal && (
        <ReviewModal
          movie={movie}
          mode={myReview ? 'edit' : 'create'}
          reviewId={myReview?.id}
          initialRating={myReview?.rating}
          initialReviewText={myReview?.review_text ?? undefined}
          initialCategoryIds={myReview?.category_ids ?? []}
          onClose={() => setShowReviewModal(false)}
          onSaved={() => { setShowReviewModal(false); queryClient.invalidateQueries({ queryKey: ['movie-reviews', movie.id] }) }}
        />
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyMoviesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeSection, setActiveSection] = useState<SidebarSection>('watched')
  const [searchQ, setSearchQ] = useState('')
  const [lastFriendsViewedAt, setLastFriendsViewedAt] = useState<number>(
    () => parseInt(localStorage.getItem('lastFriendsViewedAt') ?? '0', 10)
  )
  const [personModalId, setPersonModalId] = useState<number | null>(null)

  const [showSortPanel, setShowSortPanel] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey | null>(null)
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([])
  const [filterGenreIds, setFilterGenreIds] = useState<number[]>([])
  const [filterYearFrom, setFilterYearFrom] = useState('')
  const [filterYearTo, setFilterYearTo] = useState('')
  const [filterActor, setFilterActor] = useState('')
  const [filterActorId, setFilterActorId] = useState<number | null>(null)
  const [filterDirector, setFilterDirector] = useState('')
  const [filterDirectorId, setFilterDirectorId] = useState<number | null>(null)
  const [favActorQ, setFavActorQ] = useState('')
  const [favDirectorQ, setFavDirectorQ] = useState('')
  const [showReviewsModal, setShowReviewsModal] = useState(false)

  const [watchedDetail, setWatchedDetail] = useState<{ movie: Movie; review: Review } | null>(null)
  const [watchlistDetail, setWatchlistDetail] = useState<Movie | null>(null)
  const [suggestedMovieDetail, setSuggestedMovieDetail] = useState<Movie | null>(null)
  const [reviewModal, setReviewModal] = useState<ReviewModalConfig | null>(null)

  // "Did you mean…" suggestions — debounced so a thin/empty local result
  // doesn't fire a catalog search on every keystroke, only once typing pauses.
  const debouncedSearchQ = useDebouncedValue(searchQ, 400)
  const debouncedFavActorQ = useDebouncedValue(favActorQ, 400)
  const debouncedFavDirectorQ = useDebouncedValue(favDirectorQ, 400)

  const { data: movieSuggestionsData, isFetching: movieSuggestionsFetching } = useQuery({
    queryKey: ['movies', 'search', 'suggestions', debouncedSearchQ],
    queryFn: ({ signal }) => searchMovies(debouncedSearchQ.trim(), 1, signal),
    enabled: (activeSection === 'watched' || activeSection === 'want-to-watch') && debouncedSearchQ.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  })

  const { data: actorSuggestionsData, isFetching: actorSuggestionsFetching } = useQuery({
    queryKey: ['people', 'search', 'suggestions-actor', debouncedFavActorQ],
    queryFn: ({ signal }) => searchPeople(debouncedFavActorQ.trim(), 1, signal),
    enabled: activeSection === 'favourite-actors' && debouncedFavActorQ.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  })

  const { data: directorSuggestionsData, isFetching: directorSuggestionsFetching } = useQuery({
    queryKey: ['people', 'search', 'suggestions-director', debouncedFavDirectorQ],
    queryFn: ({ signal }) => searchPeople(debouncedFavDirectorQ.trim(), 1, signal),
    enabled: activeSection === 'favourite-directors' && debouncedFavDirectorQ.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  })

  // Whether a movie is already watched/watchlisted is needed outside the
  // 'watched'/'want-to-watch' tabs too — the "Did you mean…" suggested-movie
  // modal needs it for its watchlist toggle, and clicking a movie in a
  // favourite actor/director's filmography needs it to open the *right*
  // modal (already-watched vs. already-watchlisted vs. neither).
  const needsWatchedWatchlistData = ['watched', 'want-to-watch', 'favourite-actors', 'favourite-directors'].includes(activeSection)

  const { data: initialReviewsData, isLoading } = useQuery({
    queryKey: ['my-reviews', 'initial'],
    queryFn: () => getMyReviews(1, 30),
    enabled: needsWatchedWatchlistData,
    staleTime: 1000 * 60 * 5,
  })

  // If the first page is full, there may be more — load all in the background
  const mayHaveMoreReviews = initialReviewsData !== undefined && initialReviewsData.reviews.length >= 30

  const { data: fullReviewsData, isFetching: isLoadingMoreReviews } = useQuery({
    queryKey: ['my-reviews', 'full'],
    queryFn: () => getMyReviews(1, 500),
    enabled: needsWatchedWatchlistData && mayHaveMoreReviews,
    staleTime: 1000 * 60 * 5,
  })

  const reviewsData = fullReviewsData ?? initialReviewsData

  const { data: watchlistData = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
    enabled: needsWatchedWatchlistData,
  })

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations'],
    queryFn: getRecommendations,
    refetchInterval: 30_000,
  })
  const unreadRecCount = recommendations.filter((r) => !r.is_read).length

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getMyCategories,
  })

  const removeFromWatchlistMutation = useMutation({
    mutationFn: (movieId: number) => removeFromWatchlist(movieId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
      setWatchlistDetail(null)
    },
  })

  const addToWatchlistMutation = useMutation({
    mutationFn: (movie: Movie) =>
      addToWatchlist({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        genre_ids: movie.genre_ids,
        vote_average: movie.vote_average,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const incrementRewatchMutation = useMutation({
    mutationFn: (reviewId: string) => incrementRewatch(reviewId),
    onSuccess: (data, reviewId) => {
      const updater = (old: PaginatedReviews | undefined) =>
        old ? { ...old, reviews: old.reviews.map((r) => r.id === reviewId ? { ...r, rewatch_count: data.rewatch_count } : r) } : old
      qc.setQueryData<PaginatedReviews>(['my-reviews', 'initial'], updater)
      qc.setQueryData<PaginatedReviews>(['my-reviews', 'full'], updater)
      setWatchedDetail((prev) => {
        if (!prev || prev.review.id !== reviewId) return prev
        return { ...prev, review: { ...prev.review, rewatch_count: data.rewatch_count } }
      })
    },
  })

  const decrementRewatchMutation = useMutation({
    mutationFn: (reviewId: string) => decrementRewatch(reviewId),
    onSuccess: (data, reviewId) => {
      const updater = (old: PaginatedReviews | undefined) =>
        old ? { ...old, reviews: old.reviews.map((r) => r.id === reviewId ? { ...r, rewatch_count: data.rewatch_count } : r) } : old
      qc.setQueryData<PaginatedReviews>(['my-reviews', 'initial'], updater)
      qc.setQueryData<PaginatedReviews>(['my-reviews', 'full'], updater)
      setWatchedDetail((prev) => {
        if (!prev || prev.review.id !== reviewId) return prev
        return { ...prev, review: { ...prev.review, rewatch_count: data.rewatch_count } }
      })
    },
  })

  const { data: friendRatings = {} } = useQuery({
    queryKey: ['bulk-friend-ratings'],
    queryFn: getBulkFriendRatings,
    enabled: activeSection === 'watched' && (sortBy === 'rating-friends-high' || sortBy === 'rating-friends-low'),
    staleTime: 1000 * 60 * 5,
  })

  const { data: friendActivity = [] } = useQuery({
    queryKey: ['friend-activity'],
    queryFn: getFriendActivity,
    refetchInterval: 60_000,
  })

  const { data: myFriends = [] } = useQuery({
    queryKey: ['my-friends'],
    queryFn: getMyFriends,
    enabled: activeSection === 'Friends',
  })

  const { data: favActors = [] } = useQuery({
    queryKey: ['favourite-actors'],
    queryFn: getFavouriteActors,
    staleTime: 1000 * 60 * 5,
  })

  const { data: favDirectors = [] } = useQuery({
    queryKey: ['favourite-directors'],
    queryFn: getFavouriteDirectors,
    staleTime: 1000 * 60 * 5,
  })

  const removeActorMutation = useMutation({
    mutationFn: (actorId: number) => removeFavouriteActor(actorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-actors'] }),
  })

  const removeDirectorMutation = useMutation({
    mutationFn: (directorId: number) => removeFavouriteDirector(directorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-directors'] }),
  })

  const addActorMutation = useMutation({
    mutationFn: (person: PersonSearchResult) =>
      addFavouriteActor({ person_id: person.id, name: person.name, profile_path: person.profile_path }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-actors'] }),
  })
  const addingActorId = addActorMutation.isPending ? addActorMutation.variables?.id ?? null : null

  const addDirectorMutation = useMutation({
    mutationFn: (person: PersonSearchResult) =>
      addFavouriteDirector({ person_id: person.id, name: person.name, profile_path: person.profile_path }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-directors'] }),
  })
  const addingDirectorId = addDirectorMutation.isPending ? addDirectorMutation.variables?.id ?? null : null

  const { data: filterActorDetails } = useQuery({
    queryKey: ['person-details', filterActorId],
    queryFn: () => getPersonDetails(filterActorId!),
    enabled: filterActorId !== null,
    staleTime: 1000 * 60 * 30,
  })
  const filterActorMovieIds = new Set(filterActorDetails?.movie_credits?.cast?.map((m: { id: number }) => m.id) ?? [])

  const { data: filterDirectorDetails } = useQuery({
    queryKey: ['person-details', filterDirectorId],
    queryFn: () => getPersonDetails(filterDirectorId!),
    enabled: filterDirectorId !== null,
    staleTime: 1000 * 60 * 30,
  })
  const filterDirectorMovieIds = new Set(
    filterDirectorDetails?.movie_credits?.crew?.filter((m) => m.job === 'Director').map((m) => m.id) ?? []
  )

  const movieReviewPairs: { movie: Movie; review: Review }[] = []
  const seenIds = new Set<number>()
  for (const review of reviewsData?.reviews ?? []) {
    if (review.movies && !seenIds.has(review.movies.id)) {
      seenIds.add(review.movies.id)
      movieReviewPairs.push({ movie: review.movies as Movie, review })
    }
  }

  const sortedWatched = [...movieReviewPairs].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':    return new Date(a.review.created_at).getTime() - new Date(b.review.created_at).getTime()
      case 'date-desc':   return new Date(b.review.created_at).getTime() - new Date(a.review.created_at).getTime()
      case 'release-asc': {
        const da = a.movie.release_date ? new Date(a.movie.release_date).getTime() : 0
        const db = b.movie.release_date ? new Date(b.movie.release_date).getTime() : 0
        return da - db
      }
      case 'release-desc': {
        const da = a.movie.release_date ? new Date(a.movie.release_date).getTime() : 0
        const db = b.movie.release_date ? new Date(b.movie.release_date).getTime() : 0
        return db - da
      }
      case 'rating-high': return b.review.rating - a.review.rating
      case 'rating-low':  return a.review.rating - b.review.rating
      case 'rating-friends-high': {
        const ra = friendRatings[String(a.movie.id)] ?? a.review.rating
        const rb = friendRatings[String(b.movie.id)] ?? b.review.rating
        return rb - ra
      }
      case 'rating-friends-low': {
        const ra = friendRatings[String(a.movie.id)] ?? a.review.rating
        const rb = friendRatings[String(b.movie.id)] ?? b.review.rating
        return ra - rb
      }
      case 'rating-public-high': return (b.movie.vote_average ?? 0) - (a.movie.vote_average ?? 0)
      case 'rating-public-low':  return (a.movie.vote_average ?? 0) - (b.movie.vote_average ?? 0)
      case 'alpha-az':    return a.movie.title.localeCompare(b.movie.title)
      case 'alpha-za':    return b.movie.title.localeCompare(a.movie.title)
      default: return 0
    }
  })

  const filteredWatched = sortedWatched.filter(({ movie, review }) => {
    if (searchQ.trim() && !movie.title.toLowerCase().includes(searchQ.toLowerCase())) return false
    if (filterCategoryIds.length > 0) {
      const reviewCats = review.category_ids?.length ? review.category_ids : (review.category_id ? [review.category_id] : [])
      if (!filterCategoryIds.some((id) => reviewCats.includes(id))) return false
    }
    if (filterGenreIds.length > 0 && !(movie.genre_ids ?? []).some(id => filterGenreIds.includes(id))) return false
    if (filterActorId && filterActorMovieIds.size > 0 && !filterActorMovieIds.has(movie.id)) return false
    if (filterDirectorId && filterDirectorMovieIds.size > 0 && !filterDirectorMovieIds.has(movie.id)) return false
    const yr = movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null
    if (filterYearFrom && yr && yr < parseInt(filterYearFrom)) return false
    if (filterYearTo && yr && yr > parseInt(filterYearTo)) return false
    return true
  })

  const sortedWatchlist = [...watchlistData].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':    return new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
      case 'date-desc':   return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      case 'release-asc': {
        const da = a.movies.release_date ? new Date(a.movies.release_date).getTime() : 0
        const db = b.movies.release_date ? new Date(b.movies.release_date).getTime() : 0
        return da - db
      }
      case 'release-desc': {
        const da = a.movies.release_date ? new Date(a.movies.release_date).getTime() : 0
        const db = b.movies.release_date ? new Date(b.movies.release_date).getTime() : 0
        return db - da
      }
      case 'alpha-az':  return a.movies.title.localeCompare(b.movies.title)
      case 'alpha-za':  return b.movies.title.localeCompare(a.movies.title)
      default: return 0
    }
  })

  const filteredWatchlist = sortedWatchlist.filter((w) => {
    if (searchQ.trim() && !w.movies.title.toLowerCase().includes(searchQ.toLowerCase())) return false
    if (filterGenreIds.length > 0 && !(w.movies.genre_ids ?? []).some(id => filterGenreIds.includes(id))) return false
    const movieId = w.movies.id
    if (filterActorId && filterActorMovieIds.size > 0 && !filterActorMovieIds.has(movieId)) return false
    if (filterDirectorId && filterDirectorMovieIds.size > 0 && !filterDirectorMovieIds.has(movieId)) return false
    const yr = w.movies.release_date ? parseInt(w.movies.release_date.slice(0, 4)) : null
    if (filterYearFrom && yr && yr < parseInt(filterYearFrom)) return false
    if (filterYearTo && yr && yr > parseInt(filterYearTo)) return false
    return true
  })

  // "Did you mean…" candidate pools — the full-catalog/full-people search
  // results, minus whatever's already in the relevant list, capped at 10.
  const watchedMovieIds = new Set(movieReviewPairs.map(({ movie }) => movie.id))
  const watchlistMovieIds = new Set(watchlistData.map((w) => w.movies.id))

  // Rough client-side stand-in for the For You algorithm, for ranking a
  // favourite actor/director's filmography: genres from movies the user
  // rated well score positive, genres from ones they rated poorly score
  // negative. Empty (and so a no-op) until they've rated anything.
  const genreScore = new Map<number, number>()
  for (const { movie, review } of movieReviewPairs) {
    const weight = review.rating - 3 // ratings are 1-5; center on neutral
    if (weight === 0) continue
    for (const gid of movie.genre_ids ?? []) {
      genreScore.set(gid, (genreScore.get(gid) ?? 0) + weight)
    }
  }
  const favActorIds = new Set(favActors.map((a) => a.actor_id))
  const favDirectorIds = new Set(favDirectors.map((d) => d.director_id))

  const watchedSuggestions = (movieSuggestionsData?.results ?? []).filter((m) => !watchedMovieIds.has(m.id)).slice(0, 10)
  const watchlistSuggestions = (movieSuggestionsData?.results ?? []).filter((m) => !watchlistMovieIds.has(m.id)).slice(0, 10)
  const actorSuggestions = (actorSuggestionsData?.results ?? [])
    .filter((p) => p.known_for_department === 'Acting' && !favActorIds.has(p.id))
    .slice(0, 10)
  const directorSuggestions = (directorSuggestionsData?.results ?? [])
    .filter((p) => p.known_for_department === 'Directing' && !favDirectorIds.has(p.id))
    .slice(0, 10)

  const filteredFavActors = favActors.filter((a) => !favActorQ.trim() || (a.actor_name ?? '').toLowerCase().includes(favActorQ.toLowerCase()))
  const filteredFavDirectors = favDirectors.filter((d) => !favDirectorQ.trim() || (d.director_name ?? '').toLowerCase().includes(favDirectorQ.toLowerCase()))

  // A movie clicked from a favourite actor/director's filmography strip —
  // route it to whichever modal actually fits: already watched (show the
  // review), already watchlisted, or neither (the "did you mean" modal,
  // which offers both).
  const handleFilmographyMovieSelect = (movie: Movie) => {
    const watchedPair = movieReviewPairs.find((p) => p.movie.id === movie.id)
    if (watchedPair) { setWatchedDetail(watchedPair); return }
    const watchlistItem = watchlistData.find((w) => w.movies.id === movie.id)
    if (watchlistItem) { setWatchlistDetail(watchlistItem.movies as Movie); return }
    setSuggestedMovieDetail(movie)
  }

  const showSortFilter = activeSection !== 'Recommendations' && activeSection !== 'favourite-actors' && activeSection !== 'favourite-directors' && activeSection !== 'Friends'
  const activeFiltersCount = [filterCategoryIds.length > 0 ? 'x' : null, filterGenreIds.length > 0 ? 'x' : null, filterYearFrom, filterYearTo, filterActorId ? 'x' : null, filterDirectorId ? 'x' : null].filter(Boolean).length

  const hasUnreadRecs = unreadRecCount > 0
  const newFriendActivityCount = friendActivity.filter((f) =>
    f.reviews.some((r) => new Date(r.created_at).getTime() > lastFriendsViewedAt)
  ).length
  const hasNewFriendActivity = newFriendActivityCount > 0

  // Reorder mobile tabs so priority tabs sit directly after the active tab
  function getMobileTabOrder() {
    const priorityIds: SidebarSection[] = []
    if (hasUnreadRecs && activeSection !== 'Recommendations') priorityIds.push('Recommendations')
    if (hasNewFriendActivity && activeSection !== 'Friends') priorityIds.push('Friends')
    if (priorityIds.length === 0) return SIDEBAR_LINKS
    const base = SIDEBAR_LINKS.filter((l) => !priorityIds.includes(l.id))
    const activeIdx = base.findIndex((l) => l.id === activeSection)
    const result = [...base]
    result.splice(activeIdx + 1, 0, ...priorityIds.map((id) => SIDEBAR_LINKS.find((l) => l.id === id)!))
    return result
  }
  const mobileTabs = getMobileTabOrder()

  const resetSectionState = () => {
    setWatchedDetail(null); setWatchlistDetail(null); setSuggestedMovieDetail(null)
    setSortBy(null); setFilterCategoryIds([]); setFilterGenreIds([])
    setFilterYearFrom(''); setFilterYearTo('')
    setFilterActor(''); setFilterActorId(null); setFilterDirector(''); setFilterDirectorId(null)
    setFavActorQ(''); setFavDirectorQ('')
    setSearchQ('')
    setShowReviewsModal(false)
  }

  return (
    // Refactored for mobile: flex-col on mobile stacks sidebar below content; switches to row on md+
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:gap-8 md:px-6 md:py-8 2xl:max-w-[1600px]">
      {/* Refactored for mobile: sidebar hidden on small screens, shown md+ */}
      <aside className="hidden md:block w-60 shrink-0 self-start sticky top-20">
        <ul className="flex flex-col gap-8">
          {SIDEBAR_LINKS.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => { setActiveSection(link.id); resetSectionState(); if (link.id === 'Friends') { const now = Date.now(); setLastFriendsViewedAt(now); localStorage.setItem('lastFriendsViewedAt', String(now)) } }}
                className={`sidebar-link w-full text-left flex items-center gap-2${activeSection === link.id ? ' active' : ''}`}
              >
                {link.label}
                {link.id === 'Recommendations' && unreadRecCount > 0 && (
                  <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{unreadRecCount}</span>
                )}
                {link.id === 'Friends' && hasNewFriendActivity && (
                  <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{newFriendActivityCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Refactored for mobile: horizontal scroll nav replaces sidebar on small screens */}
      <nav data-no-swipe="true" className="md:hidden flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {mobileTabs.map((link) => {
          const isActive = activeSection === link.id
          const isPriority = !isActive && (
            (link.id === 'Recommendations' && hasUnreadRecs) ||
            (link.id === 'Friends' && hasNewFriendActivity)
          )
          return (
            <button
              key={link.id}
              onClick={() => {
                setActiveSection(link.id)
                resetSectionState()
                if (link.id === 'Friends') { const now = Date.now(); setLastFriendsViewedAt(now); localStorage.setItem('lastFriendsViewedAt', String(now)) }
              }}
              className={[
                'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'border-teal/60 bg-teal/10 text-teal-light'
                  : isPriority
                  ? 'border-magenta/60 bg-magenta/10 text-magenta'
                  : 'border-white/15 bg-navy-card/40 text-gray-muted',
              ].join(' ')}
            >
              {link.label}
              {link.id === 'Recommendations' && unreadRecCount > 0 && (
                <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{unreadRecCount}</span>
              )}
              {link.id === 'Friends' && hasNewFriendActivity && (
                <span className="rounded-full bg-magenta px-1.5 py-0.5 text-xs font-bold text-white leading-none">{newFriendActivityCount}</span>
              )}
            </button>
          )
        })}
      </nav>

      <main className="min-w-0 flex-1">
        {activeSection !== 'Recommendations' && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-lighter">
              {SIDEBAR_LINKS.find((l) => l.id === activeSection)?.label}
            </h2>
          </div>
        )}

        {showSortFilter && (
          <div className="mb-5 flex items-center gap-3">
            <button
              onClick={() => { setShowSortPanel(true); setShowFilterPanel(false) }}
              className={['flex items-center justify-center rounded-lg border p-2 transition-colors',
                sortBy ? 'border-teal/60 bg-teal/10 text-teal-light' : 'border-white/15 bg-navy-card/40 text-gray-muted hover:text-gray-lighter'].join(' ')}
              title="Sort"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M17 3v14l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => { setShowFilterPanel(true); setShowSortPanel(false) }}
              className={['relative flex items-center justify-center rounded-lg border p-2 transition-colors',
                activeFiltersCount > 0 ? 'border-magenta/60 bg-magenta/10 text-magenta' : 'border-white/15 bg-navy-card/40 text-gray-muted hover:text-gray-lighter'].join(' ')}
              title="Filter"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-magenta text-white text-[10px] font-bold flex items-center justify-center leading-none">{activeFiltersCount}</span>
              )}
            </button>
            <input type="text" placeholder="Search" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              className="flex-1 rounded-full border border-white/15 bg-navy-card/40 px-4 py-2 text-sm text-gray-lighter placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-teal/40" />
          </div>
        )}

        {activeSection === 'watched' && (
          <>
            {isLoading ? (
              <MovieGridSkeleton />
            ) : movieReviewPairs.length === 0 && !searchQ.trim() ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <p className="text-gray-300">No movies reviewed yet.</p>
                <p className="text-xs text-gray-400">Head to <strong className="text-teal-500">Make Review</strong> to add your first one.</p>
              </div>
            ) : (
              <>
                {filteredWatched.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"> {/* Refactored for mobile: 2 cols on mobile */}
                    {filteredWatched.map(({ movie, review }) => (
                      <MovieCard key={movie.id} movie={movie} onSelect={() => setWatchedDetail({ movie, review })} />
                    ))}
                    {!searchQ.trim() && filterCategoryIds.length === 0 && !filterYearFrom && !filterYearTo && !isLoadingMoreReviews && (
                      <button onClick={() => navigate('/')} className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-card border-2 border-dashed border-white/20 bg-navy-card/30 text-gray-muted hover:border-white/40 hover:text-gray-lighter transition-colors" title="Add a movie">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    )}
                  </div>
                )}
                <DidYouMeanMovies
                  query={searchQ}
                  localCount={filteredWatched.length}
                  suggestions={watchedSuggestions}
                  isFetching={movieSuggestionsFetching}
                  onSelect={setSuggestedMovieDetail}
                />
              </>
              )}
              {isLoadingMoreReviews && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-muted">
                  <span className="h-3 w-3 animate-spin rounded-full border border-gray-muted border-t-transparent" />
                  Loading more movies…
                </div>
              )}
          </>
        )}

        {activeSection === 'want-to-watch' && (
          <>
            {watchlistLoading ? (
              <MovieGridSkeleton />
            ) : watchlistData.length === 0 && !searchQ.trim() ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <p className="text-gray-300">Your watchlist is empty.</p>
                <p className="text-xs text-gray-400">Search for movies and click the <strong>+</strong> icon to add them here.</p>
              </div>
            ) : (
              <>
                {filteredWatchlist.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"> {/* Refactored for mobile: 2 cols on mobile */}
                    {filteredWatchlist.map((w) => (
                      <MovieCard key={w.movie_id} movie={w.movies as Movie} onSelect={(m) => setWatchlistDetail(m)} />
                    ))}
                    {!searchQ.trim() && !filterYearFrom && !filterYearTo && (
                      <button onClick={() => navigate('/')} className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-card border-2 border-dashed border-white/20 bg-navy-card/30 text-gray-muted hover:border-white/40 hover:text-gray-lighter transition-colors" title="Add a movie">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    )}
                  </div>
                )}
                <DidYouMeanMovies
                  query={searchQ}
                  localCount={filteredWatchlist.length}
                  suggestions={watchlistSuggestions}
                  isFetching={movieSuggestionsFetching}
                  onSelect={setSuggestedMovieDetail}
                />
              </>
            )}
          </>
        )}

        {activeSection === 'favourite-actors' && (
          <div className="flex max-w-4xl flex-col gap-4">
            <input
              type="text"
              placeholder="Search actors…"
              value={favActorQ}
              onChange={(e) => setFavActorQ(e.target.value)}
              className="rounded-full border border-white/15 bg-navy-card/40 px-4 py-2 text-sm text-gray-lighter placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-teal/40"
            />
            {favActors.length === 0 && !favActorQ.trim() ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-gray-300">No favourite actors saved yet.</p>
                <p className="text-xs text-gray-400">Find an actor in the Search tab and add them to your favourites.</p>
              </div>
            ) : (
              <>
                {filteredFavActors.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {filteredFavActors.map((actor) => (
                      <PersonFilmographyRow
                        key={actor.actor_id}
                        personId={actor.actor_id}
                        name={actor.actor_name}
                        profilePath={actor.profile_path}
                        type="actor"
                        onOpenPerson={() => setPersonModalId(actor.actor_id)}
                        onRemove={() => removeActorMutation.mutate(actor.actor_id)}
                        removing={removeActorMutation.isPending}
                        onSelectMovie={handleFilmographyMovieSelect}
                        genreScore={genreScore}
                        watchlistMovieIds={watchlistMovieIds}
                      />
                    ))}
                  </div>
                )}
                <DidYouMeanPeople
                  kind="actor"
                  query={favActorQ}
                  localCount={filteredFavActors.length}
                  suggestions={actorSuggestions}
                  isFetching={actorSuggestionsFetching}
                  onSelect={setPersonModalId}
                  onAdd={(p) => addActorMutation.mutate(p)}
                  addingId={addingActorId}
                />
              </>
            )}
          </div>
        )}

        {activeSection === 'favourite-directors' && (
          <div className="flex max-w-4xl flex-col gap-4">
            <input
              type="text"
              placeholder="Search directors…"
              value={favDirectorQ}
              onChange={(e) => setFavDirectorQ(e.target.value)}
              className="rounded-full border border-white/15 bg-navy-card/40 px-4 py-2 text-sm text-gray-lighter placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-teal/40"
            />
            {favDirectors.length === 0 && !favDirectorQ.trim() ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-gray-300">No favourite directors saved yet.</p>
                <p className="text-xs text-gray-400">Find a director in the Search tab and add them to your favourites.</p>
              </div>
            ) : (
              <>
                {filteredFavDirectors.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {filteredFavDirectors.map((director) => (
                      <PersonFilmographyRow
                        key={director.director_id}
                        personId={director.director_id}
                        name={director.director_name}
                        profilePath={director.profile_path}
                        type="director"
                        onOpenPerson={() => setPersonModalId(director.director_id)}
                        onRemove={() => removeDirectorMutation.mutate(director.director_id)}
                        removing={removeDirectorMutation.isPending}
                        onSelectMovie={handleFilmographyMovieSelect}
                        genreScore={genreScore}
                        watchlistMovieIds={watchlistMovieIds}
                      />
                    ))}
                  </div>
                )}
                <DidYouMeanPeople
                  kind="director"
                  query={favDirectorQ}
                  localCount={filteredFavDirectors.length}
                  suggestions={directorSuggestions}
                  isFetching={directorSuggestionsFetching}
                  onSelect={setPersonModalId}
                  onAdd={(p) => addDirectorMutation.mutate(p)}
                  addingId={addingDirectorId}
                />
              </>
            )}
          </div>
        )}

        {activeSection === 'Recommendations' && <RecommendationsSection />}

        {activeSection === 'Friends' && (
          <FriendsActivitySection
            friendActivity={friendActivity}
            myFriendsCount={myFriends.length}
            onNavigateToProfile={() => navigate('/profile')}
            onPersonClick={(pid) => setPersonModalId(pid)}
          />
        )}
      </main>

      <SortPanel open={showSortPanel} onClose={() => setShowSortPanel(false)} sortBy={sortBy} setSortBy={setSortBy} showRating={activeSection === 'watched'} />

      <FilterPanel
        open={showFilterPanel} onClose={() => setShowFilterPanel(false)}
        categories={categories}
        filterCategoryIds={filterCategoryIds} setFilterCategoryIds={setFilterCategoryIds}
        filterYearFrom={filterYearFrom} setFilterYearFrom={setFilterYearFrom}
        filterYearTo={filterYearTo} setFilterYearTo={setFilterYearTo}
        filterActor={filterActor} setFilterActor={setFilterActor}
        filterActorId={filterActorId} setFilterActorId={setFilterActorId}
        filterDirector={filterDirector} setFilterDirector={setFilterDirector}
        filterDirectorId={filterDirectorId} setFilterDirectorId={setFilterDirectorId}
        filterGenreIds={filterGenreIds} setFilterGenreIds={setFilterGenreIds}
      />

      {watchedDetail && !reviewModal && !showReviewsModal && (
        <WatchedMovieModal
          movie={watchedDetail.movie}
          review={watchedDetail.review}
          onClose={() => setWatchedDetail(null)}
          onEdit={() => setReviewModal({ mode: 'edit', movie: watchedDetail.movie, reviewId: watchedDetail.review.id, initialRating: watchedDetail.review.rating, initialReviewText: watchedDetail.review.review_text ?? undefined, initialCategoryIds: watchedDetail.review.category_ids ?? [] })}
          onShare={() => setReviewModal({ mode: 'share', movie: watchedDetail.movie, reviewId: watchedDetail.review.id, initialCategoryIds: watchedDetail.review.category_ids ?? [] })}
          onRewatch={() => incrementRewatchMutation.mutate(watchedDetail.review.id)}
          onDecrementRewatch={() => decrementRewatchMutation.mutate(watchedDetail.review.id)}
          onGoToReviews={() => setShowReviewsModal(true)}
          onPersonClick={(pid) => setPersonModalId(pid)}
        />
      )}

      {watchedDetail && showReviewsModal && (
        <ReviewsListModal
          movie={watchedDetail.movie}
          myReview={watchedDetail.review}
          onClose={() => setShowReviewsModal(false)}
        />
      )}

      {watchlistDetail && !reviewModal && (
        <WatchlistMovieModal
          movie={watchlistDetail}
          onClose={() => setWatchlistDetail(null)}
          onRemove={() => removeFromWatchlistMutation.mutate(watchlistDetail.id)}
          onWriteReview={() => setReviewModal({
            mode: 'create', movie: watchlistDetail,
            onSaved: () => { removeFromWatchlistMutation.mutate(watchlistDetail.id); setWatchlistDetail(null) },
          })}
          onPersonClick={(pid) => setPersonModalId(pid)}
        />
      )}

      {suggestedMovieDetail && !reviewModal && (
        <SuggestedMovieModal
          movie={suggestedMovieDetail}
          onClose={() => setSuggestedMovieDetail(null)}
          isInWatchlist={watchlistMovieIds.has(suggestedMovieDetail.id)}
          onAddWatchlist={() => addToWatchlistMutation.mutate(suggestedMovieDetail)}
          onRemoveWatchlist={() => removeFromWatchlistMutation.mutate(suggestedMovieDetail.id)}
          onWriteReview={() => setReviewModal({
            mode: 'create', movie: suggestedMovieDetail,
            onSaved: () => setSuggestedMovieDetail(null),
          })}
          onPersonClick={(pid) => setPersonModalId(pid)}
        />
      )}

      {reviewModal && (
        <ReviewModal
          movie={reviewModal.movie}
          mode={reviewModal.mode}
          reviewId={reviewModal.reviewId}
          initialRating={reviewModal.initialRating}
          initialReviewText={reviewModal.initialReviewText}
          initialCategoryIds={reviewModal.initialCategoryIds}
          onSaved={reviewModal.onSaved}
          onClose={() => setReviewModal(null)}
        />
      )}

      {personModalId !== null && (
        <PersonModal
          personId={personModalId}
          onClose={() => setPersonModalId(null)}
        />
      )}
    </div>
  )
}
