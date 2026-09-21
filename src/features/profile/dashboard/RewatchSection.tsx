import type { DashboardStats, MovieRef } from '../../../types/stats'
import { plural } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'
import PosterStrip from './PosterStrip'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
  onMovie: (movie: MovieRef) => void
}

export default function RewatchSection({ stats, index, className, onMovie }: Props) {
  const rw = stats.rewatches
  if (rw.total === 0) return null
  const top = rw.top[0]
  return (
    <DashboardCard
      title="Comfort films"
      subtitle={`${rw.total} ${plural(rw.total, 'rewatch', 'rewatches')} in total`}
      index={index}
      className={className}
    >
      {top && (
        <p className="text-sm leading-snug text-gray-light">
          You keep coming back to <span className="font-semibold text-gray-lighter">{top.movie.title}</span> — watched {top.rewatch_count + 1} times.
        </p>
      )}
      <PosterStrip films={rw.top} onSelect={onMovie} showRewatch />
    </DashboardCard>
  )
}
