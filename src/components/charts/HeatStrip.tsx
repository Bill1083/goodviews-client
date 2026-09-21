import { ChartTooltip, useChartTooltip } from './ChartTooltip'
import { SERIES_PRIMARY, sequentialAlpha } from './chartTheme'

export interface HeatCell {
  label: string
  /** Full label for the readout ("Saturday", "10pm"). */
  title?: string
  value: number
}

interface Props {
  cells: HeatCell[]
  ariaLabel: string
  valueFormatter?: (value: number) => string
  /** Draw every nth x label (hours use 6). */
  labelEvery?: number
  color?: string
}

/** One-hue sequential strip (light → dark by magnitude), one cell per
 * category, each cell its own hover / focus target. */
export default function HeatStrip({ cells, ariaLabel, valueFormatter = (v) => String(v), labelEvery = 1, color = SERIES_PRIMARY }: Props) {
  const { containerRef, tip, show, hide } = useChartTooltip()
  const max = Math.max(0, ...cells.map((c) => c.value))
  return (
    <div ref={containerRef} className="relative" role="img" aria-label={ariaLabel}>
      <div className="flex gap-0.5">
        {cells.map((cell, i) => (
          <button
            key={`${cell.label}-${i}`}
            type="button"
            className="h-7 min-w-0 flex-1 rounded-[3px] transition-transform hover:scale-y-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
            style={{ backgroundColor: color, opacity: cell.value > 0 ? sequentialAlpha(cell.value, max) : 0.08 }}
            aria-label={`${cell.title ?? cell.label}: ${valueFormatter(cell.value)}`}
            onPointerEnter={(e) => show(e.currentTarget, cell.title ?? cell.label, valueFormatter(cell.value))}
            onPointerLeave={hide}
            onFocus={(e) => show(e.currentTarget, cell.title ?? cell.label, valueFormatter(cell.value))}
            onBlur={hide}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-0.5">
        {cells.map((cell, i) => (
          <span
            key={`${cell.label}-${i}-l`}
            // Sparse labels (every 6th hour) may spill over their hidden neighbours rather than truncate.
            className={`min-w-0 flex-1 text-[10px] leading-none text-gray-muted ${labelEvery > 1 ? 'overflow-visible whitespace-nowrap text-left' : 'truncate text-center'}`}
            style={{ visibility: i % labelEvery === 0 ? 'visible' : 'hidden' }}
          >
            {cell.label}
          </span>
        ))}
      </div>
      <ChartTooltip tip={tip} containerRef={containerRef} />
    </div>
  )
}
