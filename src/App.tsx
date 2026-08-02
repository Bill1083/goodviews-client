import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './services/supabaseClient'
import { useAuthStore } from './store/authStore'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import MyMoviesPage from './pages/MyMoviesPage'
import DiscoverPage from './features/discover/DiscoverPage'
import DiscoverListPage from './features/discover/DiscoverListPage'
import ProfilePage from './features/profile/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import ForgotPasswordPage from './features/auth/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/ResetPasswordPage'

const ROUTE_ORDER = ['/', '/discover/popular', '/discover/for-you', '/my-movies', '/profile', '/settings']
const SWIPE_ROUTES = ['/', '/my-movies', '/profile']
function getRouteIndex(path: string) {
  const idx = ROUTE_ORDER.indexOf(path)
  return idx === -1 ? 0 : idx
}

function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const prevPath = useRef(location.pathname)
  const [transitionClass, setTransitionClass] = useState('')
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // Don't intercept swipes on elements that opt out (e.g. horizontal scroll containers)
    let target = e.target as Element | null
    while (target) {
      if (target instanceof Element && target.hasAttribute('data-no-swipe')) return
      target = target.parentElement
    }
    // Only fire for clearly horizontal swipes (≥80px horizontal, 1.5× more horizontal than vertical)
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const idx = SWIPE_ROUTES.indexOf(location.pathname)
      if (idx === -1) return
      if (dx < 0 && idx < SWIPE_ROUTES.length - 1) navigate(SWIPE_ROUTES[idx + 1])
      else if (dx > 0 && idx > 0) navigate(SWIPE_ROUTES[idx - 1])
    }
  }

  useLayoutEffect(() => {
    const prevIdx = getRouteIndex(prevPath.current)
    const currIdx = getRouteIndex(location.pathname)
    if (prevIdx !== currIdx) {
      const cls = currIdx >= prevIdx ? 'page-slide-right' : 'page-slide-left'
      setTransitionClass(cls)
    }
    prevPath.current = location.pathname
  }, [location.pathname])

  return (
    <div
      className={transitionClass || undefined}
      onAnimationEnd={() => setTransitionClass('')}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ flex: 1, minHeight: 0 }}
    >
      <Routes location={location}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DiscoverPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discover/popular"
          element={
            <ProtectedRoute>
              <DiscoverListPage kind="popular" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discover/for-you"
          element={
            <ProtectedRoute>
              <DiscoverListPage kind="for-you" />
            </ProtectedRoute>
          }
        />
        <Route path="/discover" element={<Navigate to="/" replace />} />
        <Route
          path="/my-movies"
          element={
            <ProtectedRoute>
              <MyMoviesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/search" element={<Navigate to="/" replace />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/register" element={<Navigate to="/auth" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  const { setSession, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      },
    )

    return () => listener.subscription.unsubscribe()
  }, [setSession, setLoading])

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
