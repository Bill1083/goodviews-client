import type { DashboardStats, MovieRef } from '../../../types/stats'
import { formatMinutesLong, formatPercent, plural } from '../../../utils/formatStats'
import { genreLabel, genreStyle } from '../../../utils/genres'
import DashboardCard from './DashboardCard'
import PosterThumb from './PosterThumb'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
  onMovie: (movie: MovieRef) => void
}

export default function WatchlistSection({ stats, index, className, onMovie }: Props) {
  const w = stats.watchlist
  if (w.count === 0) return null
  const gap = w.genre_gap[0]

  return (
    <DashboardCard
      title="The backlog"
      subtitle={`${w.count} ${plural(w.count, 'film')} waiting${w.total_minutes > 0 ? ` · ${formatMinutesLong(w.total_minutes)} of viewing` : ''}`}
      index={index}
      className={className}
    >
      {w.oldest && (
        <div className="flex items-center gap-3">
          <PosterThumb path={w.oldest.movie.poster_path} title={w.oldest.movie.title} size="sm" onClick={() => onMovie(w.oldest!.movie)} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">Longest wait</p>
            <p className="truncate text-sm font-semibold text-gray-lighter">{w.oldest.movie.title}</p>
            <p className="text-xs text-gray-light">
              {w.oldest.days_waiting === 0 ? 'added today' : `waiting ${w.oldest.days_waiting} ${plural(w.oldest.days_waiting, 'day')}`}
            </p>
          </div>
        </div>
      )}
      {gap && (
        <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">Intention gap</p>
          <p className="mt-1 text-sm leading-snug text-gray-light">
            <span className="mr-1" aria-hidden="true">{genreStyle(gap.id).emoji}</span>
            {formatPercent(gap.watchlist_share)} of your backlog is {genreLabel(gap.id, gap.name)}, but only {formatPercent(gap.watched_share)} of what you've watched is.
          </p>
        </div>
      )}
    </DashboardCard>
  )
}
