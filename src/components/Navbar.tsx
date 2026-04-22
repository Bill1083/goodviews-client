import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuthStore } from '../store/authStore'
import PrimaryButton from './PrimaryButton'

export default function Navbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple/20 bg-navy/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-teal hover:text-teal-light transition-colors"
        >
          GoodViews
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/search"
                className="text-sm text-gray-muted hover:text-gray-light transition-colors"
              >
                Search
              </Link>
              <Link
                to="/profile"
                className="text-sm text-gray-muted hover:text-gray-light transition-colors"
              >
                Profile
              </Link>
              <PrimaryButton variant="secondary" onClick={handleSignOut}>
                Sign Out
              </PrimaryButton>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-muted hover:text-gray-light transition-colors"
              >
                Sign In
              </Link>
              <PrimaryButton onClick={() => navigate('/register')}>
                Get Started
              </PrimaryButton>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
