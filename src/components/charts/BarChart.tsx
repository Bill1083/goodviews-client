import { ChartTooltip, useChartTooltip } from './ChartTooltip'
import { BASELINE, INK, SERIES_PRIMARY } from './chartTheme'

export interface BarDatum {
  label: string
  value: number
  /** Longer label for the tooltip, e.g. "March 2026" for a "Mar" axis tick. */
  title?: string
  sub?: string
}

interface Props {
  data: BarDatum[]
  ariaLabel: string
  /** Plot height in px (the axis band is added below it). */
  height?: number
  color?: string
  /** Bar to emphasise (e.g. the busiest month); others stay in the same hue at reduced opacity. */
  highlightIndex?: number | null
  valueFormatter?: (value: number) => string
  /** Grow-in animation, typically gated on the card being in view. */
  animate?: boolean
  /** Which x labels to draw: every one, or every nth to avoid collisions. */
  labelEvery?: number
}

/** Column chart in plain HTML: ≤24px bars with a 4px rounded top on a shared
 * baseline, 2px surface gaps, one hue, the maximum directly labelled and the
 * rest in the hover/focus readout. */
export default function BarChart({
  data,
  ariaLabel,
  height = 150,
  color = SERIES_PRIMARY,
  highlightIndex = null,
  valueFormatter = (v) => String(v),
  animate = true,
  labelEvery = 1,
}: Props) {
  const { containerRef, tip, show, hide } = useChartTooltip()
  const max = Math.max(0, ...data.map((d) => d.value))
  const maxIndex = max > 0 ? data.findIndex((d) => d.value === max) : -1

  return (
    <div ref={containerRef} className="relative" role="img" aria-label={ariaLabel}>
      <div className="flex items-end gap-0.5 sm:gap-1" style={{ height }}>
        {data.map((d, i) => {
          const h = max > 0 ? Math.max(d.value > 0 ? 3 : 0, (d.value / max) * (height - 22)) : 0
          const emphasised = highlightIndex === null ? true : i === highlightIndex
          const labelled = i === maxIndex || i === highlightIndex
          return (
            <button
              key={`${d.label}-${i}`}
              type="button"
              className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end focus:outline-none"
              aria-label={`${d.title ?? d.label}: ${valueFormatter(d.value)}`}
              onPointerEnter={(e) => show(e.currentTarget, d.title ?? d.label, valueFormatter(d.value), d.sub)}
              onPointerLeave={hide}
              onFocus={(e) => show(e.currentTarget, d.title ?? d.label, valueFormatter(d.value), d.sub)}
              onBlur={hide}
            >
              {labelled && d.value > 0 && (
                <span className="mb-1 text-[11px] font-semibold leading-none text-gray-lighter">{valueFormatter(d.value)}</span>
              )}
              <span
                className={`w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-100 group-focus-visible:ring-2 group-focus-visible:ring-teal/60 ${animate ? 'bar-grow' : ''}`}
                style={{
                  height: h,
                  backgroundColor: color,
                  opacity: emphasised ? 1 : 0.45,
                  animationDelay: animate ? `${Math.min(i, 24) * 35}ms` : undefined,
                }}
              />
            </button>
          )
        })}
      </div>
      <div className="h-px w-full" style={{ backgroundColor: BASELINE }} />
      <div className="mt-1.5 flex gap-0.5 sm:gap-1">
        {data.map((d, i) => (
          <span
            key={`${d.label}-${i}-label`}
            className="min-w-0 flex-1 truncate text-center text-[10px] leading-none"
            style={{ color: i === highlightIndex ? INK.primary : INK.muted, visibility: i % labelEvery === 0 ? 'visible' : 'hidden' }}
          >
            {d.label}
          </span>
        ))}
      </div>
      <ChartTooltip tip={tip} containerRef={containerRef} />
    </div>
  )
}
