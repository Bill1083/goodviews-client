import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { BRAND } from '../../config/brand'
import { NavLogo } from '../brand/BrandLogo'

/** Top bar for signed-out visitors on the public pages. Signed-in users get
 *  the app's own Navbar instead, so this renders nothing for them. */
export default function PublicHeader() {
  const user = useAuthStore((s) => s.user)
  if (user) return null

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-navy/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label={`${BRAND.name} home`} className="shrink-0">
          <NavLogo />
        </Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link
            to="/auth"
            className="rounded-pill px-3 py-2 text-sm font-semibold text-gray-lighter transition-colors hover:bg-white/5 sm:px-4"
          >
            Sign in
          </Link>
          <Link
            to="/auth?mode=register"
            className="rounded-pill bg-magenta-dark px-3 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 sm:px-4"
          >
            Create account
          </Link>
        </nav>
      </div>
    </header>
  )
}
