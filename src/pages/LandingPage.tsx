import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PublicHeader from '../components/public/PublicHeader'
import PublicFooter from '../components/public/PublicFooter'
import RetryImage from '../components/RetryImage'
import { getTrendingMovies } from '../services/apiClient'
import { BRAND } from '../config/brand'
import { PUBLIC_PAGES } from '../config/seo'
import { usePageMeta } from '../hooks/usePageMeta'
import { filmPath } from '../utils/filmUrl'
import { tmdbImage } from '../utils/tmdbImage'

const ENTRANCE = 'animate-[fadeInUp_0.6s_ease-out_both] motion-reduce:animate-none'

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </span>
  )
}

const FEATURES: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: 'Rate and review',
    body: 'Log every film you watch with a rating, and a review when you have something to say. Keep a watchlist for what\'s next.',
    icon: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />,
  },
  {
    title: 'A For You page that knows you',
    body: 'Recommendations built from your own ratings and your favourite actors and directors, not from whatever everyone else is watching.',
    icon: (
      <>
        <path d="M12 3l1.8 4.6L18.5 9.4l-4.7 1.8L12 16l-1.8-4.8L5.5 9.4l4.7-1.8z" />
        <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
      </>
    ),
  },
  {
    title: 'Movies of the Day',
    body: 'Three new picks waiting for you every day.',
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    title: 'Films with friends',
    body: 'See what your friends loved, compare tastes, and send them a film straight from the app.',
    icon: (
      <>
        <circle cx="9" cy="8.5" r="3.5" />
        <path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
        <path d="M16 5.2a3.5 3.5 0 010 6.6M18 14.8c1.9.7 3.1 2.4 3.5 5.2" />
      </>
    ),
  },
  {
    title: 'Your year in film',
    body: 'Every December, a Wrapped of your year: the films, genres and people that defined it.',
    icon: (
      <>
        <rect x="3.5" y="9" width="17" height="11.5" rx="1.5" />
        <path d="M2.5 9h19M12 9v11.5M12 9c-1.5-3.5-5.5-4.2-5.5-1.7S12 9 12 9zm0 0c1.5-3.5 5.5-4.2 5.5-1.7S12 9 12 9z" />
      </>
    ),
  },
  {
    title: 'Streaming Worlds',
    body: 'Choose the services you pay for and browse what\'s worth watching on each of them.',
    icon: (
      <>
        <rect x="3" y="4.5" width="18" height="12.5" rx="2" />
        <path d="M8.5 20.5h7M12 17v3.5M10.5 8.5l4 2.3-4 2.3z" />
      </>
    ),
  },
]

function PosterCard({ id, title, posterPath }: { id: number; title: string; posterPath: string }) {
  const src = tmdbImage(posterPath, 'w342') ?? ''
  return (
    <Link to={filmPath({ id, title })} className="group w-28 shrink-0 sm:w-36" title={title}>
      <div className="aspect-[2/3] overflow-hidden rounded-card border border-white/10 bg-navy-card transition-transform duration-200 group-hover:-translate-y-1 group-hover:border-teal/40">
        <RetryImage src={src} alt={`${title} poster`} className="h-full w-full object-cover" fallback={<div className="h-full w-full bg-navy-card" />} />
      </div>
      <p className="mt-2 truncate text-xs text-gray-light group-hover:text-teal sm:text-sm">{title}</p>
    </Link>
  )
}

export default function LandingPage() {
  usePageMeta(PUBLIC_PAGES['/'])

  // Same query (and cache entry) as Discover's trending carousel.
  const { data: trending, isLoading } = useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => getTrendingMovies(1),
    staleTime: 1000 * 60 * 30,
  })
  const films = (trending?.results ?? []).filter((m) => m.poster_path)

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="flex flex-col">
        {/* ── Hero ── */}
        <section className="relative isolate overflow-hidden">
          {/* Faded out at the bottom so the hero melts into the page background. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
            <div className="absolute left-1/2 top-1/2 grid w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-6 grid-cols-6 gap-3 opacity-25 sm:grid-cols-8">
              {films.slice(0, 24).map((m) => (
                <img key={m.id} src={tmdbImage(m.poster_path, 'w185') ?? ''} alt="" className="aspect-[2/3] w-full rounded-md object-cover" />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-navy/70 to-navy/85" />
          </div>

          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24">
            <p className={`text-sm font-semibold uppercase tracking-[0.25em] text-teal ${ENTRANCE}`}>{BRAND.name}</p>
            <h1
              style={{ fontFamily: '"Source Sans 3", sans-serif', animationDelay: '80ms' }}
              className={`text-4xl font-bold leading-tight text-white sm:text-6xl ${ENTRANCE}`}
            >
              {BRAND.tagline}
            </h1>
            <p style={{ animationDelay: '160ms' }} className={`max-w-2xl text-base text-gray-light sm:text-lg ${ENTRANCE}`}>
              {BRAND.description}
            </p>
            <div style={{ animationDelay: '240ms' }} className={`flex flex-col items-center gap-3 sm:flex-row ${ENTRANCE}`}>
              <Link
                to="/auth?mode=register"
                className="rounded-pill bg-magenta-dark px-7 py-3 text-base font-semibold text-white shadow-lg shadow-magenta/20 transition-all hover:brightness-110"
              >
                Create a free account
              </Link>
              <Link
                to="/auth"
                className="rounded-pill border border-white/20 px-7 py-3 text-base font-semibold text-gray-lighter transition-colors hover:bg-white/5"
              >
                Sign in
              </Link>
            </div>
            <p style={{ animationDelay: '320ms' }} className={`text-sm text-gray-medium ${ENTRANCE}`}>Free to use. No ads.</p>
          </div>
        </section>

        {/* ── Features ── */}
        <section aria-labelledby="features-heading" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <h2 id="features-heading" className="mb-6 text-center text-2xl font-bold text-gray-lighter sm:text-3xl">
            Everything you watch, in one place
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={f.title} style={{ animationDelay: `${i * 60}ms` }} className={`panel-card flex flex-col gap-3 p-5 ${ENTRANCE}`}>
                <Icon>{f.icon}</Icon>
                <h3 className="text-lg font-semibold text-gray-lighter">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-light/90">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trending ── */}
        <section aria-labelledby="trending-heading" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <h2 id="trending-heading" className="text-2xl font-bold text-gray-lighter">Trending this week</h2>
          <p className="mt-1 text-sm text-gray-medium">What people are watching right now.</p>
          <div data-no-swipe className="mt-5 flex gap-3 overflow-x-auto pb-3 sm:gap-4">
            {isLoading
              ? Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="w-28 shrink-0 sm:w-36">
                    <div className="aspect-[2/3] animate-pulse rounded-card bg-navy-card" />
                    <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-navy-card" />
                  </div>
                ))
              : films.slice(0, 20).map((m) => <PosterCard key={m.id} id={m.id} title={m.title} posterPath={m.poster_path!} />)}
          </div>
        </section>

        {/* ── Closing call to action ── */}
        <section className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:px-6">
          <div className="panel-card flex flex-col items-center gap-4 px-6 py-10 text-center">
            <h2 className="text-2xl font-bold text-gray-lighter sm:text-3xl">Start your film diary</h2>
            <p className="max-w-lg text-sm text-gray-light/90 sm:text-base">
              Rate a few films you love and {BRAND.name} starts finding the next ones for you.
            </p>
            <Link
              to="/auth?mode=register"
              className="rounded-pill bg-magenta-dark px-7 py-3 text-base font-semibold text-white transition-all hover:brightness-110"
            >
              Create a free account
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
