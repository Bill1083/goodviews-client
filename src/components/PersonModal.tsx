import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPersonDetails,
  getFavouriteActors,
  getFavouriteDirectors,
  addFavouriteActor,
  removeFavouriteActor,
  addFavouriteDirector,
  removeFavouriteDirector,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../services/apiClient'
import MovieDescriptionPanel from './MovieDescriptionPanel'
import ReviewModal from '../features/reviews/ReviewModal'
import type { FilmographyEntry, Movie } from '../types'

const TMDB_PROFILE = 'https://image.tmdb.org/t/p/w342'
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w185'
const FALLBACK_POSTER = 'https://via.placeholder.com/185x278?text=No+Poster'

interface Props {
  personId: number
  onClose: () => void
  /** When a filmography movie is selected — if provided, parent handles it (e.g. SearchPage navigates to overview). If omitted, PersonModal handles it internally. */
  onMovieSelect?: (movie: Movie) => void
}

// ─── Inner filmography movie view ─────────────────────────────────────────────
function FilmographyMovieView({
  entry,
  onBack,
  onPersonClick,
}: {
  entry: FilmographyEntry
  onBack: () => void
  onPersonClick: (id: number, name: string, type: 'actor' | 'director') => void
}) {
  const qc = useQueryClient()
  const [showReviewModal, setShowReviewModal] = useState(false)

  const movie: Movie = {
    id: entry.id,
    title: entry.title,
    poster_path: entry.poster_path ?? null,
    release_date: entry.release_date ?? null,
    vote_average: entry.vote_average,
  }

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
    staleTime: 1000 * 60 * 5,
  })

  const inWatchlist = watchlist.some((w) => w.movie_id === entry.id)

  const addMutation = useMutation({
    mutationFn: () =>
      addToWatchlist({
        movie_id: entry.id,
        title: entry.title,
        poster_path: entry.poster_path ?? null,
        release_date: entry.release_date ?? null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const removeMutation = useMutation({
    mutationFn: () => removeFromWatchlist(entry.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const posterUrl = entry.poster_path ? `${TMDB_POSTER}${entry.poster_path}` : FALLBACK_POSTER

  return (
    <>
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="self-start flex items-center gap-1 text-xs text-gray-muted hover:text-gray-lighter transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to filmography
        </button>

        <div className="flex gap-4">
          <div className="w-24 shrink-0">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
              <img src={posterUrl} alt={entry.title} className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-lighter">{entry.title}</h3>
            {entry.release_date && (
              <p className="text-xs text-gray-muted">{entry.release_date.slice(0, 4)}</p>
            )}
            {entry.character && (
              <p className="text-xs text-gray-muted italic">as {entry.character}</p>
            )}
            {entry.job && (
              <p className="text-xs text-gray-muted italic">{entry.job}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {inWatchlist ? (
                <button
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal/50 bg-teal/10 text-xs font-medium text-teal hover:bg-teal/20 transition-colors disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  In Watchlist
                </button>
              ) : (
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={addMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-navy-card/40 text-xs font-medium text-gray-lighter hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Watchlist
                </button>
              )}
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-magenta/40 bg-magenta/10 text-xs font-medium text-magenta hover:bg-magenta/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Write a Review
              </button>
            </div>
          </div>
        </div>

        <MovieDescriptionPanel
          movieId={entry.id}
          onPersonClick={onPersonClick}
        />
      </div>

      {showReviewModal && (
        <ReviewModal
          mode="create"
          movie={movie}
          onClose={() => setShowReviewModal(false)}
          onSaved={() => {
            setShowReviewModal(false)
            qc.invalidateQueries({ queryKey: ['my-reviews'] })
            qc.invalidateQueries({ queryKey: ['watchlist'] })
          }}
        />
      )}
    </>
  )
}

// ─── Main PersonModal ─────────────────────────────────────────────────────────
export default function PersonModal({ personId, onClose, onMovieSelect }: Props) {
  const qc = useQueryClient()
  const [selectedFilmEntry, setSelectedFilmEntry] = useState<FilmographyEntry | null>(null)
  const [innerPersonId, setInnerPersonId] = useState<number | null>(null)
  const [innerPersonName, setInnerPersonName] = useState('')

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (innerPersonId !== null) {
          setInnerPersonId(null)
        } else if (selectedFilmEntry !== null) {
          setSelectedFilmEntry(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, selectedFilmEntry, innerPersonId])

  const { data: person, isLoading, isError } = useQuery({
    queryKey: ['person-details', personId],
    queryFn: () => getPersonDetails(personId),
    staleTime: 1000 * 60 * 30,
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

  const isActorFavourited = favActors.some((a) => a.actor_id === personId)
  const isDirectorFavourited = favDirectors.some((d) => d.director_id === personId)

  const addActorMutation = useMutation({
    mutationFn: () =>
      addFavouriteActor({ person_id: personId, name: person!.name, profile_path: person!.profile_path }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-actors'] }),
  })

  const removeActorMutation = useMutation({
    mutationFn: () => removeFavouriteActor(personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-actors'] }),
  })

  const addDirectorMutation = useMutation({
    mutationFn: () =>
      addFavouriteDirector({ person_id: personId, name: person!.name, profile_path: person!.profile_path }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-directors'] }),
  })

  const removeDirectorMutation = useMutation({
    mutationFn: () => removeFavouriteDirector(personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-directors'] }),
  })

  const profileUrl = person?.profile_path ? `${TMDB_PROFILE}${person.profile_path}` : null

  // Sort filmography by release date descending, filter out entries without a title
  const actingCredits = (person?.movie_credits?.cast ?? [])
    .filter((c) => c.title)
    .sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))

  const directingCredits = (person?.movie_credits?.crew ?? [])
    .filter((c) => c.job === 'Director' && c.title)
    .sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))

  const hasActingCredits = actingCredits.length > 0
  const hasDirectingCredits = directingCredits.length > 0

  const handlePersonClick = (pid: number, name: string, _type: 'actor' | 'director') => {
    setSelectedFilmEntry(null)
    setInnerPersonId(pid)
    setInnerPersonName(name)
  }

  const handleFilmClick = (entry: FilmographyEntry) => {
    if (onMovieSelect) {
      const movie: Movie = {
        id: entry.id,
        title: entry.title,
        poster_path: entry.poster_path ?? null,
        release_date: entry.release_date ?? null,
        vote_average: entry.vote_average,
      }
      onMovieSelect(movie)
    } else {
      setSelectedFilmEntry(entry)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="panel-card flex w-full max-w-2xl flex-col gap-0 overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10 shrink-0">
          <h2 className="text-base font-bold text-gray-lighter truncate">
            {isLoading ? 'Loading…' : (person?.name ?? 'Person')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-muted hover:text-gray-lighter text-xl leading-none shrink-0 ml-3"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-gray-muted animate-pulse">Loading…</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-red-400">Failed to load person details.</span>
            </div>
          )}

          {/* Inner person modal */}
          {innerPersonId !== null && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setInnerPersonId(null)}
                className="self-start flex items-center gap-1 text-xs text-gray-muted hover:text-gray-lighter transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to {person?.name ?? 'person'}
              </button>
              <InnerPersonView
                personId={innerPersonId}
                personName={innerPersonName}
                onFilmClick={handleFilmClick}
                onPersonClick={handlePersonClick}
              />
            </div>
          )}

          {/* Filmography movie detail */}
          {innerPersonId === null && selectedFilmEntry !== null && (
            <FilmographyMovieView
              entry={selectedFilmEntry}
              onBack={() => setSelectedFilmEntry(null)}
              onPersonClick={handlePersonClick}
            />
          )}

          {/* Main person view */}
          {innerPersonId === null && selectedFilmEntry === null && person && (
            <div className="flex flex-col gap-5">
              {/* Profile section */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  {profileUrl ? (
                    <img
                      src={profileUrl}
                      alt={person.name}
                      className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-xl border border-white/10"
                    />
                  ) : (
                    <div className="w-24 h-36 sm:w-32 sm:h-48 rounded-xl bg-navy-card/60 border border-white/10 flex items-center justify-center">
                      <span className="text-2xl text-gray-muted">{person.name.charAt(0)}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-lighter">{person.name}</h3>
                  {person.known_for_department && (
                    <span className="self-start rounded-full border border-teal/40 bg-teal/10 px-2.5 py-0.5 text-[11px] font-medium text-teal">
                      {person.known_for_department}
                    </span>
                  )}
                  {person.birthday && (
                    <p className="text-xs text-gray-muted">
                      Born: {new Date(person.birthday).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {person.place_of_birth ? ` · ${person.place_of_birth}` : ''}
                    </p>
                  )}

                  {/* Favourite buttons */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {hasActingCredits && (
                      <button
                        onClick={() => isActorFavourited ? removeActorMutation.mutate() : addActorMutation.mutate()}
                        disabled={addActorMutation.isPending || removeActorMutation.isPending}
                        className={[
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',
                          isActorFavourited
                            ? 'border border-magenta/50 bg-magenta/15 text-magenta hover:bg-magenta/25'
                            : 'border border-white/15 bg-navy-card/40 text-gray-lighter hover:border-magenta/40 hover:bg-magenta/10 hover:text-magenta',
                        ].join(' ')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill={isActorFavourited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {isActorFavourited ? 'Saved as Actor' : 'Fav. Actor'}
                      </button>
                    )}
                    {hasDirectingCredits && (
                      <button
                        onClick={() => isDirectorFavourited ? removeDirectorMutation.mutate() : addDirectorMutation.mutate()}
                        disabled={addDirectorMutation.isPending || removeDirectorMutation.isPending}
                        className={[
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',
                          isDirectorFavourited
                            ? 'border border-teal/50 bg-teal/15 text-teal hover:bg-teal/25'
                            : 'border border-white/15 bg-navy-card/40 text-gray-lighter hover:border-teal/40 hover:bg-teal/10 hover:text-teal',
                        ].join(' ')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill={isDirectorFavourited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {isDirectorFavourited ? 'Saved as Director' : 'Fav. Director'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Biography */}
              {person.biography && (
                <BiographySection biography={person.biography} />
              )}

              {/* Acting filmography */}
              {hasActingCredits && (
                <FilmographySection
                  title="Acting"
                  entries={actingCredits}
                  onFilmClick={handleFilmClick}
                />
              )}

              {/* Directing filmography */}
              {hasDirectingCredits && (
                <FilmographySection
                  title="Directing"
                  entries={directingCredits}
                  onFilmClick={handleFilmClick}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Biography with read-more ──────────────────────────────────────────────────
function BiographySection({ biography }: { biography: string }) {
  const [expanded, setExpanded] = useState(false)
  const truncated = biography.length > 320

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wider">Biography</p>
      <p className="text-sm text-gray-light/80 leading-relaxed">
        {expanded || !truncated ? biography : `${biography.slice(0, 320)}…`}
      </p>
      {truncated && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-xs text-magenta/80 hover:text-magenta transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

// ─── Filmography grid ─────────────────────────────────────────────────────────
function FilmographySection({
  title,
  entries,
  onFilmClick,
}: {
  title: string
  entries: FilmographyEntry[]
  onFilmClick: (entry: FilmographyEntry) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? entries : entries.slice(0, 12)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-gray-muted uppercase tracking-wider">{title}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {displayed.map((entry) => (
          <button
            key={`${entry.id}-${entry.character ?? entry.job}`}
            type="button"
            onClick={() => onFilmClick(entry)}
            className="group flex flex-col items-start gap-1 text-left rounded-lg overflow-hidden border border-white/5 bg-navy-card/30 hover:border-magenta/30 hover:bg-navy-card/60 transition-all"
          >
            <div className="w-full aspect-[2/3] overflow-hidden bg-navy-card/60">
              {entry.poster_path ? (
                <img
                  src={`${TMDB_POSTER}${entry.poster_path}`}
                  alt={entry.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-muted text-[10px] px-1 text-center leading-tight">
                  {entry.title}
                </div>
              )}
            </div>
            <div className="p-1.5 pb-2">
              <p className="text-[10px] font-medium text-gray-lighter leading-tight line-clamp-2">{entry.title}</p>
              {entry.release_date && (
                <p className="text-[9px] text-gray-muted mt-0.5">{entry.release_date.slice(0, 4)}</p>
              )}
            </div>
          </button>
        ))}
      </div>
      {entries.length > 12 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="self-start text-xs text-gray-muted hover:text-gray-lighter transition-colors mt-1"
        >
          {showAll ? 'Show less' : `Show all ${entries.length}`}
        </button>
      )}
    </div>
  )
}

// ─── Inner person view (for cast/crew clicked from filmography movie) ─────────
function InnerPersonView({
  personId,
  personName,
  onFilmClick,
  onPersonClick,
}: {
  personId: number
  personName: string
  onFilmClick: (entry: FilmographyEntry) => void
  onPersonClick: (id: number, name: string, type: 'actor' | 'director') => void
}) {
  const qc = useQueryClient()

  const { data: person, isLoading } = useQuery({
    queryKey: ['person-details', personId],
    queryFn: () => getPersonDetails(personId),
    staleTime: 1000 * 60 * 30,
  })

  const { data: favActors = [] } = useQuery({ queryKey: ['favourite-actors'], queryFn: getFavouriteActors })
  const { data: favDirectors = [] } = useQuery({ queryKey: ['favourite-directors'], queryFn: getFavouriteDirectors })

  const isActorFavourited = favActors.some((a) => a.actor_id === personId)
  const isDirectorFavourited = favDirectors.some((d) => d.director_id === personId)

  const addActorMutation = useMutation({
    mutationFn: () => addFavouriteActor({ person_id: personId, name: person!.name, profile_path: person!.profile_path }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-actors'] }),
  })
  const removeActorMutation = useMutation({
    mutationFn: () => removeFavouriteActor(personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-actors'] }),
  })
  const addDirectorMutation = useMutation({
    mutationFn: () => addFavouriteDirector({ person_id: personId, name: person!.name, profile_path: person!.profile_path }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-directors'] }),
  })
  const removeDirectorMutation = useMutation({
    mutationFn: () => removeFavouriteDirector(personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourite-directors'] }),
  })

  if (isLoading) {
    return <p className="text-sm text-gray-muted animate-pulse">Loading {personName}…</p>
  }
  if (!person) return null

  const profileUrl = person.profile_path ? `${TMDB_PROFILE}${person.profile_path}` : null
  const actingCredits = (person.movie_credits?.cast ?? []).filter((c) => c.title).sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))
  const directingCredits = (person.movie_credits?.crew ?? []).filter((c) => c.job === 'Director' && c.title).sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        {profileUrl ? (
          <img src={profileUrl} alt={person.name} className="w-16 h-24 object-cover rounded-lg border border-white/10 shrink-0" />
        ) : (
          <div className="w-16 h-24 rounded-lg bg-navy-card/60 border border-white/10 flex items-center justify-center shrink-0">
            <span className="text-lg text-gray-muted">{person.name.charAt(0)}</span>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h4 className="text-base font-bold text-gray-lighter">{person.name}</h4>
          {person.known_for_department && (
            <span className="self-start rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 text-[10px] font-medium text-teal">
              {person.known_for_department}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {actingCredits.length > 0 && (
              <button
                onClick={() => isActorFavourited ? removeActorMutation.mutate() : addActorMutation.mutate()}
                disabled={addActorMutation.isPending || removeActorMutation.isPending}
                className={['flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50', isActorFavourited ? 'border border-magenta/50 bg-magenta/15 text-magenta' : 'border border-white/15 bg-navy-card/40 text-gray-lighter hover:border-magenta/40 hover:text-magenta'].join(' ')}
              >
                {isActorFavourited ? '♥ Actor saved' : '+ Fav. Actor'}
              </button>
            )}
            {directingCredits.length > 0 && (
              <button
                onClick={() => isDirectorFavourited ? removeDirectorMutation.mutate() : addDirectorMutation.mutate()}
                disabled={addDirectorMutation.isPending || removeDirectorMutation.isPending}
                className={['flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50', isDirectorFavourited ? 'border border-teal/50 bg-teal/15 text-teal' : 'border border-white/15 bg-navy-card/40 text-gray-lighter hover:border-teal/40 hover:text-teal'].join(' ')}
              >
                {isDirectorFavourited ? '♥ Director saved' : '+ Fav. Director'}
              </button>
            )}
          </div>
        </div>
      </div>
      {actingCredits.length > 0 && <FilmographySection title="Acting" entries={actingCredits} onFilmClick={onFilmClick} />}
      {directingCredits.length > 0 && <FilmographySection title="Directing" entries={directingCredits} onFilmClick={onFilmClick} />}
    </div>
  )
}
