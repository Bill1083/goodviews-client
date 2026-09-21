import { Link } from 'react-router-dom'
import SkeletonBlock from '../../../components/charts/SkeletonBlock'

/** Mirrors the loaded layout (hub card, six tiles, three cards) so the page
 * doesn't jump when the numbers arrive. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading your taste dashboard">
      <SkeletonBlock className="h-24 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonBlock key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonBlock className="h-72 rounded-2xl md:col-span-2" />
        <SkeletonBlock className="h-72 rounded-2xl" />
        <SkeletonBlock className="h-64 rounded-2xl" />
        <SkeletonBlock className="h-64 rounded-2xl md:col-span-2" />
      </div>
    </div>
  )
}

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-2xl border border-pink-brand/30 bg-pink-brand/5 p-5">
      <p className="text-sm text-gray-light">Your taste stats didn't load.</p>
      <button type="button" onClick={onRetry} className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-gray-lighter hover:border-teal hover:text-teal">
        Try again
      </button>
    </section>
  )
}

export function EmptyDashboard() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-navy-card/40 px-6 py-10 text-center">
      <p className="text-4xl" aria-hidden="true">🎬</p>
      <h3 className="text-lg font-semibold text-gray-lighter">Your taste profile is blank</h3>
      <p className="max-w-sm text-sm text-gray-muted">Rate your first film and we'll start mapping what you love — genres, eras, the directors you can't quit, and how you stack up against the crowd.</p>
      <Link to="/" className="mt-1 rounded-full bg-magenta px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105">
        Find something to watch
      </Link>
    </section>
  )
}
