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

export default function TopRatedShelf({ stats, index, className, onMovie }: Props) {
  const t = stats.top_rated
  if (t.five_star_count === 0) return null
  return (
    <DashboardCard
      title="Five stars, no notes"
      subtitle={`${t.five_star_count} ${plural(t.five_star_count, 'film')} you loved without reservation`}
      index={index}
      className={className}
    >
      <PosterStrip films={t.films} onSelect={onMovie} size="md" showRewatch />
    </DashboardCard>
  )
}
