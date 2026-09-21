import BarChart from '../../../components/charts/BarChart'
import { useInView } from '../../../hooks/useInView'
import type { DashboardStats, MovieRef } from '../../../types/stats'
import { plural } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'
import PosterThumb from './PosterThumb'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
  onMovie: (movie: MovieRef) => void
}

export default function DecadesSection({ stats, index, className, onMovie }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const films = stats.headline.films
  const { oldest, newest, mean_release_year } = stats.eras
  const data = stats.decades.map((d) => ({
    label: `${String(d.decade).slice(2)}s`,
    title: `${d.decade}s`,
    value: d.count,
    sub: d.avg_rating != null ? `avg ${d.avg_rating.toFixed(1)}★` : undefined,
  }))

  return (
    <DashboardCard
      title="Your eras"
      subtitle={mean_release_year ? `Your average film is from ${Math.round(mean_release_year)}` : undefined}
      index={index}
      className={className}
      films={films}
      minFilms={2}
    >
      <div ref={ref}>
        {data.length > 0 ? (
          <BarChart data={data} ariaLabel="Films watched per decade of release" height={130} animate={inView} labelEvery={data.length > 8 ? 2 : 1} />
        ) : (
          <p className="text-sm text-gray-muted">No release dates yet.</p>
        )}
      </div>
      {(oldest || newest) && (
        <ul className="flex flex-col gap-2">
          {oldest && (
            <li className="flex items-center gap-3">
              <PosterThumb path={oldest.poster_path} title={oldest.title} size="xs" onClick={() => onMovie(oldest)} />
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wide text-gray-muted">Oldest</span>
                <span className="block truncate text-sm text-gray-lighter">
                  {oldest.title} <span className="text-gray-muted">({oldest.year})</span>
                </span>
              </span>
            </li>
          )}
          {newest && newest.id !== oldest?.id && (
            <li className="flex items-center gap-3">
              <PosterThumb path={newest.poster_path} title={newest.title} size="xs" onClick={() => onMovie(newest)} />
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wide text-gray-muted">Newest</span>
                <span className="block truncate text-sm text-gray-lighter">
                  {newest.title} <span className="text-gray-muted">({newest.year})</span>
                </span>
              </span>
            </li>
          )}
        </ul>
      )}
      {stats.decades.length > 0 && (
        <p className="text-xs text-gray-muted">
          Spanning {stats.decades.length} {plural(stats.decades.length, 'decade')}
        </p>
      )}
    </DashboardCard>
  )
}
