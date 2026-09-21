import HorizontalBars from '../../../components/charts/HorizontalBars'
import type { Category } from '../../../types'
import type { DashboardStats } from '../../../types/stats'
import { plural } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'

interface Props {
  stats: DashboardStats
  categories: Category[]
  index: number
  className?: string
}

/** The user's own colour-coded categories, joined client-side with the
 * counts the stats endpoint returns per category id. */
export default function CategoriesSection({ stats, categories, index, className }: Props) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const rows = stats.categories
    .map((c) => ({ stat: c, cat: byId.get(c.category_id) }))
    .filter((r): r is { stat: (typeof stats.categories)[number]; cat: Category } => !!r.cat && r.stat.count > 0)
  if (rows.length === 0) return null

  return (
    <DashboardCard title="Your categories" subtitle="Films per category you've made" index={index} className={className}>
      <HorizontalBars
        rows={rows.map(({ stat, cat }) => ({
          key: cat.id,
          label: cat.name,
          value: stat.count,
          valueLabel: `${stat.count} ${plural(stat.count, 'film')}`,
          sub: stat.avg_rating != null ? `${stat.avg_rating.toFixed(1)}★ avg` : undefined,
          color: cat.fill_color ?? cat.outline_color ?? undefined,
          thumb: (
            <span
              className="block h-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: cat.fill_color ?? 'transparent', border: `2px solid ${cat.outline_color ?? cat.fill_color ?? '#888887'}` }}
              aria-hidden="true"
            />
          ),
        }))}
      />
    </DashboardCard>
  )
}
