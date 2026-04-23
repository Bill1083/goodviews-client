import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './services/supabaseClient'
import { useAuthStore } from './store/authStore'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import MyMoviesPage from './pages/MyMoviesPage'
import SearchPage from './features/movies/SearchPage'
import ProfilePage from './features/profile/ProfilePage'
import SettingsPage from './pages/SettingsPage'

const ROUTE_ORDER = ['/', '/search', '/profile', '/settings']
function getRouteIndex(path: string) {
  const idx = ROUTE_ORDER.indexOf(path)
  return idx === -1 ? 0 : idx
}

function AppRoutes() {
  const location = useLocation()
  const prevPath = useRef(location.pathname)
  const [transitionClass, setTransitionClass] = useState('')

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
      style={{ flex: 1 }}
    >
      <Routes location={location}>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MyMoviesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
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

