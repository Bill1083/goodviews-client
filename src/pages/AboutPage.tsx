import tmdbLogo from '../assets/tmdb-logo.svg'
import InfoPage, { ExternalLink, InfoSection } from '../components/public/InfoPage'
import { BRAND } from '../config/brand'
import { PUBLIC_PAGES } from '../config/seo'
import { usePageMeta } from '../hooks/usePageMeta'

export default function AboutPage() {
  usePageMeta(PUBLIC_PAGES['/about'])

  return (
    <InfoPage title={`About ${BRAND.name}`}>
      <InfoSection heading="What this is">
        <p>
          {BRAND.name} is a place to keep track of the movies you've actually watched, rate and review
          them, build a watchlist for what's next, and see what your friends are watching and
          loving — without wading through a social feed to find it. The "For You" page turns your
          own ratings, favourite actors and directors, and your friends' recommendations into a feed
          of movies actually worth your time, instead of just showing everyone the same generic
          top-10 list.
        </p>
      </InfoSection>

      <InfoSection heading="Why it exists">
        <p>
          It started as a simple question: which of these have I actually seen, and what did I
          think of it at the time? Most tracking apps either bury that behind a paywall or bury you
          in noise. {BRAND.name} is built to stay small and personal — a shared watch history between
          friends, and recommendations that are earned from your own taste rather than sold as an
          ad slot.
        </p>
      </InfoSection>

      <InfoSection heading="How it's built">
        <p>
          The app is a React + TypeScript frontend (Vite, TanStack Query, Tailwind CSS) talking to a
          Python/Flask API, with Supabase providing the database, authentication, and optional
          two-factor login. Movie data — titles, posters, cast and crew, ratings — comes from{' '}
          <ExternalLink href="https://www.themoviedb.org/">The Movie Database (TMDB)</ExternalLink>. The
          "For You" recommendation feed is a small scoring system that weighs your own ratings,
          favourite actors/directors, and friends' ratings, rather than a third-party recommendation
          engine.
        </p>
      </InfoSection>

      <InfoSection heading="TMDB attribution">
        <img src={tmdbLogo} alt="The Movie Database (TMDB)" className="h-6 w-auto self-start opacity-90" />
        <p>
          This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise
          approved by TMDB. All movie titles, posters, backdrops, cast and crew photos, and related
          metadata are sourced from <ExternalLink href="https://www.themoviedb.org/">themoviedb.org</ExternalLink>.{' '}
          {BRAND.name} is an independent project and has no affiliation with TMDB beyond use of their
          public API under their{' '}
          <ExternalLink href="https://www.themoviedb.org/documentation/api/terms-of-use">API Terms of Use</ExternalLink>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
