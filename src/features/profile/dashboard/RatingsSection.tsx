import Donut from '../../../components/charts/Donut'
import HorizontalBars from '../../../components/charts/HorizontalBars'
import { SENTIMENT } from '../../../components/charts/chartTheme'
import type { DashboardStats } from '../../../types/stats'
import { formatPercent, plural } from '../../../utils/formatStats'
import { RATING_LABELS, ratingLabel } from '../../../utils/ratings'
import DashboardCard from './DashboardCard'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
}

export default function RatingsSection({ stats, index, className }: Props) {
  const r = stats.ratings
  const films = stats.headline.films
  const rows = [...r.distribution].reverse().map((d) => ({
    key: d.rating,
    label: (
      <span className="flex items-center gap-2">
        <span className="tracking-tight text-gray-lighter" aria-hidden="true">
          {'★'.repeat(d.rating)}
        </span>
        <span className="text-xs text-gray-muted">{RATING_LABELS[d.rating - 1]}</span>
      </span>
    ),
    value: d.count,
    valueLabel: `${d.count}`,
  }))

  return (
    <DashboardCard
      title="How you rate"
      subtitle={r.most_common ? `Most often: "${ratingLabel(r.most_common)}"` : undefined}
      index={index}
      className={className}
      films={films}
      minFilms={1}
    >
      <HorizontalBars rows={rows} dense />
      <Donut
        ariaLabel="Share of films loved, okay and disliked"
        segments={[
          { label: 'Loved (4–5★)', value: Math.round(r.loved_share * films), color: SENTIMENT.positive, valueLabel: formatPercent(r.loved_share) },
          { label: 'Okay (3★)', value: Math.round(r.okay_share * films), color: SENTIMENT.neutral, valueLabel: formatPercent(r.okay_share) },
          { label: 'Not for you (1–2★)', value: Math.round(r.disliked_share * films), color: SENTIMENT.negative, valueLabel: formatPercent(r.disliked_share) },
        ]}
      >
        <span className="flex flex-col leading-none">
          <span className="text-2xl font-semibold text-gray-lighter">{stats.headline.avg_rating?.toFixed(1) ?? '—'}</span>
          <span className="mt-1 text-[10px] uppercase tracking-wide text-gray-muted">avg ★</span>
        </span>
      </Donut>
      <p className="text-xs text-gray-muted">
        {films} {plural(films, 'film')} rated
        {stats.headline.films_excluding_onboarding !== films && ` · ${films - stats.headline.films_excluding_onboarding} from your welcome picks`}
      </p>
    </DashboardCard>
  )
}
