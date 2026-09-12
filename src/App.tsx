import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from './services/supabaseClient'
import { verifyTrustedDevice, getProfile } from './services/apiClient'
import { getStoredTrustedDeviceToken, clearTrustedDeviceToken } from './utils/mfa'
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
import MfaChallengePage from './pages/MfaChallengePage'
import OnboardingPage from './pages/OnboardingPage'

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
        <Route path="/mfa-challenge" element={<MfaChallengePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
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
  const { setSession, setLoading, setAal, setTrustedDevice, setHasOnboarded } = useAuthStore()
  const queryClient = useQueryClient()
  // undefined = not yet initialized (skip the very first callback so we don't
  // wipe a freshly-created, already-empty cache on initial page load)
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const refreshOnboarding = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!session) {
        setHasOnboarded(null, true)
        return
      }
      setHasOnboarded(null, false)
      try {
        const profile = await getProfile()
        setHasOnboarded(profile.has_onboarded)
      } catch {
        // Fail open on a transient error — don't trap someone in a redirect
        // loop just because the profile fetch hiccuped.
        setHasOnboarded(true)
      }
    }

    const refreshAal = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!session) {
        setAal({ current: null, next: null })
        setTrustedDevice(false)
        return
      }
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      const currentLevel = data?.currentLevel ?? null
      const nextLevel = data?.nextLevel ?? null
      setAal({ current: currentLevel, next: nextLevel })

      if (!currentLevel || !nextLevel || currentLevel === nextLevel) {
        setTrustedDevice(false)
        return
      }

      // An MFA challenge is outstanding — mark the check as pending (rather
      // than leaving stale trust from a previous user/session) before
      // awaiting the backend, so ProtectedRoute holds on a spinner instead
      // of bouncing to /mfa-challenge and back.
      setTrustedDevice(false, false)
      const token = getStoredTrustedDeviceToken(session.user.id)
      if (!token) {
        setTrustedDevice(false)
        return
      }
      try {
        const trusted = await verifyTrustedDevice(token)
        if (!trusted) clearTrustedDeviceToken(session.user.id)
        setTrustedDevice(trusted)
      } catch {
        setTrustedDevice(false)
      }
    }

    // Supabase always fires onAuthStateChange once immediately on subscribe
    // (an INITIAL_SESSION event with the current session) — a separate
    // explicit getSession() call here as well made refreshAal's
    // trusted-device verification run twice, concurrently, on every page
    // load. Since any single "not trusted" result wipes the stored token
    // (see refreshAal below), that race could and did spuriously clear a
    // perfectly valid token if either racing call had so much as a transient
    // hiccup — relying solely on onAuthStateChange's guaranteed initial
    // firing avoids the duplicate call entirely.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id ?? null
        // Wipe all cached queries (watchlist, reviews, recommendations, etc.)
        // whenever the signed-in user changes — otherwise the next account to
        // log in briefly sees the previous account's cached data.
        if (prevUserIdRef.current !== undefined && newUserId !== prevUserIdRef.current) {
          queryClient.clear()
        }
        prevUserIdRef.current = newUserId
        setSession(session)
        // A routine background token refresh doesn't change aal or
        // onboarding status — skip re-running (and re-verifying the
        // trusted-device token) for it. This isn't just an optimization:
        // every re-verification is another chance for a single transient
        // failure to wipe an otherwise-valid stored token.
        if (event === 'TOKEN_REFRESHED') return
        refreshAal(session)
        refreshOnboarding(session)
      },
    )

    return () => listener.subscription.unsubscribe()
  }, [setSession, setLoading, setAal, setTrustedDevice, setHasOnboarded, queryClient])

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
