import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { getWrapped } from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import { daysUntil, formatDate, plural } from '../../utils/formatStats'
import { markWrappedSeen } from '../../utils/wrappedSeen'
import WrappedStory from './WrappedStory'

function Screen({ children }: { children: React.ReactNode }) {
  useBodyScrollLock(true)
  return (
    <div className="wrapped-theme-noir fixed inset-0 z-[70] flex items-center justify-center px-6 text-center text-white" data-no-swipe="true" role="dialog" aria-modal="true">
      <div className="dialog-scale-in flex max-w-md flex-col items-center gap-4">{children}</div>
    </div>
  )
}

function BackButton({ onClick, label = 'Back to profile' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/90 transition-colors hover:border-teal hover:text-teal">
      {label}
    </button>
  )
}

/** /wrapped/:year — a full-screen takeover above the app shell. The backend
 * decides what's viewable: 423 until the unlock date, 404 for unknown years,
 * `not_enough` under the film threshold. */
export default function WrappedPage() {
  const { year: yearParam } = useParams()
  const year = Number(yearParam)
  const navigate = useNavigate()
  const location = useLocation()
  const userId = useAuthStore((s) => s.user?.id) ?? 'anon'
  const valid = Number.isInteger(year) && year >= 2000 && year <= 2100

  const exit = useCallback(() => {
    if (location.key !== 'default') navigate(-1)
    else navigate('/profile', { replace: true })
  }, [location.key, navigate])

  useEffect(() => {
    if (!valid) navigate('/profile', { replace: true })
  }, [valid, navigate])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stats', 'wrapped', year],
    queryFn: () => getWrapped(year),
    enabled: valid,
    staleTime: 5 * 60_000,
    retry: false,
  })

  if (!valid) return null

  if (isLoading) {
    return (
      <Screen>
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-teal border-t-transparent" aria-label="Loading" />
        <p className="text-sm text-white/70">Cueing up your {year}…</p>
      </Screen>
    )
  }

  if (isError || !data) {
    return (
      <Screen>
        <h1 className="text-2xl font-bold">That didn't load</h1>
        <p className="text-sm text-white/70">Your Wrapped couldn't be fetched just now.</p>
        <div className="flex gap-3">
          <BackButton onClick={() => void refetch()} label="Try again" />
          <BackButton onClick={exit} />
        </div>
      </Screen>
    )
  }

  if (data.status === 'locked') {
    const days = data.unlocks_at ? daysUntil(data.unlocks_at) : null
    return (
      <Screen>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal">Sealed</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Your {data.year} Wrapped isn't ready yet</h1>
        {days !== null && (
          <p className="text-6xl font-bold text-gradient-brand" style={{ fontFamily: '"Source Sans 3", sans-serif' }}>
            {days} {plural(days, 'day')}
          </p>
        )}
        <p className="text-sm text-white/70">
          {data.unlocks_at ? `It opens on ${formatDate(data.unlocks_at, { day: 'numeric', month: 'long' })}.` : 'It opens in December.'} Until then, we're keeping score. No peeking.
        </p>
        <BackButton onClick={exit} />
      </Screen>
    )
  }

  if (data.status === 'missing') {
    return (
      <Screen>
        <h1 className="text-2xl font-bold">Nothing to wrap for {data.year}</h1>
        <p className="text-sm text-white/70">No films were logged that year.</p>
        <BackButton onClick={exit} />
      </Screen>
    )
  }

  if (data.status === 'not_enough') {
    const missing = Math.max(0, data.min_films - data.films)
    return (
      <Screen>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal">{data.year} Wrapped</p>
        <h1 className="text-2xl font-bold sm:text-3xl">A few more films and it's yours</h1>
        <p className="text-sm text-white/70">
          {data.films} {plural(data.films, 'film')} logged in {data.year}. Rate {missing} more and your Wrapped will be waiting.
        </p>
        <BackButton onClick={exit} />
      </Screen>
    )
  }

  return <WrappedStory data={data} onExit={exit} onSeen={() => markWrappedSeen(userId, data.year)} />
}
