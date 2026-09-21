import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getWrappedAvailability } from '../../../services/apiClient'
import { useAuthStore } from '../../../store/authStore'
import type { WrappedYear } from '../../../types/stats'
import { daysUntil, formatDate, plural } from '../../../utils/formatStats'
import { isWrappedSeen } from '../../../utils/wrappedSeen'

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function ReelIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="6.5" r="1.4" />
      <circle cx="12" cy="17.5" r="1.4" />
      <circle cx="6.5" cy="12" r="1.4" />
      <circle cx="17.5" cy="12" r="1.4" />
    </svg>
  )
}

/** Uses the same local "seen" flags the Wrapped page writes, and re-reads
 * them when the tab regains focus or a Wrapped is marked seen. */
function useSeenTick(): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    window.addEventListener('wrapped-seen', bump)
    window.addEventListener('focus', bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener('wrapped-seen', bump)
      window.removeEventListener('focus', bump)
      window.removeEventListener('storage', bump)
    }
  }, [])
  return tick
}

/** The Wrapped's home on the profile: a countdown while the current year is
 * sealed, a glowing "play" card once a year is ready, and chips for replays. */
export default function WrappedHubCard() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id) ?? 'anon'
  useSeenTick()
  const { data } = useQuery({
    queryKey: ['stats', 'wrapped', 'availability'],
    queryFn: getWrappedAvailability,
    staleTime: 10 * 60_000,
  })
  if (!data) return null

  const current = data.years.find((y) => y.year === data.current_year) ?? null
  const ready = data.years.filter((y): y is Extract<WrappedYear, { status: 'ready' }> => y.status === 'ready')
  const unseen = ready.find((y) => !isWrappedSeen(userId, y.year)) ?? null
  const replays = ready.filter((y) => y !== unseen)

  const play = (year: number) => navigate(`/wrapped/${year}`)

  if (unseen) {
    return (
      <section className="glow-pulse relative overflow-hidden rounded-2xl border border-white/10 bg-navy-card/70 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-magenta/25 blur-[70px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-teal/25 blur-[70px]" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">It's here</p>
            <h2 className="text-gradient-brand mt-1 text-2xl font-bold sm:text-3xl">Your {unseen.year} Wrapped is ready</h2>
            <p className="mt-1 text-sm text-gray-light">
              {unseen.films} {plural(unseen.films, 'film')}, one story. Best with the sound of your own gasps.
            </p>
          </div>
          <button
            type="button"
            onClick={() => play(unseen.year)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
          >
            <ReelIcon />
            Play it
          </button>
        </div>
        {replays.length > 0 && <Replays years={replays} onPlay={play} />}
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-card/60 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white/10 bg-navy text-gray-light shadow-inner">
            <div className="absolute inset-2.5 rounded-full border border-dashed border-white/15" aria-hidden="true" />
            {current?.status === 'locked' ? <LockIcon /> : <ReelIcon />}
          </div>
          <div className="min-w-0">
            {current?.status === 'locked' && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">Sealed until {formatDate(current.unlocks_at, { day: 'numeric', month: 'long' })}</p>
                <h2 className="mt-1 text-lg font-bold text-gray-lighter sm:text-xl">
                  Your {current.year} Wrapped unlocks in {daysUntil(current.unlocks_at)} {plural(daysUntil(current.unlocks_at), 'day')}
                </h2>
                <p className="mt-0.5 text-sm text-gray-muted">We're keeping score. No peeking.</p>
              </>
            )}
            {current?.status === 'not_enough' && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">{current.year} Wrapped</p>
                <h2 className="mt-1 text-lg font-bold text-gray-lighter sm:text-xl">
                  Rate {current.min_films - current.films} more {plural(current.min_films - current.films, 'film')} this year to generate yours
                </h2>
                <p className="mt-0.5 text-sm text-gray-muted">Five films is all it takes.</p>
              </>
            )}
            {current?.status === 'ready' && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">{current.year} Wrapped</p>
                <h2 className="mt-1 text-lg font-bold text-gray-lighter sm:text-xl">Your {current.year} story, whenever you want it</h2>
                <p className="mt-0.5 text-sm text-gray-muted">It keeps counting until New Year's Eve.</p>
              </>
            )}
            {!current && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">Wrapped</p>
                <h2 className="mt-1 text-lg font-bold text-gray-lighter sm:text-xl">Your year in film, every December</h2>
              </>
            )}
          </div>
        </div>
        {current?.status === 'ready' && (
          <button
            type="button"
            onClick={() => play(current.year)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-magenta/40 bg-magenta/10 px-5 py-2.5 text-sm font-semibold text-magenta transition-colors hover:bg-magenta/20"
          >
            <ReelIcon />
            Replay {current.year}
          </button>
        )}
      </div>
      {replays.filter((y) => y.year !== current?.year).length > 0 && (
        <Replays years={replays.filter((y) => y.year !== current?.year)} onPlay={play} />
      )}
    </section>
  )
}

function Replays({ years, onPlay }: { years: { year: number }[]; onPlay: (year: number) => void }) {
  return (
    <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
      <span className="text-xs text-gray-muted">Replay</span>
      {years.map((y) => (
        <button
          key={y.year}
          type="button"
          onClick={() => onPlay(y.year)}
          className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-gray-light transition-colors hover:border-teal hover:text-teal"
        >
          {y.year}
        </button>
      ))}
    </div>
  )
}
