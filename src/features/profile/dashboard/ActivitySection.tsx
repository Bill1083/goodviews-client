import BarChart from '../../../components/charts/BarChart'
import HeatStrip from '../../../components/charts/HeatStrip'
import { useInView } from '../../../hooks/useInView'
import type { DashboardStats } from '../../../types/stats'
import { formatMonthKey, plural } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function hourLabel(h: number): string {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

export default function ActivitySection({ stats, index, className }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const a = stats.activity
  const total = a.months.reduce((s, m) => s + m.count, 0)
  const busiestIndex = a.busiest_month ? a.months.findIndex((m) => m.month === a.busiest_month?.month) : -1
  const months = a.months.map((m) => ({
    label: formatMonthKey(m.month).slice(0, 3),
    title: formatMonthKey(m.month, false),
    value: m.count,
  }))
  const peakWeekday = a.weekday_counts.indexOf(Math.max(...a.weekday_counts))
  const peakHour = a.hour_counts.indexOf(Math.max(...a.hour_counts))

  return (
    <DashboardCard
      title="Your rhythm"
      subtitle={`${total} ${plural(total, 'film')} logged in the last 12 months`}
      index={index}
      className={className}
      films={stats.headline.films_excluding_onboarding}
      minFilms={1}
    >
      <div ref={ref} className="flex flex-col gap-5">
        <BarChart
          data={months}
          ariaLabel="Films logged per month, last twelve months"
          height={120}
          highlightIndex={busiestIndex >= 0 ? busiestIndex : null}
          animate={inView}
        />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Busiest month" value={a.busiest_month ? formatMonthKey(a.busiest_month.month) : '—'} />
          <Stat label="Current streak" value={`${a.current_streak_weeks} ${plural(a.current_streak_weeks, 'wk')}`} />
          <Stat label="Longest streak" value={`${a.longest_streak_weeks} ${plural(a.longest_streak_weeks, 'wk')}`} />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">
            By weekday {a.weekday_counts[peakWeekday] > 0 && <span className="normal-case tracking-normal text-gray-medium">· {WEEKDAYS[peakWeekday]}s win</span>}
          </p>
          <HeatStrip
            cells={a.weekday_counts.map((v, i) => ({ label: WEEKDAYS[i][0], title: WEEKDAYS[i], value: v }))}
            ariaLabel="Films logged by weekday"
            valueFormatter={(v) => `${v} ${plural(v, 'film')}`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">
            By hour {a.hour_counts[peakHour] > 0 && <span className="normal-case tracking-normal text-gray-medium">· peak around {hourLabel(peakHour)}</span>}
          </p>
          <HeatStrip
            cells={a.hour_counts.map((v, i) => ({ label: hourLabel(i), value: v }))}
            ariaLabel="Films logged by hour of day"
            valueFormatter={(v) => `${v} ${plural(v, 'film')}`}
            labelEvery={6}
          />
        </div>
      </div>
    </DashboardCard>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-gray-lighter">{value}</p>
    </div>
  )
}
