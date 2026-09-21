import { ChartTooltip, useChartTooltip } from './ChartTooltip'
import { GRIDLINE, INK, SERIES_PRIMARY, SURFACE } from './chartTheme'

export interface RadarAxis {
  label: string
  /** 0..1 */
  value: number
  /** Tooltip readout, e.g. "40 films · 17%". */
  valueLabel: string
}

interface Props {
  axes: RadarAxis[]
  ariaLabel: string
  size?: number
  color?: string
  animate?: boolean
}

/** Single-series radar ("taste DNA"): hairline rings, one polygon as a 10%
 * wash with a 2px outline, ≥8px vertex markers ringed in the surface colour,
 * axis labels in muted ink. Vertices are the hover / focus targets. */
export default function RadarChart({ axes, ariaLabel, size = 260, color = SERIES_PRIMARY, animate = true }: Props) {
  const { containerRef, tip, show, hide } = useChartTooltip()
  const n = axes.length
  const cx = size / 2
  const cy = size / 2
  const labelGutter = 40
  const r = size / 2 - labelGutter

  const point = (i: number, ratio: number) => {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2
    return { x: cx + Math.cos(angle) * r * ratio, y: cy + Math.sin(angle) * r * ratio, angle }
  }

  if (n < 3) return null

  const polygon = axes.map((a, i) => point(i, Math.max(0.04, a.value))).map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div ref={containerRef} className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={ariaLabel} className="overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={axes.map((_, i) => point(i, ring)).map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={GRIDLINE}
            strokeWidth={1}
          />
        ))}
        {axes.map((_, i) => {
          const p = point(i, 1)
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={GRIDLINE} strokeWidth={1} />
        })}
        <polygon
          points={polygon}
          fill={color}
          fillOpacity={0.14}
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          className={animate ? 'wrapped-pop' : undefined}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        {axes.map((a, i) => {
          const p = point(i, Math.max(0.04, a.value))
          const l = point(i, 1.18)
          const anchor = Math.abs(Math.cos(l.angle)) < 0.2 ? 'middle' : Math.cos(l.angle) > 0 ? 'start' : 'end'
          return (
            <g key={a.label}>
              <text x={l.x} y={l.y} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fill={INK.muted}>
                {a.label}
              </text>
              {/* transparent, oversized hit target; the visible marker sits inside it */}
              <circle
                cx={p.x}
                cy={p.y}
                r={14}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${a.label}: ${a.valueLabel}`}
                className="cursor-default focus:outline-none"
                onPointerEnter={(e) => show(e.currentTarget, a.label, a.valueLabel)}
                onPointerLeave={hide}
                onFocus={(e) => show(e.currentTarget, a.label, a.valueLabel)}
                onBlur={hide}
              />
              <circle cx={p.x} cy={p.y} r={5} fill={color} stroke={SURFACE} strokeWidth={2} className="pointer-events-none" />
            </g>
          )
        })}
      </svg>
      <ChartTooltip tip={tip} containerRef={containerRef} />
    </div>
  )
}
