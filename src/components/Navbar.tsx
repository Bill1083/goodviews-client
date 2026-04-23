import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuthStore } from '../store/authStore'

const NAV_TABS = [
  { label: 'My Movies', path: '/' },
  { label: 'Make Review', path: '/search' },
  { label: 'Profile', path: '/profile' },
]

export default function Navbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  if (!user) return null

  return (
    <header className="w-full border-b border-white/10 bg-transparent">
      <div className="mx-auto flex max-w-6xl items-end justify-between px-6 pt-4">
        {/* Logo */}
        <span
          className="pb-3 text-xl font-bold tracking-tight text-teal cursor-pointer"
          onClick={() => navigate('/')}
        >
          GoodViews
        </span>

        {/* Centered Nav Tabs */}
        <nav className="flex items-end gap-10">
          {NAV_TABS.map((tab) => {
            const isActive = location.pathname === tab.path
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`nav-tab${isActive ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="pb-3 text-sm text-gray-muted hover:text-gray-lighter transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
