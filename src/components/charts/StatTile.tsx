import type { ReactNode } from 'react'
import { useCountUp } from '../../hooks/useCountUp'

interface Props {
  label: string
  /** Numeric value: counts up from 0 when `active` (in view). */
  value: number
  format?: (value: number) => string
  /** Small line under the value ("≈ 3 days 4 hrs"). */
  sub?: ReactNode
  icon?: ReactNode
  active?: boolean
  /** Hero variant: the one number the dashboard leads with. */
  hero?: boolean
}

/** Stat tile: label · value (proportional figures, never tabular) · optional
 * sub-line. The number is the chart. */
export default function StatTile({ label, value, format = (v) => Math.round(v).toLocaleString(), sub, icon, active = true, hero = false }: Props) {
  const shown = useCountUp(value, active)
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-muted">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </p>
      <p className={`truncate font-semibold leading-none text-gray-lighter ${hero ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`}>
        {format(shown)}
      </p>
      {sub && <p className="truncate text-xs text-gray-medium">{sub}</p>}
    </div>
  )
}
