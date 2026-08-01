import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './services/supabaseClient'
import { useAuthStore } from './store/authStore'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import SwipeableTabs from './components/SwipeableTabs'
import AuthPage from './pages/AuthPage'
import MyMoviesPage from './pages/MyMoviesPage'
import DiscoverPage from './features/discover/DiscoverPage'
import DiscoverListPage from './features/discover/DiscoverListPage'
import ProfilePage from './features/profile/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import ForgotPasswordPage from './features/auth/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/ResetPasswordPage'

const ROUTE_ORDER = ['/', '/discover/popular', '/discover/for-you', '/my-movies', '/profile', '/settings']
// The 3 top-level tabs — dragged between as a live carousel by SwipeableTabs rather than
// going through <Routes>'s normal mount/unmount per navigation.
const TAB_ROUTES = ['/', '/my-movies', '/profile']
function getRouteIndex(path: string) {
  const idx = ROUTE_ORDER.indexOf(path)
  return idx === -1 ? 0 : idx
}

function AppRoutes() {
  const location = useLocation()
  const prevPath = useRef(location.pathname)
  const [transitionClass, setTransitionClass] = useState('')
  const isTabRoute = TAB_ROUTES.includes(location.pathname)

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
      className={!isTabRoute && transitionClass ? transitionClass : undefined}
      onAnimationEnd={() => setTransitionClass('')}
      style={{ flex: 1, minHeight: 0 }}
    >
      {isTabRoute ? (
        <ProtectedRoute>
          <SwipeableTabs
            paths={TAB_ROUTES}
            panels={[<DiscoverPage />, <MyMoviesPage />, <ProfilePage />]}
          />
        </ProtectedRoute>
      ) : (
        <Routes location={location}>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
          <Route path="/search" element={<Navigate to="/" replace />} />
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
      )}
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

