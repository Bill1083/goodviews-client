import type { ReactNode } from 'react'
import { SERIES_PRIMARY, TRACK } from './chartTheme'

export interface HBarRow {
  key: string | number
  label: ReactNode
  value: number
  /** Display text for the value at the bar tip; defaults to the number. */
  valueLabel?: string
  /** Secondary line under the label (e.g. "avg 4.2★"). */
  sub?: ReactNode
  /** Left-hand thumbnail (poster, profile photo, colour dot). */
  thumb?: ReactNode
  /** Per-row accent (genre / category colour). Rows always carry a text label. */
  color?: string
  onClick?: () => void
}

interface Props {
  rows: HBarRow[]
  /** Scale maximum; defaults to the largest value. */
  max?: number
  animate?: boolean
  dense?: boolean
}

/** Ranked list with a thin bar per row: a table-like figure where every row
 * is labelled and its value sits at the bar tip. */
export default function HorizontalBars({ rows, max, animate = true, dense = false }: Props) {
  const scale = Math.max(1, max ?? Math.max(0, ...rows.map((r) => r.value)))
  return (
    <ul className={`flex flex-col ${dense ? 'gap-1.5' : 'gap-2.5'}`}>
      {rows.map((row, i) => {
        const width = `${Math.max(2, Math.min(100, (row.value / scale) * 100))}%`
        const body = (
          <>
            {row.thumb && <span className="shrink-0">{row.thumb}</span>}
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-gray-lighter">{row.label}</span>
                <span className="shrink-0 text-xs font-semibold text-gray-light">{row.valueLabel ?? row.value}</span>
              </span>
              <span className="mt-1 block h-2 w-full overflow-hidden rounded-r-[4px]" style={{ backgroundColor: TRACK }}>
                <span
                  className={`block h-full rounded-r-[4px] ${animate ? 'bar-grow-x' : ''}`}
                  style={{ width, backgroundColor: row.color ?? SERIES_PRIMARY, animationDelay: animate ? `${Math.min(i, 12) * 45}ms` : undefined }}
                />
              </span>
              {row.sub && <span className="mt-0.5 block text-[11px] text-gray-muted">{row.sub}</span>}
            </span>
          </>
        )
        return (
          <li key={row.key}>
            {row.onClick ? (
              <button
                type="button"
                onClick={row.onClick}
                className="flex w-full items-center gap-3 rounded-lg text-left transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
              >
                {body}
              </button>
            ) : (
              <div className="flex items-center gap-3">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
