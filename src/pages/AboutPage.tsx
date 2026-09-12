import { Link } from 'react-router-dom'
import tmdbLogo from '../assets/tmdb-logo.svg'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-teal">{children}</h2>
  )
}

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <div>
        <Link to="/" className="text-sm text-gray-muted hover:text-gray-lighter transition-colors">
          ← Back to GoodViews
        </Link>
        <h1
          style={{ fontFamily: '"Source Sans 3", sans-serif' }}
          className="mt-3 text-3xl font-bold text-gray-lighter sm:text-4xl"
        >
          About GoodViews
        </h1>
      </div>

      <section className="panel-card p-5 sm:p-6">
        <SectionHeading>What this is</SectionHeading>
        <p className="text-sm leading-relaxed text-gray-light/90">
          GoodViews is a place to keep track of the movies you've actually watched, rate and review
          them, build a watchlist for what's next, and see what your friends are watching and
          loving — without wading through a social feed to find it. The "For You" page turns your
          own ratings, favourite actors and directors, and your friends' recommendations into a feed
          of movies actually worth your time, instead of just showing everyone the same generic
          top-10 list.
        </p>
      </section>

      <section className="panel-card p-5 sm:p-6">
        <SectionHeading>Why it exists</SectionHeading>
        <p className="text-sm leading-relaxed text-gray-light/90">
          It started as a simple question: which of these have I actually seen, and what did I
          think of it at the time? Most tracking apps either bury that behind a paywall or bury you
          in noise. GoodViews is built to stay small and personal — a shared watch history between
          friends, and recommendations that are earned from your own taste rather than sold as an
          ad slot.
        </p>
      </section>

      <section className="panel-card p-5 sm:p-6">
        <SectionHeading>How it's built</SectionHeading>
        <p className="text-sm leading-relaxed text-gray-light/90">
          The app is a React + TypeScript frontend (Vite, TanStack Query, Tailwind CSS) talking to a
          Python/Flask API, with Supabase providing the database, authentication, and optional
          two-factor login. Movie data — titles, posters, cast and crew, ratings — comes from{' '}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal hover:text-teal/80 underline decoration-teal/40 underline-offset-2"
          >
            The Movie Database (TMDB)
          </a>
          . The "For You" recommendation feed is a small scoring system that weighs your own
          ratings, favourite actors/directors, and friends' ratings, rather than a third-party
          recommendation engine.
        </p>
      </section>

      <section className="panel-card p-5 sm:p-6">
        <SectionHeading>TMDB attribution</SectionHeading>
        <div className="flex flex-col gap-4">
          <img src={tmdbLogo} alt="The Movie Database (TMDB)" className="h-6 w-auto self-start opacity-90" />
          <p className="text-sm leading-relaxed text-gray-light/90">
            This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise
            approved by TMDB. All movie titles, posters, backdrops, cast and crew photos, and
            related metadata are sourced from{' '}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:text-teal/80 underline decoration-teal/40 underline-offset-2"
            >
              themoviedb.org
            </a>
            . GoodViews is an independent project and has no affiliation with TMDB beyond use of
            their public API under their{' '}
            <a
              href="https://www.themoviedb.org/documentation/api/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:text-teal/80 underline decoration-teal/40 underline-offset-2"
            >
              API Terms of Use
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
