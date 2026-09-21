import { SERIES_PRIMARY, TRACK } from '../../../components/charts/chartTheme'
import type { DashboardStats, MovieRef, RuntimeFilm } from '../../../types/stats'
import { formatPercent, formatRuntime } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'
import PosterThumb from './PosterThumb'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
  onMovie: (movie: MovieRef) => void
}

function Meter({ label, share }: { label: string; share: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-gray-light">{label}</span>
        <span className="font-semibold text-gray-lighter">{formatPercent(share)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-r-[4px]" style={{ backgroundColor: TRACK }}>
        <div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(2, share * 100)}%`, backgroundColor: SERIES_PRIMARY }} />
      </div>
    </div>
  )
}

function FilmRow({ heading, film, onMovie }: { heading: string; film: RuntimeFilm; onMovie: (movie: MovieRef) => void }) {
  return (
    <li className="flex items-center gap-3">
      <PosterThumb path={film.poster_path} title={film.title} size="xs" onClick={() => onMovie(film)} />
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-wide text-gray-muted">{heading}</span>
        <span className="block truncate text-sm text-gray-lighter">
          {film.title} <span className="text-gray-muted">· {formatRuntime(film.runtime)}</span>
        </span>
      </span>
    </li>
  )
}

export default function RuntimeSection({ stats, index, className, onMovie }: Props) {
  const r = stats.runtime
  return (
    <DashboardCard
      title="Attention span"
      subtitle={r.avg_minutes != null ? `Your average film runs ${formatRuntime(r.avg_minutes)}` : undefined}
      index={index}
      className={className}
      films={stats.headline.films}
      minFilms={2}
    >
      {r.sample_size === 0 ? (
        <p className="text-sm text-gray-muted">Runtimes are still being gathered.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <Meter label="Epics over 2 hours" share={r.share_over_2h} />
            <Meter label="Quick ones under 90 minutes" share={r.share_under_90m} />
          </div>
          <ul className="flex flex-col gap-2">
            {r.longest && <FilmRow heading="Longest sit" film={r.longest} onMovie={onMovie} />}
            {r.shortest && r.shortest.id !== r.longest?.id && <FilmRow heading="Shortest" film={r.shortest} onMovie={onMovie} />}
          </ul>
        </>
      )}
    </DashboardCard>
  )
}
