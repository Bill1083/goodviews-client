import StatTile from '../../../components/charts/StatTile'
import { useInView } from '../../../hooks/useInView'
import type { DashboardStats } from '../../../types/stats'
import { formatDate, formatMinutesLong, plural } from '../../../utils/formatStats'
import { ratingLabel } from '../../../utils/ratings'

interface Props {
  stats: DashboardStats
  className?: string
}

/** The numbers the dashboard leads with. Films watched is the hero figure;
 * everything else is a plain tile. Counts up once scrolled into view. */
export default function HeadlineStrip({ stats, className = '' }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const h = stats.headline
  const hours = h.watch_minutes / 60
  const topRewatch = stats.rewatches.top[0]

  return (
    <div ref={ref} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 ${className}`}>
      <StatTile
        label="Films watched"
        value={h.films}
        hero
        active={inView}
        sub={h.first_rated_at ? `since ${formatDate(h.first_rated_at, { month: 'short', year: 'numeric' })}` : undefined}
      />
      <StatTile
        label="Time watched"
        value={hours}
        format={(v) => `${Math.round(v).toLocaleString()} ${plural(Math.round(v), 'hr')}`}
        active={inView}
        sub={h.watch_minutes >= 1440 ? `≈ ${formatMinutesLong(h.watch_minutes)}, rewatches included` : 'rewatches included'}
      />
      <StatTile
        label="Average rating"
        value={h.avg_rating ?? 0}
        format={(v) => `${v.toFixed(1)}★`}
        active={inView}
        sub={h.avg_rating != null ? ratingLabel(h.avg_rating) : undefined}
      />
      <StatTile
        label="Rewatches"
        value={h.rewatches}
        active={inView}
        sub={topRewatch ? `${topRewatch.movie.title} ×${topRewatch.rewatch_count + 1}` : 'nothing twice, yet'}
      />
      <StatTile
        label="Reviews written"
        value={h.written_reviews}
        active={inView}
        sub={h.written_words > 0 ? `${h.written_words.toLocaleString()} ${plural(h.written_words, 'word')}` : 'ratings only so far'}
      />
      <StatTile
        label="Watchlist"
        value={stats.watchlist.count}
        active={inView}
        sub={stats.watchlist.total_minutes > 0 ? `${formatMinutesLong(stats.watchlist.total_minutes)} to go` : undefined}
      />
    </div>
  )
}
