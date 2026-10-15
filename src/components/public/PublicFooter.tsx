import { Link } from 'react-router-dom'
import tmdbLogo from '../../assets/tmdb-logo.svg'
import { BRAND, BRAND_CONTACT_HREF } from '../../config/brand'

const linkClass = 'text-gray-light transition-colors hover:text-teal'

/** Footer for the public pages: the legal and about links, contact, and the
 *  attribution TMDB's API terms require. */
export default function PublicFooter() {
  const contactIsEmail = BRAND_CONTACT_HREF.startsWith('mailto:')

  return (
    <footer className="mt-auto border-t border-white/5 bg-navy/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <p className="text-base font-semibold text-gray-lighter">{BRAND.name}</p>
          <p className="mt-1 text-sm text-gray-medium">{BRAND.tagline}</p>
        </div>

        <nav aria-label="Site" className="flex flex-col gap-2 text-sm">
          <Link to="/about" className={linkClass}>About</Link>
          <Link to="/privacy" className={linkClass}>Privacy Policy</Link>
          <Link to="/terms" className={linkClass}>Terms of Use</Link>
          {contactIsEmail ? (
            <a href={BRAND_CONTACT_HREF} className={linkClass}>Contact</a>
          ) : (
            <Link to={BRAND_CONTACT_HREF} className={linkClass}>Contact</Link>
          )}
        </nav>

        <div className="flex max-w-xs flex-col gap-3">
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="self-start">
            <img src={tmdbLogo} alt="The Movie Database (TMDB)" className="h-4 w-auto opacity-80" />
          </a>
          <p className="text-xs leading-relaxed text-gray-medium">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
      <p className="border-t border-white/5 px-4 py-4 text-center text-xs text-gray-muted">
        © {new Date().getFullYear()} {BRAND.name}
      </p>
    </footer>
  )
}
