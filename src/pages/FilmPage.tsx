import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PublicHeader from '../components/public/PublicHeader'
import PublicFooter from '../components/public/PublicFooter'
import RetryImage from '../components/RetryImage'
import ShareFilmButton from '../components/ShareFilmButton'
import { getCommunityStats, getMovieDetails } from '../services/apiClient'
import { useAuthStore } from '../store/authStore'
import { useWatchlistMutations } from '../hooks/useWatchlistMutations'
import { usePageMeta, type PageMetaOptions } from '../hooks/usePageMeta'
import { BRAND } from '../config/brand'
import { filmPath, filmUrl, parseFilmId } from '../utils/filmUrl'
import { tmdbImage } from '../utils/tmdbImage'
import type { CommunityStats, MovieDetails } from '../types'

// Only signed-in members open these, so visitors don't download them.
const MovieActionsModal = lazy(() => import('../components/MovieActionsModal'))
const PersonModal = lazy(() => import('../components/PersonModal'))

/** Same threshold the API uses before it shows an average (app/services/community.py). */
const COMMUNITY_MIN_RATINGS = 3

function summarise(text: string | undefined, max = 155): string | undefined {
  if (!text) return undefined
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '')}…`
}

function formatRuntime(minutes: number | undefined): string | null {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

function hasCommunityAverage(stats: CommunityStats | undefined): stats is CommunityStats & { average_rating: number } {
  return Boolean(stats && stats.rating_count >= COMMUNITY_MIN_RATINGS && stats.average_rating !== null)
}

function movieJsonLd(film: MovieDetails, stats: CommunityStats | undefined): Record<string, unknown> {
  const directors = (film.credits?.crew ?? []).filter((c) => c.job === 'Director')
  const cast = (film.credits?.cast ?? []).slice(0, 6)
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: film.title,
    url: filmUrl(film),
    image: tmdbImage(film.poster_path, 'w780') ?? undefined,
    description: film.overview || undefined,
    datePublished: film.release_date || undefined,
    duration: film.runtime ? `PT${Math.floor(film.runtime / 60)}H${film.runtime % 60}M` : undefined,
    genre: film.genres?.map((g) => g.name).filter(Boolean),
    director: directors.map((d) => ({ '@type': 'Person', name: d.name })),
    actor: cast.map((c) => ({ '@type': 'Person', name: c.name })),
    aggregateRating: hasCommunityAverage(stats)
      ? {
          '@type': 'AggregateRating',
          ratingValue: stats.average_rating,
          ratingCount: stats.rating_count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  }
}

function CommunityBlock({ stats, loading }: { stats: CommunityStats | undefined; loading: boolean }) {
  if (loading) return <div className="h-24 animate-pulse rounded-card bg-navy-card/60" />
  const count = stats?.rating_count ?? 0

  if (!hasCommunityAverage(stats)) {
    return (
      <div className="panel-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">{BRAND.name} members</p>
        <p className="mt-1 text-sm text-gray-light">
          {count === 0
            ? 'Nobody has rated this yet. Be the first.'
            : `Rated by ${count} member${count === 1 ? '' : 's'} so far.`}
        </p>
      </div>
    )
  }

  const max = Math.max(1, ...Object.values(stats.distribution ?? {}))
  return (
    <div className="panel-card flex items-center gap-5 p-4">
      <div className="shrink-0 text-center">
        <p className="text-4xl font-bold text-gray-lighter">{stats.average_rating.toFixed(1)}</p>
        <p className="text-sm" aria-hidden>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={i <= Math.round(stats.average_rating) ? 'text-avatar' : 'text-white/15'}>★</span>
          ))}
        </p>
        <p className="mt-0.5 text-xs text-gray-medium">{stats.rating_count} ratings</p>
      </div>
      <div className="flex-1">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal">{BRAND.name} members</p>
        <div className="flex flex-col gap-1" role="img" aria-label={`Average ${stats.average_rating} out of 5 from ${stats.rating_count} ratings`}>
          {(['5', '4', '3', '2', '1'] as const).map((star) => {
            const n = stats.distribution?.[star] ?? 0
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-gray-medium">
                <span className="w-3 text-right">{star}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-teal/70" style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FilmSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6">
      <div className="h-56 animate-pulse rounded-2xl bg-navy-card/60 sm:h-72" />
      <div className="mt-6 flex gap-5">
        <div className="hidden aspect-[2/3] w-40 shrink-0 animate-pulse rounded-card bg-navy-card/60 sm:block" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-9 w-2/3 animate-pulse rounded bg-navy-card/60" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-navy-card/60" />
          <div className="h-20 animate-pulse rounded bg-navy-card/60" />
        </div>
      </div>
    </div>
  )
}

export default function FilmPage() {
  const { filmSlug } = useParams()
  const navigate = useNavigate()
  const filmId = parseFilmId(filmSlug)
  const user = useAuthStore((s) => s.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [personId, setPersonId] = useState<number | null>(null)

  // Same cache entry MovieDetailModal reads, so opening the modal is instant.
  const { data: film, isLoading, isError } = useQuery({
    queryKey: ['movie-details', filmId],
    queryFn: () => getMovieDetails(filmId!),
    enabled: filmId !== null,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  })
  const { data: community, isLoading: communityLoading } = useQuery({
    queryKey: ['movie-community', filmId],
    queryFn: ({ signal }) => getCommunityStats(filmId!, signal),
    enabled: filmId !== null,
    staleTime: 1000 * 60 * 15,
  })
  const { watchlistIds, addMutation, removeMutation } = useWatchlistMutations({ enabled: Boolean(user) })

  // One canonical address per film: /film/603 or /film/603-matrix → /film/603-the-matrix.
  useEffect(() => {
    if (film && `/film/${filmSlug}` !== filmPath(film)) navigate(filmPath(film), { replace: true })
  }, [film, filmSlug, navigate])

  const notFound = filmId === null || isError
  const year = film?.release_date?.slice(0, 4) || null

  const meta = useMemo<PageMetaOptions>(() => {
    if (!film) return { title: notFound ? 'Film not found' : 'Film', noindex: true }
    return {
      title: year ? `${film.title} (${year})` : film.title,
      description: summarise(film.overview) ?? `${film.title} — details and member ratings on ${BRAND.name}.`,
      path: filmPath(film),
      image: tmdbImage(film.backdrop_path, 'w1280') ?? tmdbImage(film.poster_path, 'w780'),
      ogType: 'video.movie',
      // A page with no member ratings is just a copy of TMDB's: keep it out
      // of search results until it has something of its own to show.
      noindex: !hasCommunityAverage(community),
      jsonLd: movieJsonLd(film, community),
    }
  }, [film, community, notFound, year])
  usePageMeta(meta)

  const directors = (film?.credits?.crew ?? []).filter((c) => c.job === 'Director')
  const cast = (film?.credits?.cast ?? []).slice(0, 12)
  const auProviders = film?.['watch/providers']?.results?.AU
  const streaming = auProviders?.flatrate ?? []
  const backdrop = tmdbImage(film?.backdrop_path, 'w1280')
  const poster = tmdbImage(film?.poster_path, 'w500')
  const meta_line = [year, formatRuntime(film?.runtime), film?.genres?.map((g) => g.name).filter(Boolean).slice(0, 3).join(', ')]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="flex flex-1 flex-col pb-12">
        {notFound ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-4 py-16 sm:px-6">
            <h1 className="text-3xl font-bold text-gray-lighter">Film not found</h1>
            <p className="text-sm text-gray-light">We couldn't find that film. The link may be wrong, or the film may have been removed.</p>
            <Link to="/" className="rounded-pill bg-blue-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110">
              Go to the home page
            </Link>
          </div>
        ) : isLoading || !film ? (
          <FilmSkeleton />
        ) : (
          <>
            {/* ── Backdrop ── */}
            <div className="relative h-56 w-full overflow-hidden sm:h-80 lg:h-[26rem]">
              {backdrop && (
                <RetryImage src={backdrop} alt="" loading="eager" className="absolute inset-0 h-full w-full object-cover" fallback={<></>} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#040c24] via-[#040c24]/60 to-transparent" />
            </div>

            <div className="relative mx-auto -mt-28 flex w-full max-w-5xl flex-col gap-8 px-4 sm:-mt-36 sm:px-6">
              {/* ── Title block ── */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                {poster && (
                  <div className="w-32 shrink-0 overflow-hidden rounded-card border border-white/10 bg-navy-card shadow-2xl sm:w-48">
                    <RetryImage src={poster} alt={`${film.title} poster`} loading="eager" className="aspect-[2/3] w-full object-cover" fallback={<div className="aspect-[2/3] w-full bg-navy-card" />} />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <h1 style={{ fontFamily: '"Source Sans 3", sans-serif' }} className="text-3xl font-bold leading-tight text-white sm:text-5xl">
                    {film.title}
                  </h1>
                  {meta_line && <p className="text-sm text-gray-light">{meta_line}</p>}
                  {directors.length > 0 && (
                    <p className="text-sm text-gray-light">
                      Directed by <span className="text-gray-lighter">{directors.map((d) => d.name).join(', ')}</span>
                    </p>
                  )}
                  {film.tagline && <p className="text-sm italic text-gray-medium">{film.tagline}</p>}
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="flex flex-wrap items-center gap-3">
                {user ? (
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="rounded-pill bg-blue-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
                  >
                    Rate, review or save
                  </button>
                ) : (
                  <Link
                    to="/auth?mode=register"
                    className="rounded-pill bg-magenta-dark px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
                  >
                    Rate it on {BRAND.name}
                  </Link>
                )}
                <ShareFilmButton movie={film} />
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
                <div className="flex min-w-0 flex-col gap-8">
                  {film.overview && (
                    <section aria-labelledby="overview-heading">
                      <h2 id="overview-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal">Overview</h2>
                      <p className="text-base leading-relaxed text-gray-light">{film.overview}</p>
                    </section>
                  )}

                  {cast.length > 0 && (
                    <section aria-labelledby="cast-heading">
                      <h2 id="cast-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-teal">Cast</h2>
                      <ul data-no-swipe className="flex gap-3 overflow-x-auto pb-2">
                        {cast.map((c) => {
                          const photo = tmdbImage(c.profile_path, 'w185')
                          const content = (
                            <>
                              <div className="aspect-[2/3] overflow-hidden rounded-card bg-navy-card">
                                {photo ? (
                                  <RetryImage src={photo} alt={c.name} className="h-full w-full object-cover" fallback={<div className="h-full w-full bg-navy-card" />} />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-2xl text-gray-muted">{c.name.charAt(0)}</div>
                                )}
                              </div>
                              <p className="mt-1.5 truncate text-xs font-semibold text-gray-lighter">{c.name}</p>
                              {c.character && <p className="truncate text-xs text-gray-medium">{c.character}</p>}
                            </>
                          )
                          return (
                            <li key={`${c.id}-${c.character}`} className="w-24 shrink-0 sm:w-28">
                              {user ? (
                                <button type="button" onClick={() => setPersonId(c.id)} className="w-full text-left">
                                  {content}
                                </button>
                              ) : (
                                content
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )}
                </div>

                <aside className="flex flex-col gap-4">
                  <CommunityBlock stats={community} loading={communityLoading} />

                  {typeof film.vote_average === 'number' && film.vote_average > 0 && (
                    <div className="panel-card flex items-center justify-between p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal">TMDB score</p>
                      <p className="text-lg font-bold text-gray-lighter">{film.vote_average.toFixed(1)}<span className="text-sm text-gray-medium">/10</span></p>
                    </div>
                  )}

                  {streaming.length > 0 && auProviders && (
                    <div className="panel-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal">Streaming in Australia</p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {streaming.map((p) => (
                          <li key={p.provider_id} title={p.provider_name}>
                            <img src={tmdbImage(p.logo_path, 'w92') ?? ''} alt={p.provider_name} className="h-10 w-10 rounded-lg" />
                          </li>
                        ))}
                      </ul>
                      <a href={auProviders.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-gray-medium hover:text-teal">
                        Availability data powered by JustWatch
                      </a>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </>
        )}
      </main>

      <PublicFooter />

      <Suspense fallback={null}>
      {modalOpen && film && (
        <MovieActionsModal
          movie={film}
          onClose={() => setModalOpen(false)}
          inWatchlist={watchlistIds.has(film.id)}
          onAddWatchlist={() => addMutation.mutate(film)}
          onRemoveWatchlist={() => removeMutation.mutate(film)}
          onPersonClick={(pid) => {
            setModalOpen(false)
            setPersonId(pid)
          }}
        />
      )}
      {personId !== null && <PersonModal personId={personId} onClose={() => setPersonId(null)} />}
      </Suspense>
    </div>
  )
}
