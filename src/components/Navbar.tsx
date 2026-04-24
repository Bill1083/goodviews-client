import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getFriendRequests } from '../services/apiClient'

const NAV_TABS = [
  { label: 'My Movies', path: '/' },
  { label: 'Search', path: '/search' },
  { label: 'Profile', path: '/profile' },
]

function NavLogo() {
  return (
    <div className="flex items-center" style={{ gap: 6 }}>
      <span
        style={{
          fontFamily: '"Source Sans 3", sans-serif',
          fontSize: 42,
          fontWeight: 400,
          color: '#e1e1e1',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >G</span>
      <svg width="51" height="39" viewBox="1049 894 51 39" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ opacity: 0.6 }}>
          <path d="M1055.375,900.5L1093.625,900.5C1094.798583984375,900.5,1095.75,901.2275390625,1095.75,902.125L1095.75,903.75L1053.2501220703125,903.75L1053.2501220703125,902.125C1053.2501220703125,901.2275390625,1054.2015380859375,900.5,1055.375,900.5Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
        </g>
        <g style={{ opacity: 0.3 }}>
          <path d="M1059.625,897.25L1089.375,897.25C1090.548583984375,897.25,1091.5,897.9775390625,1091.5,898.875L1091.5,900.5L1057.5,900.5L1057.5,898.875C1057.5,897.9775390625,1058.451416015625,897.25,1059.625,897.25Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
        </g>
        <path d="M1051.1251220703125,903.75L1097.875,903.75C1099.0484619140625,903.75,1100,904.4775390625,1100,905.375L1100,929.75C1100,930.6474609375,1099.0484619140625,931.375,1097.875,931.375L1051.1251220703125,931.375C1049.9515380859375,931.375,1049,930.6474609375,1049,929.75L1049,905.375C1049,904.4775390625,1049.9515380859375,903.75,1051.1251220703125,903.75ZM1051.1251220703125,907L1051.1251220703125,911.875L1057.5,911.875L1057.5,907L1051.1251220703125,907ZM1051.1251220703125,915.125L1051.1251220703125,920L1057.5,920L1057.5,915.125L1051.1251220703125,915.125ZM1051.1251220703125,923.25L1051.1251220703125,928.125L1057.5,928.125L1057.5,923.25L1051.1251220703125,923.25ZM1091.5,907L1091.5,911.875L1097.875,911.875L1097.875,907L1091.5,907ZM1091.5,915.125L1091.5,920L1097.875,920L1097.875,915.125L1091.5,915.125ZM1091.5,923.25L1091.5,928.125L1097.875,928.125L1097.875,923.25L1091.5,923.25Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </svg>
      <span
        style={{
          fontFamily: '"Source Sans 3", sans-serif',
          fontSize: 42,
          fontWeight: 400,
          color: '#e1e1e1',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >V</span>
    </div>
  )
}

export default function Navbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: getFriendRequests,
    enabled: !!user,
    refetchInterval: 30_000,
  })
  const hasPendingRequests = friendRequests.length > 0

  if (!user) return null

  return (
    <header className="w-full border-b border-white/10 bg-transparent">
      <div className="mx-auto flex max-w-6xl items-end justify-between px-6 pt-4">
        {/* Logo */}
        <div className="pb-2 cursor-pointer" onClick={() => navigate('/')}>
          <NavLogo />
        </div>

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
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.path === '/profile' && hasPendingRequests && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Pending friend requests"
                    >
                      <path
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        stroke="#dd3ee3"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="18" cy="6" r="3.5" fill="#dd3ee3" />
                    </svg>
                  )}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Spacer to balance layout */}
        <div className="w-20" />
      </div>
    </header>
  )
}
